import type {
  AnswerGateway,
  EmbeddingGateway,
} from "@/application/knowledge/thin-loop";
import type { RetrievalChunkDto } from "@/application/knowledge/repositories";
import { thinLoopLimits } from "@/application/knowledge/text-processing";

function tokens(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function tokenSlot(token: string) {
  let hash = 0;

  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }

  return hash % thinLoopLimits.embeddingDimensions;
}

export function createStubEmbedding(input: string) {
  const vector = Array(thinLoopLimits.embeddingDimensions).fill(0) as number[];

  for (const token of tokens(input)) {
    vector[tokenSlot(token)] += 1;
  }

  const length =
    Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

  return vector.map((value) => value / length);
}

export const stubEmbeddingGateway: EmbeddingGateway = {
  model: "stub-hash-embedding",
  provider: "stub",
  async embed(input) {
    return createStubEmbedding(input);
  },
  async embedMany(input) {
    return input.map(createStubEmbedding);
  },
};

export const stubAnswerGateway: AnswerGateway = {
  async *answer(input: { question: string; chunks: RetrievalChunkDto[] }) {
    const firstChunk = input.chunks[0];
    const text = firstChunk
      ? `Your saved knowledge says: ${firstChunk.text} [1]`
      : "Your saved knowledge does not contain enough information to answer that yet.";

    for (const word of text.split(/(\s+)/)) {
      yield word;
    }
  },
};

