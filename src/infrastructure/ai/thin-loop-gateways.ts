import { serverEnv } from "@/env";

import {
  openAIAnswerGateway,
  openAIEmbeddingGateway,
} from "../openai/thin-loop-gateways";
import { stubAnswerGateway, stubEmbeddingGateway } from "./stub-gateways";

export const embeddingGateway =
  serverEnv.AI_PROVIDER === "stub"
    ? stubEmbeddingGateway
    : openAIEmbeddingGateway;

export const answerGateway =
  serverEnv.AI_PROVIDER === "stub" ? stubAnswerGateway : openAIAnswerGateway;
