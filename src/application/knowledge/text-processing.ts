import { createHash, randomUUID } from "node:crypto";

import { invariant } from "@/domain/knowledge/errors";
import { knowledgeLimits } from "@/domain/knowledge";

export const thinLoopLimits = {
  noteBody: 20_000,
  chunkTargetTokens: 800,
  chunkOverlapTokens: 120,
  embeddingDimensions: 1536,
  citationsPerAnswer: 5,
} as const;

export function hashText(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createNoteMetadata(body: string) {
  return {
    body_hash: hashText(body.trim()),
    note_id: randomUUID(),
  };
}

export function validateThinLoopNoteBody(body: string) {
  const trimmed = body.trim();

  invariant(trimmed.length > 0, "Note body is required", "note_body_required");
  invariant(
    trimmed.length <= thinLoopLimits.noteBody,
    "Note body must be 20,000 characters or fewer",
    "note_body_too_large",
  );

  return trimmed;
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length * 1.33));
}

export function chunkTextForRetrieval(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordsPerChunk = Math.max(
    1,
    Math.floor(thinLoopLimits.chunkTargetTokens / 1.33),
  );
  const overlapWords = Math.max(
    0,
    Math.floor(thinLoopLimits.chunkOverlapTokens / 1.33),
  );
  const step = Math.max(1, wordsPerChunk - overlapWords);
  const chunks: Array<{
    text: string;
    tokenCount: number;
    contentHash: string;
  }> = [];

  for (let index = 0; index < words.length; index += step) {
    const chunk = words.slice(index, index + wordsPerChunk).join(" ");
    if (!chunk) {
      continue;
    }

    invariant(
      chunk.length <= knowledgeLimits.chunkText,
      "Chunk text must fit the stored chunk limit",
      "chunk_text_too_large",
    );

    chunks.push({
      contentHash: hashText(chunk),
      text: chunk,
      tokenCount: estimateTokens(chunk),
    });
  }

  invariant(chunks.length > 0, "At least one chunk is required", "no_chunks");

  return chunks;
}

export function createPromptContextHash(
  question: string,
  chunkHashes: string[],
) {
  return hashText([question, ...chunkHashes].join("\n"));
}
