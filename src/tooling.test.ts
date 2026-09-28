import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageJson = {
  devDependencies: Record<string, string>;
  packageManager: string;
  scripts: Record<string, string>;
};

const root = process.cwd();

function readText(filePath: string) {
  return readFileSync(path.join(root, filePath), "utf8");
}

const packageJson = JSON.parse(readText("package.json")) as PackageJson;

describe("tooling workflow", () => {
  it("keeps the local quality scripts wired in dependency order", () => {
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        format: "prettier --write .",
        "format:check": "prettier --check .",
        lint: "eslint",
        typecheck: "tsc --noEmit",
        test: "vitest run --passWithNoTests",
        "test:e2e": "playwright test",
        quality:
          "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build",
      }),
    );
    expect(packageJson.packageManager).toBe("pnpm@11.19.0");
    expect(packageJson.devDependencies.prettier).toEqual(expect.any(String));
  });

  it("keeps Prettier deterministic and excludes generated or secret files", () => {
    const prettierConfig = JSON.parse(readText(".prettierrc.json")) as Record<
      string,
      unknown
    >;
    const prettierIgnore = readText(".prettierignore")
      .split(/\r?\n/)
      .filter(Boolean);

    expect(prettierConfig).toEqual({
      printWidth: 80,
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    });
    expect(prettierIgnore).toEqual(
      expect.arrayContaining([
        ".next",
        "node_modules",
        "coverage",
        "playwright-report",
        "test-results",
        "pnpm-lock.yaml",
        "tsconfig.tsbuildinfo",
        ".env",
        ".env.*",
        "!.env.example",
      ]),
    );
  });

  it("configures Playwright to run future browser specs against the app server", () => {
    const config = readText("playwright.config.ts");

    expect(config).toContain('testDir: "./src"');
    expect(config).toContain('testMatch: "**/*.e2e.ts"');
    expect(config).toContain('baseURL: "http://127.0.0.1:3000"');
    expect(config).toContain('command: "pnpm run dev"');
    expect(config).toContain("reuseExistingServer: !process.env.CI");
    expect(config).toContain('name: "chromium"');
  });

  it("runs the same quality gate in CI as the local quality script", () => {
    const workflow = readText(".github/workflows/quality.yml");
    const expectedRuns = [
      "pnpm install --frozen-lockfile",
      "pnpm run format:check",
      "pnpm run lint",
      "pnpm run typecheck",
      "pnpm run test",
      "pnpm run build",
    ];

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("branches:\n      - main");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("version: 11.19.0");
    expectedRuns.forEach((command) => {
      expect(workflow).toContain(`run: ${command}`);
    });
    expect(expectedRuns.map((command) => workflow.indexOf(command))).toEqual(
      [...expectedRuns]
        .map((command) => workflow.indexOf(command))
        .sort((a, b) => a - b),
    );
  });
});
