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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-ink">
            Account
          </h1>
          <p className="mt-1 text-sm text-body">
            Manage your identity, security, and profile photo.
          </p>
        </div>
        <AccountForms
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
          userId={user.id}
        />
      </div>
    </AppShell>
  );
}
