import OpenAI from "openai";

import { serverEnv } from "@/env";

export const embeddingModel = "text-embedding-3-small";
export const answerModel = "gpt-5.6-terra";
export const embeddingDimensions = 1536;

let client: OpenAI | null = null;

export function getOpenAIClient() {
  client ??= new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  return client;
}

export async function createEmbedding(input: string) {
  const response = await getOpenAIClient().embeddings.create({
    input,
    model: embeddingModel,
  });

  return response.data[0]?.embedding ?? [];
}

export async function createEmbeddings(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const response = await getOpenAIClient().embeddings.create({
    input,
    model: embeddingModel,
  });

  return response.data.map((item) => item.embedding);
}
