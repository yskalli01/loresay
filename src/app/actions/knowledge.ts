"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addSourceToCollection,
  addTagToSource,
  createCollection,
  createTag,
} from "@/application/knowledge/use-cases";
import {
  archiveSource,
  retrySourceIngestion,
  saveTextDocument,
  saveTextNote,
  saveUrlSource,
  updateTextNote,
} from "@/application/knowledge/thin-loop";
import { KnowledgeDomainError } from "@/domain/knowledge";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { embeddingGateway } from "@/infrastructure/ai/thin-loop-gateways";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";

export type NoteActionState = {
  error?: string;
  message?: string;
};

function domainMessage(error: KnowledgeDomainError) {
  const messages: Record<string, string> = {
    blocked_url_host:
      "That URL points to a private or local host, so it was blocked.",
    duplicate_active_source: "That source is already saved.",
    empty_url_content: "That URL did not contain readable text.",
    source_retry_missing_content: "This source has no extracted text to retry.",
    source_retry_not_failed: "Only failed sources can be retried.",
    unsupported_url_content_type:
      "Only web pages and plain text URLs can be ingested.",
    unsupported_url_protocol: "Use an HTTP or HTTPS URL.",
    url_content_too_large: "That page is too large to ingest.",
    url_fetch_failed:
      "The URL could not be fetched. Check the address and try again.",
    url_required: "Enter a URL first.",
  };

  return messages[error.code] ?? error.message;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof KnowledgeDomainError) {
    return { error: domainMessage(error) };
  }
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }

  return { error: fallback };
}

export async function createTextNoteAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const user = await requireSessionUser();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  const result = await saveTextNote({
    body,
    embeddings: embeddingGateway,
    owner: { userId: user.id },
    repository: knowledgeRepository,
    title,
  });

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/ingestion");
  revalidatePath("/chat");
  revalidatePath("/sources");

  if (!result.ok) {
    return { error: result.message };
  }

  return {
    message: `Saved and processed ${result.chunkCount} chunk${
      result.chunkCount === 1 ? "" : "s"
    }.`,
  };
}

export async function createTextDocumentAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const user = await requireSessionUser();
  const file = formData.get("document");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a plain text or Markdown file." };
  }

  const result = await saveTextDocument({
    byteSize: file.size,
    embeddings: embeddingGateway,
    fileName: file.name,
    mimeType: file.type,
    owner: { userId: user.id },
    repository: knowledgeRepository,
    text: await file.text(),
  });

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/ingestion");
  revalidatePath("/chat");
  revalidatePath("/sources");

  if (!result.ok) {
    return { error: result.message };
  }

  return {
    message: `Uploaded and processed ${result.chunkCount} chunk${
      result.chunkCount === 1 ? "" : "s"
    }.`,
  };
}

export async function createUrlSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const url = String(formData.get("url") ?? "").trim();

    const result = await saveUrlSource({
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      url,
    });

    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Fetched and processed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The URL could not be ingested.");
  }
}

export async function updateTextNoteAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const user = await requireSessionUser();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!sourceId) {
    return { error: "Source is required" };
  }

  const result = await updateTextNote({
    body,
    embeddings: embeddingGateway,
    owner: { userId: user.id },
    repository: knowledgeRepository,
    sourceId,
    title,
  });

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/ingestion");
  revalidatePath("/chat");
  revalidatePath("/sources");
  revalidatePath(`/sources/${sourceId}`);

  if (!result.ok) {
    return { error: result.message };
  }

  return {
    message: `Updated and reprocessed ${result.chunkCount} chunk${
      result.chunkCount === 1 ? "" : "s"
    }.`,
  };
}

export async function createCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const name = String(formData.get("name") ?? "").trim();
    await createCollection(knowledgeRepository, { userId: user.id }, { name });
    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");

    return { message: "Collection saved." };
  } catch (error) {
    return actionError(error, "The collection could not be saved.");
  }
}

export async function createTagAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const name = String(formData.get("name") ?? "").trim();
    await createTag(knowledgeRepository, { userId: user.id }, { name });
    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");

    return { message: "Tag saved." };
  } catch (error) {
    return actionError(error, "The tag could not be saved.");
  }
}

export async function addSourceToCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();
    const sourceId = String(formData.get("sourceId") ?? "").trim();

    await addSourceToCollection(
      knowledgeRepository,
      { userId: user.id },
      {
        collectionId,
        sourceId,
      },
    );
    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    return { message: "Collection attached." };
  } catch (error) {
    return actionError(error, "The collection could not be attached.");
  }
}

export async function addTagToSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const tagId = String(formData.get("tagId") ?? "").trim();

    await addTagToSource(
      knowledgeRepository,
      { userId: user.id },
      {
        sourceId,
        tagId,
      },
    );
    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    return { message: "Tag attached." };
  } catch (error) {
    return actionError(error, "The tag could not be attached.");
  }
}

export async function archiveSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const sourceId = String(formData.get("sourceId") ?? "").trim();

  try {
    const user = await requireSessionUser();
    const result = await archiveSource({
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
    });

    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }
  } catch (error) {
    return actionError(error, "The source could not be archived.");
  }

  redirect("/sources");
}

export async function retrySourceIngestionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const result = await retrySourceIngestion({
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
    });

    revalidatePath("/");
    revalidatePath("/notes");
    revalidatePath("/ingestion");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Retried and processed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The source could not be retried.");
  }
}
