import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}
