"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addSourceToCollection,
  createCollection,
  deleteCollection,
  deleteCollections,
  removeSourceFromCollection,
  updateCollection,
} from "@/application/knowledge/use-cases";
import {
  archiveSource,
  purgeArchivedSource,
  retrySourceIngestion,
  saveTextDocument,
  saveTextNote,
  saveUrlSource,
  updateTextDocument,
  updateTextNote,
  updateUrlSource,
} from "@/application/knowledge/thin-loop";
import { KnowledgeDomainError } from "@/domain/knowledge";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { embeddingGateway } from "@/infrastructure/ai/thin-loop-gateways";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { uploadCollectionImage } from "@/infrastructure/supabase/collection-storage";

export type NoteActionState = {
  error?: string;
  message?: string;
  success?: boolean;
};

function domainMessage(error: KnowledgeDomainError) {
  const messages: Record<string, string> = {
    note_body_required: "Write some content before saving a note.",
    note_body_too_large: "The note must be 20,000 characters or fewer.",
    file_name_required: "Choose a file with a name.",
    no_chunks: "The content produced no readable chunks to index.",
    blocked_url_host:
      "That URL points to a private or local host, so it was blocked.",
    duplicate_active_source: "That source is already saved.",
    empty_url_content: "That URL did not contain readable text.",
    source_retry_missing_content: "This source has no extracted text to retry.",
    purge_confirmation_mismatch: "Type the source title exactly to purge it.",
    source_not_archived: "Archive the source before permanently purging it.",
    source_reprocess_not_allowed:
      "Only ready or failed sources can be reprocessed.",
    unsupported_url_content_type:
      "Only web pages and plain text URLs can be ingested.",
    unsupported_url_protocol: "Use an HTTP or HTTPS URL.",
    url_content_too_large: "That page is too large to ingest.",
    url_fetch_failed:
      "The URL could not be fetched. Check the address and try again.",
    url_required: "Enter a URL first.",
    collection_image_url_invalid: "Enter a valid collection image URL.",
    collection_image_url_protocol: "Use an HTTP or HTTPS collection image URL.",
    collection_name_required: "Enter a collection name.",
    collection_required: "Choose a collection first.",
    collection_selection_required: "Select at least one collection.",
    source_selection_required: "Select at least one source.",
    source_title_required: "Enter a title for this source.",
  };

  return messages[error.code] ?? error.message;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof KnowledgeDomainError) {
    return { error: domainMessage(error) };
  }
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }

  return { error: fallback };
}

export async function createTextNoteAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "");

    const result = await saveTextNote({
      body,
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      title,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Saved and processed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The note could not be saved.");
  }
}

export async function createTextDocumentAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const file = formData.get("document");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a plain text or Markdown file." };
    }

    const result = await saveTextDocument({
      byteSize: file.size,
      embeddings: embeddingGateway,
      fileName: file.name,
      mimeType: file.type,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      text: await file.text(),
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Uploaded and processed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The document could not be uploaded.");
  }
}

export async function createUrlSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const url = String(formData.get("url") ?? "").trim();

    const result = await saveUrlSource({
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      url,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Fetched and processed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The URL could not be ingested.");
  }
}

export async function updateTextNoteAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "");

    if (!sourceId) {
      return { error: "Source is required" };
    }

    const result = await updateTextNote({
      body,
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
      title,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Updated and reprocessed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
      success: true,
    };
  } catch (error) {
    return actionError(error, "The note could not be updated.");
  }
}

export async function updateKnowledgeSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const sourceType = String(formData.get("sourceType") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();

    if (!sourceId) {
      return { error: "Source is required." };
    }

    const common = {
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
      title,
    };
    const result =
      sourceType === "note"
        ? await updateTextNote({
            ...common,
            body: String(formData.get("body") ?? ""),
          })
        : sourceType === "document"
          ? await updateTextDocument({
              ...common,
              replacement: await documentReplacement(formData),
            })
          : sourceType === "url"
            ? await updateUrlSource({
                ...common,
                url: String(formData.get("url") ?? "").trim(),
              })
            : null;

    if (!result) {
      return { error: "This source type cannot be edited." };
    }

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: result.reprocessed
        ? `Saved and reprocessed ${result.chunkCount} chunk${
            result.chunkCount === 1 ? "" : "s"
          }.`
        : "Source details updated.",
      success: true,
    };
  } catch (error) {
    return actionError(error, "The source could not be updated.");
  }
}

async function documentReplacement(formData: FormData) {
  const file = formData.get("document");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return {
    byteSize: file.size,
    fileName: file.name,
    mimeType: file.type,
    text: await file.text(),
  };
}

export async function createCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const image = formData.get("image");
    const imageUrl =
      image instanceof File && image.size > 0
        ? await uploadCollectionImage({
            file: image,
            owner: { userId: user.id },
          })
        : null;
    const sourceIds = selectedSourceIds(formData);
    const collection = await createCollection(
      knowledgeRepository,
      { userId: user.id },
      { description, imageUrl, name },
    );

    for (const sourceId of sourceIds) {
      await addSourceToCollection(
        knowledgeRepository,
        { userId: user.id },
        { collectionId: collection.collection_id, sourceId },
      );
    }
    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collection.collection_id}`);

    return { message: "Collection saved." };
  } catch (error) {
    return actionError(error, "The collection could not be saved.");
  }
}

export async function updateCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const currentImageUrl = String(
      formData.get("currentImageUrl") ?? "",
    ).trim();
    const image = formData.get("image");
    const imageUrl =
      image instanceof File && image.size > 0
        ? await uploadCollectionImage({
            file: image,
            owner: { userId: user.id },
          })
        : currentImageUrl;
    const name = String(formData.get("name") ?? "").trim();
    const sourceIds = selectedSourceIds(formData);

    const collection = await updateCollection(
      knowledgeRepository,
      { userId: user.id },
      { collectionId, description, imageUrl, name },
    );

    for (const sourceId of sourceIds) {
      await addSourceToCollection(
        knowledgeRepository,
        { userId: user.id },
        { collectionId: collection.collection_id, sourceId },
      );
    }

    revalidatePath("/");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collection.collection_id}`);

    return { message: "Collection updated." };
  } catch (error) {
    return actionError(error, "The collection could not be updated.");
  }
}

function selectedSourceIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("sourceIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );
}

export async function deleteCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();

    await deleteCollection(
      knowledgeRepository,
      { userId: user.id },
      { collectionId },
    );

    revalidatePath("/");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");

    return { message: "Collection deleted." };
  } catch (error) {
    return actionError(error, "The collection could not be deleted.");
  }
}

export async function deleteCollectionsAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionIds = formData
      .getAll("collectionIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    await deleteCollections(
      knowledgeRepository,
      { userId: user.id },
      { collectionIds },
    );

    revalidatePath("/");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");

    return { message: "Selected collections deleted." };
  } catch (error) {
    return actionError(error, "The selected collections could not be deleted.");
  }
}
export async function addSourceToCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();
    const sourceId = String(formData.get("sourceId") ?? "").trim();

    await addSourceToCollection(
      knowledgeRepository,
      { userId: user.id },
      {
        collectionId,
        sourceId,
      },
    );
    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);

    return { message: "Collection attached." };
  } catch (error) {
    return actionError(error, "The collection could not be attached.");
  }
}

export async function addSourcesToCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();
    const sourceIds = selectedSourceIds(formData);

    if (sourceIds.length === 0) {
      return { error: "Select at least one source." };
    }

    for (const sourceId of sourceIds) {
      await addSourceToCollection(
        knowledgeRepository,
        { userId: user.id },
        { collectionId, sourceId },
      );
      revalidatePath(`/sources/${sourceId}`);
    }

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);

    return {
      message: `${sourceIds.length} source${sourceIds.length === 1 ? "" : "s"} added.`,
    };
  } catch (error) {
    return actionError(error, "The selected sources could not be added.");
  }
}

export async function removeSourcesFromCollectionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const collectionId = String(formData.get("collectionId") ?? "").trim();
    const sourceIds = selectedSourceIds(formData);

    if (sourceIds.length === 0) {
      return { error: "Select at least one source." };
    }

    for (const sourceId of sourceIds) {
      await removeSourceFromCollection(
        knowledgeRepository,
        { userId: user.id },
        { collectionId, sourceId },
      );
      revalidatePath(`/sources/${sourceId}`);
    }

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);

    return {
      message: `${sourceIds.length} source${sourceIds.length === 1 ? "" : "s"} removed.`,
    };
  } catch (error) {
    return actionError(error, "The selected sources could not be removed.");
  }
}

export async function deleteSourcesAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceIds = formData
      .getAll("sourceIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (sourceIds.length === 0) {
      return {
        error: domainMessage(
          new KnowledgeDomainError(
            "Select at least one source.",
            "source_selection_required",
          ),
        ),
      };
    }

    for (const sourceId of sourceIds) {
      const result = await archiveSource({
        owner: { userId: user.id },
        repository: knowledgeRepository,
        sourceId,
      });

      if (!result.ok) {
        return { error: result.message };
      }

      revalidatePath(`/sources/${sourceId}`);
    }

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath("/collections");

    return {
      message: `${sourceIds.length} source${sourceIds.length === 1 ? "" : "s"} deleted.`,
    };
  } catch (error) {
    return actionError(error, "The selected sources could not be deleted.");
  }
}
export async function archiveSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const sourceId = String(formData.get("sourceId") ?? "").trim();

  try {
    const user = await requireSessionUser();
    const result = await archiveSource({
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }
  } catch (error) {
    return actionError(error, "The source could not be archived.");
  }

  redirect("/sources");
}

export async function purgeSourceAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  try {
    const user = await requireSessionUser();
    const source = await knowledgeRepository.getSourceForOwner({
      owner: { userId: user.id },
      sourceId,
    });

    if (!source) {
      return { error: "Source not found." };
    }

    if (confirmation !== source.title) {
      return {
        error: domainMessage(
          new KnowledgeDomainError(
            "Type the source title exactly to purge it.",
            "purge_confirmation_mismatch",
          ),
        ),
      };
    }

    const result = await purgeArchivedSource({
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }

    return { message: result.message };
  } catch (error) {
    return actionError(error, "The source could not be purged.");
  }
}
export async function retrySourceIngestionAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  try {
    const user = await requireSessionUser();
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const result = await retrySourceIngestion({
      embeddings: embeddingGateway,
      owner: { userId: user.id },
      repository: knowledgeRepository,
      sourceId,
    });

    revalidatePath("/");
    revalidatePath("/new-source");
    revalidatePath("/chat");
    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    if (!result.ok) {
      return { error: result.message };
    }

    return {
      message: `Reprocessed ${result.chunkCount} chunk${
        result.chunkCount === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return actionError(error, "The source could not be reprocessed.");
  }
}
