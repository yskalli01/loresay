import { describe, expect, it } from "vitest";

import type { RetrievalChunkDto } from "@/application/knowledge/repositories";
import { thinLoopLimits } from "@/application/knowledge/text-processing";

import {
  createStubEmbedding,
  stubAnswerGateway,
  stubEmbeddingGateway,
} from "./stub-gateways";

const chunk: RetrievalChunkDto = {
  chunk_hash: "chunk-hash",
  chunk_id: "chunk-1",
  chunk_position: 1,
  content_version: 1,
  score: 0.91,
  source_content_id: "content-1",
  source_fingerprint: "source-1",
  source_id: "source-1",
  source_title: "Project Atlas badges",
  source_type: "note",
  text: "Project Atlas uses blue badges for retrieval quality.",
};

async function collect(stream: AsyncIterable<string>) {
  let text = "";

  for await (const delta of stream) {
    text += delta;
  }

  return text;
}

describe("stub AI gateways", () => {
  it("creates deterministic 1536 dimension embeddings for local verification, covers AC-3", async () => {
    const first = createStubEmbedding("Project Atlas blue badges");
    const second = await stubEmbeddingGateway.embed(
      "Project Atlas blue badges",
    );

    expect(first).toHaveLength(thinLoopLimits.embeddingDimensions);
    expect(second).toEqual(first);
    expect(first.some((value) => value > 0)).toBe(true);
  });

  it("embeds batches without changing input order, covers AC-3", async () => {
    const embeddings = await stubEmbeddingGateway.embedMany([
      "blue badges",
      "green budgets",
    ]);

    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toEqual(createStubEmbedding("blue badges"));
    expect(embeddings[1]).toEqual(createStubEmbedding("green budgets"));
  });

  it("streams an answer from retrieved chunks with a citation marker, covers AC-5 and AC-6", async () => {
    const answer = await collect(
      stubAnswerGateway.answer({
        chunks: [chunk],
        question: "What color badges?",
      }),
    );

    expect(answer).toContain("Project Atlas uses blue badges");
    expect(answer).toContain("[1]");
  });

  it("refuses when no chunks are provided, covers AC-7", async () => {
    const answer = await collect(
      stubAnswerGateway.answer({
        chunks: [],
        question: "What did I save about billing?",
      }),
    );

    expect(answer).toContain("does not contain enough information");
  });
});
