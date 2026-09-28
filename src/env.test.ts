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
    expect(serverEnv).toEqual({
      AI_PROVIDER: "openai",
      DATABASE_URL: "postgres://user:pass@localhost:5432/app",
      OPENAI_API_KEY: "openai-key",
      SUPABASE_SECRET_KEY: "secret-key",
    });
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

  it("uses the stub provider locally when no OpenAI key is configured", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");

    const { serverEnv } = await importEnv();

    expect(serverEnv.AI_PROVIDER).toBe("stub");
    expect(serverEnv.OPENAI_API_KEY).toBe("");
  });

  it("rejects unknown AI providers", async () => {
    Object.entries(validEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    vi.stubEnv("AI_PROVIDER", "magic");

    const { serverEnv } = await importEnv();

    expect(() => serverEnv.AI_PROVIDER).toThrow(
      "AI_PROVIDER must be one of: openai, stub",
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
