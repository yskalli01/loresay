import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const script = readFileSync(
  resolve(process.cwd(), "scripts/verify-live-schema.mjs"),
  "utf8",
);

const migration = readFileSync(
  resolve(process.cwd(), "drizzle/0000_wild_secret_warriors.sql"),
  "utf8",
);

const expectedTables = [
  "profiles",
  "knowledge_sources",
  "source_contents",
  "source_chunks",
  "chunk_embeddings",
  "ingestion_jobs",
  "collections",
  "collection_sources",
  "tags",
  "source_tags",
  "chat_threads",
  "chat_messages",
  "retrieval_runs",
  "retrieval_results",
  "answer_citations",
];

describe("live schema verifier", () => {
  it("covers every core data model table from the migration, covers AC-1 through AC-6", () => {
    expectedTables.forEach((table) => {
      expect(script).toContain(`"${table}"`);
      expect(migration).toContain(`CREATE TABLE "${table}"`);
    });
  });

  it("requires pgvector, RLS, and owner policies in the live database, covers AC-2 and AC-6", () => {
    expect(script).toContain("where extname = 'vector'");
    expect(script).toContain("tablesWithoutRls.length > 0");
    expect(script).toContain("summary.policyTables !== expectedTables.length");

    expectedTables.forEach((table) => {
      expect(migration).toContain(
        `alter table ${table} enable row level security`,
      );
      expect(migration).toContain(` on ${table}`);
    });
  });

  it("fails the command when required live schema checks are missing, covers AC-6", () => {
    expect(script).toContain("missingTables.length > 0");
    expect(script).toContain("!summary.vectorExtension");
    expect(script).toContain("process.exitCode = 1");
  });
});
