import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/infrastructure/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
});
