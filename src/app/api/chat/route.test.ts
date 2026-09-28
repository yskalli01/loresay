import { afterEach, describe, expect, it, vi } from "vitest";

import { answerQuestion } from "@/application/knowledge/thin-loop";
import { getSessionUser } from "@/infrastructure/auth/session";

vi.mock("@/application/knowledge/thin-loop", () => ({
  answerQuestion: vi.fn(),
}));

vi.mock("@/infrastructure/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/infrastructure/ai/thin-loop-gateways", () => ({
  answerGateway: { answer: vi.fn() },
  embeddingGateway: { embed: vi.fn(), embedMany: vi.fn() },
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: {},
}));

async function readNdjson(response: Response) {
  const text = await response.text();

  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

async function postChat(body: unknown) {
  const { POST } = await import("./route");

  return POST(
    new Request("http://localhost/api/chat", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

function sessionUser(id = "user-1") {
  return {
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    id,
    user_metadata: {},
  } as Awaited<ReturnType<typeof getSessionUser>>;
}

describe("chat route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when the request is not authenticated, covers AC-1 and AC-9", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);

    const response = await postChat({ message: "hello" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 422 when the message is empty, covers AC-5", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(sessionUser());

    const response = await postChat({ message: "   " });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Message is required",
    });
  });

  it("streams answer deltas and final citations for authenticated requests, covers AC-5, AC-6, and AC-8", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(sessionUser());
    vi.mocked(answerQuestion).mockImplementationOnce(async (input) => {
      input.onDelta?.("Project ");
      input.onDelta?.("Atlas");

      return {
        answer: "Project Atlas",
        citations: [
          {
            chunk_hash_snapshot: "chunk-hash",
            chunk_position_snapshot: 1,
            citation_id: "citation-1",
            content_version_snapshot: 1,
            quote: "Project Atlas uses blue badges.",
            rank: 1,
            source_content_id_snapshot: "content-1",
            source_id_snapshot: "source-1",
            source_title_snapshot: "Project Atlas badges",
            source_type_snapshot: "note",
          },
        ],
        threadId: "thread-1",
      };
    });

    const response = await postChat({
      message: "What color badges?",
      threadId: "thread-1",
    });
    const events = await readNdjson(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/x-ndjson",
    );
    expect(events).toEqual([
      { text: "Project ", type: "delta" },
      { text: "Atlas", type: "delta" },
      {
        answer: "Project Atlas",
        citations: [
          expect.objectContaining({
            citation_id: "citation-1",
            rank: 1,
            source_title_snapshot: "Project Atlas badges",
          }),
        ],
        threadId: "thread-1",
        type: "done",
      },
    ]);
    expect(answerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { userId: "user-1" },
        question: "What color badges?",
        threadId: "thread-1",
      }),
    );
  });

  it("streams an error event when answer generation fails, covers AC-5", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(sessionUser());
    vi.mocked(answerQuestion).mockRejectedValueOnce(new Error("model failed"));

    const response = await postChat({ message: "What changed?" });
    const events = await readNdjson(response);

    expect(response.status).toBe(200);
    expect(events).toEqual([
      { error: "The chat request failed", type: "error" },
    ]);
  });
});
