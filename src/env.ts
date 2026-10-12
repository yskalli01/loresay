const aiProviders = ["gemini", "openai", "stub"] as const;
const answerProviders = ["gemini", "openai", "stub"] as const;

export type AIProvider = (typeof aiProviders)[number];
export type AnswerProvider = (typeof answerProviders)[number];

const requiredServerEnv = ["DATABASE_URL", "SUPABASE_SECRET_KEY"] as const;

const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const;

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readAIProvider(): AIProvider {
  const value = process.env.AI_PROVIDER?.trim();

  if (!value) {
    const answerProvider = process.env.ANSWER_PROVIDER?.trim();

    if (answerProvider === "gemini" && process.env.GEMINI_API_KEY) {
      return "gemini";
    }

    if (process.env.OPENAI_API_KEY || process.env.NODE_ENV === "production") {
      return "openai";
    }

    if (process.env.GEMINI_API_KEY) {
      return "gemini";
    }

    return "stub";
  }

  if (aiProviders.includes(value as AIProvider)) {
    return value as AIProvider;
  }

  throw new Error("AI_PROVIDER must be one of: gemini, openai, stub");
}

function readAnswerProvider(): AnswerProvider {
  const value = process.env.ANSWER_PROVIDER?.trim();

  if (!value) {
    return readAIProvider();
  }

  if (answerProviders.includes(value as AnswerProvider)) {
    return value as AnswerProvider;
  }

  throw new Error("ANSWER_PROVIDER must be one of: gemini, openai, stub");
}

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: readRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
  NEXT_PUBLIC_SUPABASE_URL: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
};

export const serverEnv = {
  get AI_PROVIDER() {
    return readAIProvider();
  },
  get ANSWER_PROVIDER() {
    return readAnswerProvider();
  },
  get DATABASE_URL() {
    return readRequiredEnv("DATABASE_URL");
  },
  get GEMINI_API_KEY() {
    if (readAIProvider() !== "gemini" && readAnswerProvider() !== "gemini") {
      return process.env.GEMINI_API_KEY ?? "";
    }

    return readRequiredEnv("GEMINI_API_KEY");
  },
  get GEMINI_EMBEDDING_MODEL() {
    return process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-2";
  },
  get GEMINI_MODEL() {
    return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  },
  get GEMINI_RESPONSE_TIMEOUT_MS() {
    const value = Number(process.env.GEMINI_RESPONSE_TIMEOUT_MS ?? 60_000);

    return Number.isFinite(value) && value > 0 ? value : 60_000;
  },
  get OPENAI_API_KEY() {
    if (readAIProvider() !== "openai" && readAnswerProvider() !== "openai") {
      return process.env.OPENAI_API_KEY ?? "";
    }

    return readRequiredEnv("OPENAI_API_KEY");
  },
  get SUPABASE_SECRET_KEY() {
    return readRequiredEnv("SUPABASE_SECRET_KEY");
  },
};

export const requiredEnv = [...requiredPublicEnv, ...requiredServerEnv];
