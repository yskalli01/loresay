import { beforeEach, describe, expect, it, vi } from "vitest";

import { KnowledgeDomainError } from "@/domain/knowledge";

import {
  addSourcesToCollectionAction,
  createCollectionAction,
  removeSourcesFromCollectionAction,
  updateCollectionAction,
  updateKnowledgeSourceAction,
} from "./knowledge";

const mocks = vi.hoisted(() => ({
  addSourceToCollection: vi.fn(),
  createCollection: vi.fn(),
  revalidatePath: vi.fn(),
  removeSourceFromCollection: vi.fn(),
  uploadCollectionImage: vi.fn(),
  requireSessionUser: vi.fn(async () => ({
    email: "person@example.com",
    id: "user-1",
  })),
  updateTextDocument: vi.fn(),
  updateTextNote: vi.fn(),
  updateUrlSource: vi.fn(),
  updateCollection: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/infrastructure/auth/session", () => ({
  requireSessionUser: mocks.requireSessionUser,
}));

vi.mock("@/infrastructure/ai/thin-loop-gateways", () => ({
  embeddingGateway: { provider: "test" },
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: { name: "repository" },
}));

vi.mock("@/infrastructure/supabase/collection-storage", () => ({
  uploadCollectionImage: mocks.uploadCollectionImage,
}));

vi.mock("@/application/knowledge/use-cases", () => ({
  addSourceToCollection: mocks.addSourceToCollection,
  createCollection: mocks.createCollection,
  deleteCollection: vi.fn(),
  deleteCollections: vi.fn(),
  removeSourceFromCollection: mocks.removeSourceFromCollection,
  updateCollection: mocks.updateCollection,
}));

vi.mock("@/application/knowledge/thin-loop", () => ({
  archiveSource: vi.fn(),
  purgeArchivedSource: vi.fn(),
  retrySourceIngestion: vi.fn(),
  saveTextDocument: vi.fn(),
  saveTextNote: vi.fn(),
  saveUrlSource: vi.fn(),
  updateTextDocument: mocks.updateTextDocument,
  updateTextNote: mocks.updateTextNote,
  updateUrlSource: mocks.updateUrlSource,
}));

function editForm(type: "document" | "note" | "url") {
  const formData = new FormData();
  formData.set("sourceId", "source-1");
  formData.set("sourceType", type);
  formData.set("title", "Updated source");
  return formData;
}

describe("updateKnowledgeSourceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches note edits and revalidates the source surfaces", async () => {
    mocks.updateTextNote.mockResolvedValueOnce({
      chunkCount: 2,
      ok: true,
      reprocessed: true,
      sourceId: "source-1",
      status: "ready",
    });
    const formData = editForm("note");
    formData.set("body", "Updated note body");

    const result = await updateKnowledgeSourceAction({}, formData);

    expect(mocks.updateTextNote).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Updated note body",
        owner: { userId: "user-1" },
        sourceId: "source-1",
        title: "Updated source",
      }),
    );
    expect(result).toEqual({
      message: "Saved and reprocessed 2 chunks.",
      success: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sources/source-1");
  });

  it("turns an optional document file into application data", async () => {
    mocks.updateTextDocument.mockResolvedValueOnce({
      chunkCount: 1,
      ok: true,
      reprocessed: true,
      sourceId: "source-1",
      status: "ready",
    });
    const formData = editForm("document");
    formData.set(
      "document",
      new File(["Replacement text"], "replacement.txt", {
        type: "text/plain",
      }),
    );

    await updateKnowledgeSourceAction({}, formData);

    expect(mocks.updateTextDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        replacement: {
          byteSize: 16,
          fileName: "replacement.txt",
          mimeType: "text/plain",
          text: "Replacement text",
        },
      }),
    );
  });

  it("returns safe validation errors and rejects unsupported source types", async () => {
    mocks.updateUrlSource.mockRejectedValueOnce(
      new KnowledgeDomainError(
        "Source title is required",
        "source_title_required",
      ),
    );
    const urlForm = editForm("url");
    urlForm.set("title", "");
    urlForm.set("url", "https://example.com");

    await expect(updateKnowledgeSourceAction({}, urlForm)).resolves.toEqual({
      error: "Enter a title for this source.",
    });

    const unsupported = new FormData();
    unsupported.set("sourceId", "source-1");
    unsupported.set("sourceType", "connector");
    unsupported.set("title", "Connector");
    await expect(updateKnowledgeSourceAction({}, unsupported)).resolves.toEqual(
      {
        error: "This source type cannot be edited.",
      },
    );
  });
});

describe("collection actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches every selected source when creating a collection", async () => {
    mocks.createCollection.mockResolvedValueOnce({
      collection_id: "collection-1",
      created_at: new Date("2026-01-01T00:00:00Z"),
      image_url: null,
      name: "Research",
      source_count: 0,
      updated_at: new Date("2026-01-01T00:00:00Z"),
    });
    const formData = new FormData();
    formData.set("name", "Research");
    formData.append("sourceIds", "source-1");
    formData.append("sourceIds", "source-2");
    formData.append("sourceIds", "source-1");

    await expect(createCollectionAction({}, formData)).resolves.toEqual({
      message: "Collection saved.",
    });
    expect(mocks.addSourceToCollection).toHaveBeenCalledTimes(2);
    expect(mocks.addSourceToCollection).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      { userId: "user-1" },
      { collectionId: "collection-1", sourceId: "source-1" },
    );
    expect(mocks.addSourceToCollection).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { userId: "user-1" },
      { collectionId: "collection-1", sourceId: "source-2" },
    );
  });

  it("uploads a selected image and saves an optional description", async () => {
    mocks.uploadCollectionImage.mockResolvedValueOnce(
      "user-1/collection-image.png",
    );
    mocks.createCollection.mockResolvedValueOnce({
      collection_id: "collection-1",
      created_at: new Date("2026-01-01T00:00:00Z"),
      description: "Key research material",
      image_url: "user-1/collection-image.png",
      name: "Research",
      source_count: 0,
      updated_at: new Date("2026-01-01T00:00:00Z"),
    });
    const formData = new FormData();
    formData.set("name", "Research");
    formData.set("description", "Key research material");
    formData.set(
      "image",
      new File(["image"], "research.png", { type: "image/png" }),
    );

    await createCollectionAction({}, formData);

    expect(mocks.uploadCollectionImage).toHaveBeenCalledWith({
      file: expect.any(File),
      owner: { userId: "user-1" },
    });
    expect(mocks.createCollection).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-1" },
      {
        description: "Key research material",
        imageUrl: "user-1/collection-image.png",
        name: "Research",
      },
    );
  });

  it("attaches every selected source when editing a collection", async () => {
    mocks.updateCollection.mockResolvedValueOnce({
      collection_id: "collection-1",
      created_at: new Date("2026-01-01T00:00:00Z"),
      image_url: null,
      name: "Updated research",
      source_count: 1,
      updated_at: new Date("2026-01-02T00:00:00Z"),
    });
    const formData = new FormData();
    formData.set("collectionId", "collection-1");
    formData.set("name", "Updated research");
    formData.append("sourceIds", "source-2");
    formData.append("sourceIds", "source-3");

    await expect(updateCollectionAction({}, formData)).resolves.toEqual({
      message: "Collection updated.",
    });
    expect(mocks.addSourceToCollection).toHaveBeenCalledTimes(2);
    expect(mocks.addSourceToCollection).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-1" },
      { collectionId: "collection-1", sourceId: "source-2" },
    );
    expect(mocks.addSourceToCollection).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-1" },
      { collectionId: "collection-1", sourceId: "source-3" },
    );
  });

  it("adds every selected source from a collection detail page", async () => {
    const formData = new FormData();
    formData.set("collectionId", "collection-1");
    formData.append("sourceIds", "source-1");
    formData.append("sourceIds", "source-2");
    formData.append("sourceIds", "source-1");

    await expect(addSourcesToCollectionAction({}, formData)).resolves.toEqual({
      message: "2 sources added.",
    });
    expect(mocks.addSourceToCollection).toHaveBeenCalledTimes(2);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/collections/collection-1",
    );
  });

  it("removes every selected source from a collection without deleting it", async () => {
    const formData = new FormData();
    formData.set("collectionId", "collection-1");
    formData.append("sourceIds", "source-1");
    formData.append("sourceIds", "source-2");

    await expect(
      removeSourcesFromCollectionAction({}, formData),
    ).resolves.toEqual({ message: "2 sources removed." });
    expect(mocks.removeSourceFromCollection).toHaveBeenCalledTimes(2);
    expect(mocks.removeSourceFromCollection).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-1" },
      { collectionId: "collection-1", sourceId: "source-1" },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sources/source-1");
  });
});
