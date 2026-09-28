const aiProviders = ["openai", "stub"] as const;

export type AIProvider = (typeof aiProviders)[number];

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
    return process.env.OPENAI_API_KEY || process.env.NODE_ENV === "production"
      ? "openai"
      : "stub";
  }

  if (aiProviders.includes(value as AIProvider)) {
    return value as AIProvider;
  }

  throw new Error("AI_PROVIDER must be one of: openai, stub");
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
  get DATABASE_URL() {
    return readRequiredEnv("DATABASE_URL");
  },
  get OPENAI_API_KEY() {
    if (readAIProvider() === "stub") {
      return process.env.OPENAI_API_KEY ?? "";
    }

    return readRequiredEnv("OPENAI_API_KEY");
  },
  get SUPABASE_SECRET_KEY() {
    return readRequiredEnv("SUPABASE_SECRET_KEY");
  },
};

export const requiredEnv = [...requiredPublicEnv, ...requiredServerEnv];
