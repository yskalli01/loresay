"use server";

import { redirect } from "next/navigation";

import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

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
    return { error: "We could not sign you in with those credentials." };
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

  if (!email || password.length < 8) {
    return { error: "Use an email and a password of at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "We could not create that account." };
  }

  await knowledgeRepository.ensureProfile({
    displayName: data.user.email,
    owner: { userId: data.user.id },
  });

  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
