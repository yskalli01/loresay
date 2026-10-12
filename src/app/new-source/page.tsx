import { requireSessionUser } from "@/infrastructure/auth/session";
import { AppShell } from "@/presentation/app/app-shell";
import { NewSourceTabs } from "@/presentation/app/new-source-tabs";
import { PageHeader } from "@/presentation/app/page-header";

export default async function NewSourcePage() {
  await requireSessionUser();

  return (
    <AppShell activePath="/">
      <div className="space-y-4">
        <PageHeader
          badge="New Source"
          description="Write a note, upload a document, or save a web page."
          title="New Source"
        />

        <NewSourceTabs />
      </div>
    </AppShell>
  );
}
