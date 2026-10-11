import type { OwnerContext } from "@/application/knowledge/repositories";

import { createSupabaseAdminClient } from "./admin";

export const collectionImageBucket = "collection-images";
export const collectionImageMaxBytes = 4 * 1024 * 1024;

const collectionImageMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function uploadCollectionImage(input: {
  file: File;
  owner: OwnerContext;
}) {
  const extension = collectionImageMimeTypes.get(input.file.type.toLowerCase());

  if (!extension) {
    throw new Error("Upload a JPEG, PNG, or WebP image.");
  }
  if (input.file.size > collectionImageMaxBytes) {
    throw new Error("Collection images must be 4 MB or smaller.");
  }

  const path = `${input.owner.userId}/${crypto.randomUUID()}.${extension}`;
  const body = new Uint8Array(await input.file.arrayBuffer());
  const { error } = await createSupabaseAdminClient()
    .storage.from(collectionImageBucket)
    .upload(path, body, {
      cacheControl: "3600",
      contentType: input.file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function downloadCollectionImage(path: string) {
  const { data, error } = await createSupabaseAdminClient()
    .storage.from(collectionImageBucket)
    .download(path);

  if (error) {
    return null;
  }

  return data;
}
