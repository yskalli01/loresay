import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { ChatPanel } from "@/presentation/app/chat-panel";
import { PageHeader } from "@/presentation/app/page-header";
import { Card, CardBody, CardHeader } from "@/presentation/ui";

export default async function ChatPage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const dashboard = await knowledgeRepository.getDashboardSummary({ owner });

  return (
    <AppShell activePath="/chat">
      <div className="space-y-6">
        <PageHeader
          badge="Grounded answers"
          description="Ask questions against your ready sources, with optional collection and tag scope for more precise retrieval."
          title="Chat with AI"
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="chat-panel-title">
            <h2 className="sr-only" id="chat-panel-title">
              Ask your knowledge
            </h2>
            <ChatPanel
              collections={dashboard.collections}
              tags={dashboard.tags}
              threadId={dashboard.defaultThread?.threadId ?? null}
            />
          </section>

          <aside className="space-y-6" aria-label="Chat context">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Retrieval scope
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-6 text-body">
                  Use the collection and tag selectors in chat to narrow the
                  sources used for an answer. Leave them set to all collections
                  and all tags when you want the broadest recall.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Available organization
                </h2>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-surface-subtle p-3">
                  <p className="text-xs font-medium uppercase text-muted">
                    Collections
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {dashboard.collections.length}
                  </p>
                </div>
                <div className="rounded-md bg-surface-subtle p-3">
                  <p className="text-xs font-medium uppercase text-muted">
                    Tags
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {dashboard.tags.length}
                  </p>
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
