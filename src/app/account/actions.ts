"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  removeAvatar,
  uploadAvatar,
} from "@/infrastructure/supabase/account-storage";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type AccountActionState = {
  error?: string;
  message?: string;
};

function errorState(error: unknown, fallback: string): AccountActionState {
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }

  return { error: fallback };
}

function revalidateAccountSurfaces() {
  revalidatePath("/");
  revalidatePath("/account");
}

export async function updateProfileAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const user = await requireSessionUser();
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (displayName.length > 80) {
      return { error: "Display name must be 80 characters or fewer." };
    }

    await knowledgeRepository.updateProfile({
      displayName: displayName || null,
      owner: { userId: user.id },
    });
    revalidateAccountSurfaces();

    return { message: "Profile updated." };
  } catch (error) {
    return errorState(error, "Profile could not be updated.");
  }
}

export async function uploadProfileImageAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const user = await requireSessionUser();
    const owner = { userId: user.id };
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a profile image first." };
    }

    const profile = await knowledgeRepository.getProfile({ owner });
    const path = await uploadAvatar({
      file,
      owner,
      previousPath: profile?.avatarStoragePath,
    });

    await knowledgeRepository.updateProfileAvatar({
      avatarStoragePath: path,
      avatarUpdatedAt: new Date(),
      owner,
    });
    revalidateAccountSurfaces();

    return { message: "Profile photo updated." };
  } catch (error) {
    return errorState(error, "Profile photo could not be updated.");
  }
}

export async function removeProfileImageAction(
  _state: AccountActionState,
  _formData: FormData,
): Promise<AccountActionState> {
  void _state;
  void _formData;

  try {
    const user = await requireSessionUser();
    const owner = { userId: user.id };
    const profile = await knowledgeRepository.getProfile({ owner });

    await removeAvatar(profile?.avatarStoragePath);
    await knowledgeRepository.updateProfileAvatar({
      avatarStoragePath: null,
      avatarUpdatedAt: null,
      owner,
    });
    revalidateAccountSurfaces();

    return { message: "Profile photo removed." };
  } catch (error) {
    return errorState(error, "Profile photo could not be removed.");
  }
}

export async function updateEmailAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    await requireSessionUser();
    const email = String(formData.get("email") ?? "").trim();

    if (!email || !email.includes("@")) {
      return { error: "Enter a valid email address." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      return { error: error.message };
    }

    revalidateAccountSurfaces();

    return { message: "Email update requested." };
  } catch (error) {
    return errorState(error, "Email could not be updated.");
  }
}

export async function updatePasswordAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    await requireSessionUser();
    const password = String(formData.get("password") ?? "");

    if (password.length < 8) {
      return { error: "Use a password of at least 8 characters." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }

    return { message: "Password updated." };
  } catch (error) {
    return errorState(error, "Password could not be updated.");
  }
}

export async function deleteAccountAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireSessionUser();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm account closure." };
  }

  const owner = { userId: user.id };
  const profile = await knowledgeRepository.getProfile({ owner });
  await removeAvatar(profile?.avatarStoragePath);
  await knowledgeRepository.deleteProfile({ owner });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/auth");
}
