"use server";

import { redirect } from "next/navigation";

import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

import { signInErrorMessage, signUpErrorMessage } from "./auth-errors";

export type AuthActionState = {
  error?: string;
};

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signInWithPassword(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: signInErrorMessage(error) };
  }

  await knowledgeRepository.ensureProfile({
    displayName: data.user.email,
    owner: { userId: data.user.id },
  });

  redirect("/");
}

export async function signUpWithPassword(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName) {
    return { error: "Enter your name." };
  }
  if (displayName.length > 80) {
    return { error: "Name must be 80 characters or fewer." };
  }
  if (!email || password.length < 8) {
    return { error: "Use an email and a password of at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    options: { data: { display_name: displayName } },
    password,
  });

  if (error || !data.user) {
    return { error: signUpErrorMessage(error) };
  }

  await knowledgeRepository.ensureProfile({
    displayName,
    owner: { userId: data.user.id },
  });

  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
