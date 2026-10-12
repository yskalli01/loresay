import type {
  AnswerGateway,
  EmbeddingGateway,
} from "@/application/knowledge/thin-loop";
import type { RetrievalChunkDto } from "@/application/knowledge/repositories";
import { serverEnv } from "@/env";

const geminiEmbeddingDimensions = 1536;

class GeminiGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type GeminiEmbeddingResponse = {
  embedding?: { values?: unknown };
};

type GeminiBatchEmbeddingResponse = {
  embeddings?: Array<{ values?: unknown }>;
};

function modelPath(model: string) {
  return model.startsWith("models/") ? model : `models/${model}`;
}

function modelId(model: string) {
  return model.replace(/^models\//, "");
}

function buildContext(chunks: RetrievalChunkDto[]) {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.source_title}, chunk ${chunk.chunk_position}\n${chunk.text}`,
    )
    .join("\n\n");
}

function normalizeVector(values: number[]) {
  const length = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );

  if (!Number.isFinite(length) || length === 0) {
    return values;
  }

  return values.map((value) => value / length);
}

function parseEmbedding(values: unknown) {
  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response was missing values");
  }

  const embedding = values.map((value) => Number(value));

  if (
    embedding.length !== geminiEmbeddingDimensions ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Gemini embedding response had invalid dimensions");
  }

  return normalizeVector(embedding);
}

function embeddingRequest(
  input: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
) {
  const model = modelPath(serverEnv.GEMINI_EMBEDDING_MODEL);

  return {
    content: { parts: [{ text: input }] },
    embedContentConfig: {
      outputDimensionality: geminiEmbeddingDimensions,
      taskType,
    },
    model,
  };
}

async function withGeminiTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    serverEnv.GEMINI_RESPONSE_TIMEOUT_MS,
  );

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function embedGeminiContent(
  input: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
) {
  const model = modelId(serverEnv.GEMINI_EMBEDDING_MODEL);
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
  );
  url.searchParams.set("key", serverEnv.GEMINI_API_KEY);

  const response = await withGeminiTimeout((signal) =>
    fetch(url, {
      body: JSON.stringify(embeddingRequest(input, taskType)),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal,
    }),
  );

  if (!response.ok) {
    await throwGeminiError(response, "embedding generation");
  }

  const data = (await response.json()) as GeminiEmbeddingResponse;

  return parseEmbedding(data.embedding?.values);
}

async function embedManyGeminiContent(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const model = modelId(serverEnv.GEMINI_EMBEDDING_MODEL);
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`,
  );
  url.searchParams.set("key", serverEnv.GEMINI_API_KEY);

  const response = await withGeminiTimeout((signal) =>
    fetch(url, {
      body: JSON.stringify({
        requests: input.map((text) =>
          embeddingRequest(text, "RETRIEVAL_DOCUMENT"),
        ),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal,
    }),
  );

  if (!response.ok) {
    await throwGeminiError(response, "batch embedding generation");
  }

  const data = (await response.json()) as GeminiBatchEmbeddingResponse;
  const embeddings = data.embeddings ?? [];

  if (embeddings.length !== input.length) {
    throw new Error(
      "Gemini batch embedding response count did not match input",
    );
  }

  return embeddings.map((embedding) => parseEmbedding(embedding.values));
}

async function throwGeminiError(response: Response, action: string) {
  let message = `Gemini ${action} failed`;

  try {
    const body = (await response.clone().json()) as {
      error?: { message?: unknown };
    };
    if (typeof body.error?.message === "string") {
      message = `Gemini ${action} failed: ${body.error.message}`;
    }
  } catch {
    // Keep the safe generic message if Gemini did not return JSON.
  }

  throw new GeminiGatewayError(message, response.status);
}

function textFromGeminiCandidate(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) {
    return "";
  }

  return candidates
    .flatMap((candidate) => {
      const content = (candidate as { content?: unknown }).content;
      const parts = (content as { parts?: unknown } | undefined)?.parts;
      return Array.isArray(parts) ? parts : [];
    })
    .map((part) => (part as { text?: unknown }).text)
    .filter((text): text is string => typeof text === "string")
    .join("");
}

async function* streamGeminiText(response: Response) {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  function* consumeLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "data: [DONE]") {
      return;
    }

    const payload = trimmed.startsWith("data:")
      ? trimmed.slice("data:".length).trim()
      : trimmed;

    if (!payload) {
      return;
    }

    const text = textFromGeminiCandidate(JSON.parse(payload));
    if (text) {
      yield text;
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";

    for (const line of lines) {
      yield* consumeLine(line);
    }
  }

  buffered += decoder.decode();
  if (buffered) {
    for (const line of buffered.split("\n")) {
      yield* consumeLine(line);
    }
  }
}

export const geminiEmbeddingGateway: EmbeddingGateway = {
  get model() {
    return serverEnv.GEMINI_EMBEDDING_MODEL;
  },
  provider: "gemini",
  embed(input) {
    return embedGeminiContent(input, "RETRIEVAL_QUERY");
  },
  embedMany(input) {
    return embedManyGeminiContent(input);
  },
};

export const geminiAnswerGateway: AnswerGateway = {
  async *answer(input: { question: string; chunks: RetrievalChunkDto[] }) {
    const context = buildContext(input.chunks);
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${serverEnv.GEMINI_MODEL}:streamGenerateContent`,
    );
    url.searchParams.set("alt", "sse");
    url.searchParams.set("key", serverEnv.GEMINI_API_KEY);

    const response = await withGeminiTimeout((signal) =>
      fetch(url, {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Saved knowledge:\n${context}\n\nQuestion: ${input.question}`,
                },
              ],
              role: "user",
            },
          ],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.2,
          },
          systemInstruction: {
            parts: [
              {
                text: "Answer only from the provided saved knowledge. If the context does not support the answer, say the saved knowledge does not contain enough information. Cite supporting chunks inline like [1].",
              },
            ],
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal,
      }),
    );

    if (!response.ok) {
      await throwGeminiError(response, "answer generation");
    }

    for await (const text of streamGeminiText(response)) {
      yield text;
    }
  },
};
