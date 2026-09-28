import {
  createChatThread,
  createIngestionJob,
  createKnowledgeSource,
  recordAnswerCitations,
  recordChatMessage,
  recordExtractedContent,
  recordRetrievalRun,
  replaceActiveChunks,
} from "./use-cases";
import type {
  KnowledgeRepository,
  OwnerContext,
  RetrievalChunkDto,
  RetrievalFilters,
} from "./repositories";
import {
  assertSourceMetadata,
  assertWithinTextLimit,
  deriveSourceTitle,
  knowledgeLimits,
  normalizeUrlForFingerprint,
  type DocumentSourceMetadata,
  type NoteSourceMetadata,
  type UrlSourceMetadata,
} from "@/domain/knowledge";
import { invariant } from "@/domain/knowledge/errors";
import {
  chunkTextForRetrieval,
  createNoteMetadata,
  createPromptContextHash,
  hashText,
  thinLoopLimits,
  validateThinLoopNoteBody,
} from "./text-processing";

const supportedDocumentMimeTypes = new Set([
  "text/markdown",
  "text/plain",
  "text/x-markdown",
]);
const supportedDocumentExtensions = [".md", ".markdown", ".txt"];
const maxInlineDocumentBytes = 256 * 1024;

export type EmbeddingGateway = {
  embed(input: string): Promise<number[]>;
  embedMany(input: string[]): Promise<number[][]>;
};

export type UrlFetchGateway = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;
export type AnswerGateway = {
  answer(input: {
    question: string;
    chunks: RetrievalChunkDto[];
  }): AsyncIterable<string>;
};

export type SaveTextNoteResult =
  | {
      ok: true;
      sourceId: string;
      status: "ready";
      chunkCount: number;
    }
  | {
      ok: false;
      message: string;
    };

export async function saveTextNote(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  title?: string | null;
  body: string;
}): Promise<SaveTextNoteResult> {
  const body = validateThinLoopNoteBody(input.body);
  const metadata = createNoteMetadata(body);
  const source = await createKnowledgeSource(input.repository, input.owner, {
    metadata,
    noteBody: body,
    title: input.title,
    type: "note",
  });

  return processTextSource({
    failureMessage:
      "The note was saved, but processing failed. Try again later.",
    lastErrorMessage: "Inline note processing failed",
    owner: input.owner,
    repository: input.repository,
    embeddings: input.embeddings,
    sourceId: source.source_id,
    text: body,
  });
}

export async function saveTextDocument(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  fileName: string;
  mimeType: string;
  byteSize: number;
  text: string;
}): Promise<SaveTextNoteResult> {
  const fileName = input.fileName.trim();
  const mimeType = input.mimeType.trim() || "text/plain";
  const text = input.text.trim();

  invariant(fileName.length > 0, "File name is required", "file_name_required");
  invariant(
    text.length > 0,
    "Document text is required",
    "document_text_required",
  );
  invariant(
    input.byteSize > 0 && input.byteSize <= maxInlineDocumentBytes,
    "Document must be 256 KB or smaller",
    "document_too_large",
  );
  invariant(
    isSupportedTextDocument(fileName, mimeType),
    "Upload a plain text or Markdown file",
    "unsupported_document_type",
  );
  assertWithinTextLimit("Document text", text, knowledgeLimits.sourceText);

  const fileHash = hashText(text);
  const metadata: DocumentSourceMetadata = {
    byte_size: input.byteSize,
    file_hash: fileHash,
    file_name: fileName,
    mime_type: mimeType,
    storage_bucket: "inline-upload",
    storage_path: `inline-upload/${fileHash}/${fileName}`,
  };

  const source = await createKnowledgeSource(input.repository, input.owner, {
    metadata,
    title: fileName,
    type: "document",
  });

  return processTextSource({
    failureMessage:
      "The document was saved, but processing failed. Try again later.",
    lastErrorMessage: "Inline document processing failed",
    owner: input.owner,
    repository: input.repository,
    embeddings: input.embeddings,
    sourceId: source.source_id,
    text,
  });
}

export async function saveUrlSource(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  url: string;
  fetcher?: UrlFetchGateway;
}): Promise<SaveTextNoteResult> {
  const canonicalUrl = validateIngestibleUrl(input.url);
  const fetched = await fetchUrlContent(canonicalUrl, input.fetcher ?? fetch);
  assertWithinTextLimit(
    "URL content",
    fetched.text,
    knowledgeLimits.sourceText,
  );

  const metadata: UrlSourceMetadata = {
    canonical_url: canonicalUrl,
    original_url: input.url.trim(),
    url_hash: hashText(canonicalUrl),
  };

  const source = await createKnowledgeSource(input.repository, input.owner, {
    metadata,
    title: fetched.title,
    type: "url",
  });

  return processTextSource({
    failureMessage:
      "The URL was saved, but processing failed. Try again later.",
    lastErrorMessage: "URL processing failed",
    owner: input.owner,
    repository: input.repository,
    embeddings: input.embeddings,
    sourceId: source.source_id,
    text: fetched.text,
  });
}
export async function updateTextNote(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  sourceId: string;
  title?: string | null;
  body: string;
}): Promise<SaveTextNoteResult> {
  const body = validateThinLoopNoteBody(input.body);
  const source = await input.repository.getSourceForOwner({
    owner: input.owner,
    sourceId: input.sourceId,
  });

  invariant(source !== null, "Source not found", "source_not_found");
  invariant(source.deletedAt === null, "Source is deleted", "source_deleted");
  invariant(
    source.type === "note",
    "Only notes can be edited",
    "invalid_source_type",
  );
  assertSourceMetadata("note", source.metadata);

  const metadata: NoteSourceMetadata = {
    ...source.metadata,
    body_hash: hashText(body),
  };
  const title = deriveSourceTitle("note", metadata, input.title, body);
  assertWithinTextLimit("Source title", title, knowledgeLimits.title);

  await input.repository.updateKnowledgeSourceDetails({
    metadata,
    owner: input.owner,
    sourceId: source.id,
    status: "processing",
    title,
  });

  return processTextSource({
    failureMessage:
      "The note was updated, but reprocessing failed. Try again later.",
    lastErrorMessage: "Inline note processing failed",
    owner: input.owner,
    repository: input.repository,
    embeddings: input.embeddings,
    sourceId: source.id,
    text: body,
  });
}

function isSupportedTextDocument(fileName: string, mimeType: string) {
  const lowerName = fileName.toLowerCase();

  return (
    supportedDocumentMimeTypes.has(mimeType.toLowerCase()) ||
    supportedDocumentExtensions.some((extension) =>
      lowerName.endsWith(extension),
    )
  );
}

async function processTextSource(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  sourceId: string;
  text: string;
  failureMessage: string;
  lastErrorMessage: string;
}): Promise<SaveTextNoteResult> {
  const job = await createIngestionJob(input.repository, input.owner, {
    sourceId: input.sourceId,
    status: "running",
  });

  await input.repository.updateSourceStatus({
    owner: input.owner,
    sourceId: input.sourceId,
    status: "processing",
  });

  try {
    const content = await recordExtractedContent(
      input.repository,
      input.owner,
      {
        contentHash: hashText(input.text),
        sourceId: input.sourceId,
        text: input.text,
      },
    );
    const chunks = chunkTextForRetrieval(input.text);
    const embeddings = await input.embeddings.embedMany(
      chunks.map((chunk) => chunk.text),
    );

    await replaceActiveChunks(input.repository, input.owner, {
      chunks,
      contentId: content.contentId,
      embeddings: chunks.map((chunk, index) => ({
        chunkPosition: index + 1,
        contentHash: chunk.contentHash,
        dimensions: thinLoopLimits.embeddingDimensions,
        embedding: embeddings[index] ?? [],
        model: "text-embedding-3-small",
        provider: "openai",
      })),
      expectedDimensions: thinLoopLimits.embeddingDimensions,
    });

    await input.repository.updateSourceStatus({
      owner: input.owner,
      sourceId: input.sourceId,
      status: "ready",
    });
    await input.repository.updateIngestionJob({
      jobId: job.jobId,
      owner: input.owner,
      retryable: false,
      status: "succeeded",
    });

    return {
      chunkCount: chunks.length,
      ok: true,
      sourceId: input.sourceId,
      status: "ready",
    };
  } catch {
    await input.repository.updateSourceStatus({
      owner: input.owner,
      sourceId: input.sourceId,
      status: "failed",
    });
    await input.repository.updateIngestionJob({
      jobId: job.jobId,
      lastErrorCode: "inline_processing_failed",
      lastErrorMessage: input.lastErrorMessage,
      owner: input.owner,
      retryable: true,
      status: "failed_retryable",
    });

    return {
      message: input.failureMessage,
      ok: false,
    };
  }
}

export type SourceLifecycleResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function archiveSource(input: {
  repository: KnowledgeRepository;
  owner: OwnerContext;
  sourceId: string;
}): Promise<SourceLifecycleResult> {
  const source = await input.repository.getSourceForOwner({
    owner: input.owner,
    sourceId: input.sourceId,
  });

  invariant(source !== null, "Source not found", "source_not_found");
  invariant(
    source.deletedAt === null,
    "Source is already archived",
    "source_deleted",
  );

  await input.repository.softDeleteSource({
    owner: input.owner,
    sourceId: input.sourceId,
  });

  return { ok: true, message: "Source archived and removed from retrieval." };
}

export async function retrySourceIngestion(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  owner: OwnerContext;
  sourceId: string;
}): Promise<SaveTextNoteResult> {
  const detail = await input.repository.getSourceDetail({
    owner: input.owner,
    sourceId: input.sourceId,
  });

  invariant(detail !== null, "Source not found", "source_not_found");
  invariant(
    detail.source.status === "failed",
    "Only failed sources can be retried",
    "source_retry_not_failed",
  );
  invariant(
    typeof detail.active_content_text === "string" &&
      detail.active_content_text.trim().length > 0,
    "This source has no extracted text to retry",
    "source_retry_missing_content",
  );

  return processTextSource({
    failureMessage:
      "The retry started, but processing failed again. Try later or update the source.",
    lastErrorMessage: "Source retry processing failed",
    owner: input.owner,
    repository: input.repository,
    embeddings: input.embeddings,
    sourceId: detail.source.source_id,
    text: detail.active_content_text,
  });
}
export async function ensureDefaultThread(
  repository: KnowledgeRepository,
  owner: OwnerContext,
) {
  const existing = await repository.getDefaultChatThread({ owner });

  return (
    existing ?? createChatThread(repository, owner, { title: "Grounded chat" })
  );
}

export async function answerQuestion(input: {
  repository: KnowledgeRepository;
  embeddings: EmbeddingGateway;
  answers: AnswerGateway;
  owner: OwnerContext;
  question: string;
  threadId?: string | null;
  filters?: RetrievalFilters;
  onDelta?: (delta: string) => void;
}) {
  const question = input.question.trim();

  if (!question) {
    throw new Error("Question is required");
  }

  const thread = input.threadId
    ? { threadId: input.threadId, title: "Grounded chat" }
    : await ensureDefaultThread(input.repository, input.owner);

  await recordChatMessage(input.repository, input.owner, {
    content: question,
    role: "user",
    threadId: thread.threadId,
  });

  const queryEmbedding = await input.embeddings.embed(question);
  const chunks = await input.repository.retrieveOwnedChunks({
    embedding: queryEmbedding,
    filters: input.filters,
    limit: 8,
    owner: input.owner,
  });

  const enoughSupport = chunks.length > 0 && chunks[0].score > 0.2;
  const assistantText = enoughSupport
    ? await collectAnswer(
        input.answers.answer({ chunks, question }),
        input.onDelta,
      )
    : "Your saved knowledge does not contain enough information to answer that yet.";

  if (!enoughSupport) {
    input.onDelta?.(assistantText);
  }

  const assistant = await recordChatMessage(input.repository, input.owner, {
    content: assistantText,
    role: "assistant",
    threadId: thread.threadId,
  });

  await recordRetrievalRun(input.repository, input.owner, {
    assistantMessageId: assistant.messageId,
    filters: {
      source_status: "ready",
      ...(input.filters?.collectionId
        ? { collection_id: input.filters.collectionId }
        : {}),
      ...(input.filters?.tagId ? { tag_id: input.filters.tagId } : {}),
    },
    promptContextHash: createPromptContextHash(
      question,
      chunks.map((chunk) => chunk.chunk_hash),
    ),
    query: question,
    results: chunks.slice(0, 8).map((chunk, index) => ({
      chunkId: chunk.chunk_id,
      rank: index + 1,
      score: chunk.score,
    })),
  });

  const citedChunks = enoughSupport
    ? chunks.slice(0, thinLoopLimits.citationsPerAnswer)
    : [];
  const citations = await recordAnswerCitations(input.repository, input.owner, {
    assistantMessageId: assistant.messageId,
    citations: citedChunks.map((chunk, index) => ({
      chunkHashSnapshot: chunk.chunk_hash,
      chunkId: chunk.chunk_id,
      chunkPositionSnapshot: chunk.chunk_position,
      contentVersionSnapshot: chunk.content_version,
      locationSnapshot: {},
      quote: createCitationExcerpt(chunk.text),
      rank: index + 1,
      sourceContentIdSnapshot: chunk.source_content_id,
      sourceFingerprintSnapshot: chunk.source_fingerprint,
      sourceIdSnapshot: chunk.source_id,
      sourceTitleSnapshot: chunk.source_title,
      sourceTypeSnapshot: chunk.source_type,
    })),
  });

  return {
    answer: assistantText,
    citations,
    threadId: thread.threadId,
  };
}

async function collectAnswer(
  stream: AsyncIterable<string>,
  onDelta?: (delta: string) => void,
) {
  let text = "";

  for await (const chunk of stream) {
    text += chunk;
    onDelta?.(chunk);
  }

  return text.trim();
}

function createCitationExcerpt(text: string) {
  const excerpt = text.replace(/\s+/g, " ").trim();

  if (excerpt.length <= 280) {
    return excerpt;
  }

  return `${excerpt.slice(0, 277).trimEnd()}...`;
}

function validateIngestibleUrl(value: string) {
  const trimmed = value.trim();
  invariant(trimmed.length > 0, "URL is required", "url_required");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid URL");
  }

  invariant(
    parsed.protocol === "http:" || parsed.protocol === "https:",
    "Only HTTP and HTTPS URLs can be ingested",
    "unsupported_url_protocol",
  );
  invariant(
    !isBlockedHost(parsed.hostname),
    "This URL host cannot be ingested",
    "blocked_url_host",
  );

  return normalizeUrlForFingerprint(parsed.toString());
}

function isBlockedHost(hostname: string) {
  const lower = hostname.toLowerCase();

  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower === "::1" ||
    lower === "[::1]"
  ) {
    return true;
  }

  const octets = lower.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

async function fetchUrlContent(url: string, fetcher: UrlFetchGateway) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
        "User-Agent": "AI Personal Knowledge Base/0.1",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    invariant(response.ok, "The URL could not be fetched", "url_fetch_failed");
    validateIngestibleUrl(response.url || url);

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    invariant(
      contentLength <= knowledgeLimits.sourceText || contentLength === 0,
      "URL content is too large",
      "url_content_too_large",
    );

    const contentType = response.headers.get("content-type") ?? "";
    invariant(
      contentType.includes("text/html") ||
        contentType.includes("text/plain") ||
        contentType.length === 0,
      "Only web pages and plain text URLs can be ingested",
      "unsupported_url_content_type",
    );

    const rawText = await response.text();
    const extracted = contentType.includes("text/html")
      ? extractHtmlText(rawText)
      : { text: normalizeWhitespace(rawText), title: null };

    invariant(
      extracted.text.length > 0,
      "The URL did not contain readable text",
      "empty_url_content",
    );

    return {
      text: extracted.text,
      title: extracted.title ?? new URL(url).hostname,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractHtmlText(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]
    ? decodeHtmlEntities(normalizeWhitespace(titleMatch[1]))
    : null;
  const text = normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<head[\s\S]*?<\/head>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );

  return { text, title };
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
