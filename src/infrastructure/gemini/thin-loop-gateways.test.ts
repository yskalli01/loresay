import { afterEach, describe, expect, it, vi } from "vitest";

const vector = Array(1536).fill(1);

async function importGeminiGateways() {
  vi.resetModules();
  return import("./thin-loop-gateways");
}

describe("Gemini thin loop gateways", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("requests 1536 dimension query embeddings", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2");
    const fetchMock = vi.fn(async () =>
      Response.json({ embedding: { values: vector } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { geminiEmbeddingGateway } = await importGeminiGateways();
    const embedding = await geminiEmbeddingGateway.embed("saved note question");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string | URL,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body));

    expect(embedding).toHaveLength(1536);
    expect(embedding[0]).toBeCloseTo(1 / Math.sqrt(1536));
    expect(url.toString()).toContain(
      "models/gemini-embedding-2:embedContent",
    );
    expect(body.embedContentConfig).toEqual({
      outputDimensionality: 1536,
      taskType: "RETRIEVAL_QUERY",
    });
  });

  it("requests 1536 dimension document embeddings in batches", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2");
    const fetchMock = vi.fn(async () =>
      Response.json({ embeddings: [{ values: vector }, { values: vector }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { geminiEmbeddingGateway } = await importGeminiGateways();
    const embeddings = await geminiEmbeddingGateway.embedMany(["one", "two"]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string | URL,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body));

    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toHaveLength(1536);
    expect(url.toString()).toContain(
      "models/gemini-embedding-2:batchEmbedContents",
    );
    expect(body.requests).toHaveLength(2);
    expect(body.requests[0].embedContentConfig).toEqual({
      outputDimensionality: 1536,
      taskType: "RETRIEVAL_DOCUMENT",
    });
  });
});


