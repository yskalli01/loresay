import { serverEnv } from "@/env";

import {
  geminiAnswerGateway,
  geminiEmbeddingGateway,
} from "../gemini/thin-loop-gateways";
import {
  openAIAnswerGateway,
  openAIEmbeddingGateway,
} from "../openai/thin-loop-gateways";
import { stubAnswerGateway, stubEmbeddingGateway } from "./stub-gateways";

export const embeddingGateway =
  serverEnv.AI_PROVIDER === "stub"
    ? stubEmbeddingGateway
    : serverEnv.AI_PROVIDER === "gemini"
      ? geminiEmbeddingGateway
      : openAIEmbeddingGateway;

export const answerGateway =
  serverEnv.ANSWER_PROVIDER === "stub"
    ? stubAnswerGateway
    : serverEnv.ANSWER_PROVIDER === "gemini"
      ? geminiAnswerGateway
      : openAIAnswerGateway;
