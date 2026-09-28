import { describe, expect, it } from "vitest";

import { KnowledgeDomainError } from "./errors";
import {
  assertCitationRanks,
  assertSourceMetadata,
  canTransitionIngestionJobStatus,
  canTransitionSourceStatus,
  deriveSourceFingerprint,
  deriveSourceTitle,
  initialSourceStatus,
  normalizeUrlForFingerprint,
} from "./rules";
import { knowledgeLimits } from "./types";

describe("knowledge domain rules", () => {
  it("derives source fingerprints and titles from typed metadata", () => {
    const noteMetadata = { note_id: "note-1", body_hash: "hash-1" };
    const documentMetadata = {
      storage_bucket: "sources",
      storage_path: "u/file.pdf",
      file_name: "Research.pdf",
      mime_type: "application/pdf",
      byte_size: 1200,
      file_hash: "file-hash",
    };

    assertSourceMetadata("note", noteMetadata);
    assertSourceMetadata("document", documentMetadata);

    expect(deriveSourceFingerprint("note", noteMetadata)).toBe("note-1");
    expect(
      deriveSourceTitle("note", noteMetadata, null, "Long note body"),
    ).toBe("Long note body");
    expect(deriveSourceFingerprint("document", documentMetadata)).toBe(
      "file-hash",
    );
    expect(deriveSourceTitle("document", documentMetadata)).toBe(
      "Research.pdf",
    );
  });

  it("normalizes URLs before URL hashes are created upstream", () => {
    expect(
      normalizeUrlForFingerprint("HTTPS://Example.com/path/#section"),
    ).toBe("https://example.com/path");
  });

  it("keeps the source and job state machines explicit", () => {
    expect(initialSourceStatus("note")).toBe("draft");
    expect(initialSourceStatus("url")).toBe("processing");
    expect(canTransitionSourceStatus("processing", "ready")).toBe(true);
    expect(canTransitionSourceStatus("deleted", "ready")).toBe(false);
    expect(canTransitionIngestionJobStatus("running", "failed_retryable")).toBe(
      true,
    );
    expect(canTransitionIngestionJobStatus("failed_terminal", "queued")).toBe(
      false,
    );
  });

  it("rejects invalid metadata and citation ranks", () => {
    expect(() =>
      assertSourceMetadata("document", { file_name: "missing.pdf" }),
    ).toThrow(KnowledgeDomainError);
    expect(() => assertCitationRanks([1, 1])).toThrow(
      "Citation ranks must be unique per answer",
    );
    expect(() =>
      assertCitationRanks([knowledgeLimits.citationsPerAnswer + 1]),
    ).toThrow("Citation ranks must be between 1 and 20");
  });
});
