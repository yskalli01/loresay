import { afterEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  AI_PROVIDER: "openai",
  DATABASE_URL: "postgres://user:pass@localhost:5432/app",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  OPENAI_API_KEY: "openai-key",
  SUPABASE_SECRET_KEY: "secret-key",
};

async function importEnv() {
  vi.resetModules();
  return import("./env");
}

describe("environment contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports public and server env groups when all required values exist", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });

    const { publicEnv, requiredEnv, serverEnv } = await importEnv();

    expect(publicEnv).toEqual({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
    expect(serverEnv.AI_PROVIDER).toBe("openai");
    expect(serverEnv.ANSWER_PROVIDER).toBe("openai");
    expect(serverEnv.DATABASE_URL).toBe(
      "postgres://user:pass@localhost:5432/app",
    );
    expect(serverEnv.GEMINI_API_KEY).toBe("");
    expect(serverEnv.GEMINI_EMBEDDING_MODEL).toBe("gemini-embedding-2");
    expect(serverEnv.GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(serverEnv.GEMINI_RESPONSE_TIMEOUT_MS).toBe(60_000);
    expect(serverEnv.OPENAI_API_KEY).toBe("openai-key");
    expect(serverEnv.SUPABASE_SECRET_KEY).toBe("secret-key");
    expect(requiredEnv).toEqual([
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "DATABASE_URL",
      "SUPABASE_SECRET_KEY",
    ]);
  });

  it("fails loudly when the OpenAI provider is selected without an API key", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("OPENAI_API_KEY", "");

    const { serverEnv } = await importEnv();

    expect(() => serverEnv.OPENAI_API_KEY).toThrow(
      "Missing required environment variable: OPENAI_API_KEY",
    );
  });

  it("uses the stub provider locally when no model key is configured", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");

    const { serverEnv } = await importEnv();

    expect(serverEnv.AI_PROVIDER).toBe("stub");
    expect(serverEnv.OPENAI_API_KEY).toBe("");
    expect(serverEnv.GEMINI_API_KEY).toBe("");
  });

  it("defaults to Gemini locally when a Gemini key is configured without OpenAI", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("ANSWER_PROVIDER", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("NODE_ENV", "development");

    const { serverEnv } = await importEnv();

    expect(serverEnv.AI_PROVIDER).toBe("gemini");
    expect(serverEnv.ANSWER_PROVIDER).toBe("gemini");
    expect(serverEnv.GEMINI_API_KEY).toBe("gemini-key");
    expect(serverEnv.OPENAI_API_KEY).toBe("");
  });

  it("requires a Gemini API key when Gemini embeddings are selected", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");

    const { serverEnv } = await importEnv();

    expect(serverEnv.AI_PROVIDER).toBe("gemini");
    expect(() => serverEnv.GEMINI_API_KEY).toThrow(
      "Missing required environment variable: GEMINI_API_KEY",
    );
  });

  it("requires a Gemini API key when Gemini answers are selected", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("ANSWER_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");

    const { serverEnv } = await importEnv();

    expect(serverEnv.ANSWER_PROVIDER).toBe("gemini");
    expect(() => serverEnv.GEMINI_API_KEY).toThrow(
      "Missing required environment variable: GEMINI_API_KEY",
    );
  });

  it("uses Gemini values when configured with a key", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("ANSWER_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-custom");
    vi.stubEnv("GEMINI_MODEL", "gemini-custom");

    const { serverEnv } = await importEnv();

    expect(serverEnv.AI_PROVIDER).toBe("gemini");
    expect(serverEnv.ANSWER_PROVIDER).toBe("gemini");
    expect(serverEnv.GEMINI_API_KEY).toBe("gemini-key");
    expect(serverEnv.GEMINI_EMBEDDING_MODEL).toBe("gemini-embedding-custom");
    expect(serverEnv.GEMINI_MODEL).toBe("gemini-custom");
  });

  it("rejects unknown AI providers", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "magic");

    const { serverEnv } = await importEnv();

    expect(() => serverEnv.AI_PROVIDER).toThrow(
      "AI_PROVIDER must be one of: gemini, openai, stub",
    );
  });

  it("rejects unknown answer providers", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("ANSWER_PROVIDER", "magic");

    const { serverEnv } = await importEnv();

    expect(() => serverEnv.ANSWER_PROVIDER).toThrow(
      "ANSWER_PROVIDER must be one of: gemini, openai, stub",
    );
  });

  it("does not require unrelated server env values when reading public env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("OPENAI_API_KEY", "");

    const { publicEnv } = await importEnv();

    expect(publicEnv).toEqual({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
  });
});

