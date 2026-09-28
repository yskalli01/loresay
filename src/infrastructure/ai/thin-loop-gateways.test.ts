import { afterEach, describe, expect, it, vi } from "vitest";

async function importGateways() {
  vi.resetModules();
  return Promise.all([
    import("./thin-loop-gateways"),
    import("./stub-gateways"),
    import("../openai/thin-loop-gateways"),
  ]);
}

function stubBaseEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/app");
  vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key");
}

describe("thin loop AI gateway selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the stub gateways when the stub provider is selected, covers AC-3 and AC-5", async () => {
    stubBaseEnv();
    vi.stubEnv("AI_PROVIDER", "stub");

    const [selected, stub] = await importGateways();

    expect(selected.embeddingGateway).toBe(stub.stubEmbeddingGateway);
    expect(selected.answerGateway).toBe(stub.stubAnswerGateway);
  });

  it("uses the OpenAI gateways when the OpenAI provider is selected, covers AC-3 and AC-5", async () => {
    stubBaseEnv();
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "openai-key");

    const [selected, , openai] = await importGateways();

    expect(selected.embeddingGateway).toBe(openai.openAIEmbeddingGateway);
    expect(selected.answerGateway).toBe(openai.openAIAnswerGateway);
  });
});
