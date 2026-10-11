import type { OwnerContext } from "@/application/knowledge/repositories";

import { createSupabaseAdminClient } from "./admin";

export const avatarBucket = "avatars";
export const avatarMaxBytes = 2 * 1024 * 1024;

const avatarMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function avatarExtension(mimeType: string) {
  return avatarMimeTypes.get(mimeType.toLowerCase()) ?? null;
}

export function avatarStoragePath(owner: OwnerContext, mimeType: string) {
  const extension = avatarExtension(mimeType);

  if (!extension) {
    return null;
  }

  return `${owner.userId}/profile.${extension}`;
}

export async function createAvatarSignedUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(avatarBucket)
    .createSignedUrl(path, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function uploadAvatar(input: {
  file: File;
  owner: OwnerContext;
  previousPath?: string | null;
}) {
  const path = avatarStoragePath(input.owner, input.file.type);

  if (!path) {
    throw new Error("Upload a JPEG, PNG, or WebP image.");
  }

  if (input.file.size > avatarMaxBytes) {
    throw new Error("Profile images must be 2 MB or smaller.");
  }

  const supabase = createSupabaseAdminClient();
  const body = new Uint8Array(await input.file.arrayBuffer());
  const { error } = await supabase.storage.from(avatarBucket).upload(path, body, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (input.previousPath && input.previousPath !== path) {
    await removeAvatar(input.previousPath);
  }

  return path;
}

export async function removeAvatar(path: string | null | undefined) {
  if (!path) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(avatarBucket).remove([path]);
}
