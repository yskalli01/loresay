import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { createAvatarSignedUrl } from "@/infrastructure/supabase/account-storage";
import { AccountForms } from "@/presentation/app/account-forms";
import { AppShell } from "@/presentation/app/app-shell";

export default async function AccountPage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const profile = await knowledgeRepository.getProfile({ owner });
  const avatarUrl = await createAvatarSignedUrl(
    profile?.avatarStoragePath ?? null,
  );
  const email = user.email ?? "";
  const displayName = profile?.displayName || email.split("@")[0] || "Account";

  return (
    <AppShell activePath="/account">
      <AccountForms
        avatarUrl={avatarUrl}
        displayName={displayName}
        email={email}
      />
    </AppShell>
  );
}
