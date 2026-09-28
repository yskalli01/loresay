import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageJson = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
};

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
) as PackageJson;

describe("stack scaffold", () => {
  it("keeps the core scripts needed by the workflow", () => {
    expect(packageJson.scripts).toMatchObject({
      build: "next build",
      dev: "next dev",
      lint: "eslint",
      test: "vitest run --passWithNoTests",
      typecheck: "tsc --noEmit",
    });
  });

  it("installs the core stack dependencies from spec 0001", () => {
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(allDependencies).toEqual(
      expect.objectContaining({
        "@playwright/test": expect.any(String),
        "@supabase/ssr": expect.any(String),
        "@supabase/supabase-js": expect.any(String),
        ai: expect.any(String),
        "drizzle-kit": expect.any(String),
        "drizzle-orm": expect.any(String),
        "lucide-react": expect.any(String),
        next: expect.any(String),
        openai: expect.any(String),
        postgres: expect.any(String),
        react: expect.any(String),
        tailwindcss: expect.any(String),
        typescript: expect.any(String),
        vitest: expect.any(String),
      }),
    );
  });

  it("creates the foundation files for environment, database, and Supabase access", () => {
    const expectedFiles = [
      ".env.example",
      "drizzle.config.ts",
      "src/env.ts",
      "src/infrastructure/db/client.ts",
      "src/infrastructure/db/schema.ts",
      "src/infrastructure/db/rls-policies.sql",
      "src/infrastructure/supabase/client.ts",
      "src/infrastructure/supabase/server.ts",
    ];

    expectedFiles.forEach((filePath) => {
      expect(existsSync(path.join(root, filePath)), filePath).toBe(true);
    });
  });
});
