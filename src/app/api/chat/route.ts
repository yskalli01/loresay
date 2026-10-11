import { NextResponse } from "next/server";

import { answerQuestion } from "@/application/knowledge/thin-loop";
import {
  answerGateway,
  embeddingGateway,
} from "@/infrastructure/ai/thin-loop-gateways";
import { getSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";

function chatErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "Gemini request timed out") {
    return "Gemini took too long to answer. Try again, or narrow the question.";
  }

  if (
    error instanceof Error &&
    error.message.startsWith("Gemini answer generation failed:")
  ) {
    return error.message;
  }

  if (
    error instanceof Error &&
    error.message.startsWith("Gemini embedding generation failed:")
  ) {
    return error.message;
  }

  return "The chat request failed. Try again.";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    message?: unknown;
    threadId?: unknown;
    collectionId?: unknown;
  };
  const message = typeof body.message === "string" ? body.message : "";
  const threadId = typeof body.threadId === "string" ? body.threadId : null;
  const collectionId =
    typeof body.collectionId === "string" && body.collectionId.trim()
      ? body.collectionId.trim()
      : undefined;

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 422 });
  }

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        function enqueue(event: unknown) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }

        try {
          const result = await answerQuestion({
            answers: answerGateway,
            embeddings: embeddingGateway,
            onDelta(delta) {
              enqueue({ text: delta, type: "delta" });
            },
            filters: { collectionId },
            owner: { userId: user.id },
            question: message,
            repository: knowledgeRepository,
            threadId,
          });

          enqueue({
            answer: result.answer,
            citations: result.citations,
            threadId: result.threadId,
            type: "done",
          });
        } catch (error) {
          enqueue({ error: chatErrorMessage(error), type: "error" });
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    },
  );
}
