import type {
  AnswerGateway,
  EmbeddingGateway,
} from "@/application/knowledge/thin-loop";
import type { RetrievalChunkDto } from "@/application/knowledge/repositories";

import {
  answerModel,
  createEmbedding,
  createEmbeddings,
  getOpenAIClient,
} from "./client";

export const openAIEmbeddingGateway: EmbeddingGateway = {
  model: "text-embedding-3-small",
  provider: "openai",
  embed: createEmbedding,
  embedMany: createEmbeddings,
};

export const openAIAnswerGateway: AnswerGateway = {
  async *answer(input: { question: string; chunks: RetrievalChunkDto[] }) {
    const context = input.chunks
      .map(
        (chunk, index) =>
          `[${index + 1}] ${chunk.source_title}, chunk ${chunk.chunk_position}\n${chunk.text}`,
      )
      .join("\n\n");

    const stream = await getOpenAIClient().responses.create({
      input: [
        {
          content:
            "Answer only from the provided saved knowledge. If the context does not support the answer, say the saved knowledge does not contain enough information. Cite supporting chunks inline like [1].",
          role: "system",
        },
        {
          content: `Saved knowledge:\n${context}\n\nQuestion: ${input.question}`,
          role: "user",
        },
      ],
      model: answerModel,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }
    }
  },
};
