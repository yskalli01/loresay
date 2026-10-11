import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { ChatPanel } from "@/presentation/app/chat-panel";

export default async function ChatPage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const dashboard = await knowledgeRepository.getDashboardSummary({ owner });

  return (
    <AppShell activePath="/chat">
      <ChatPanel
        collections={dashboard.collections}
        threadId={dashboard.defaultThread?.threadId ?? null}
      />
    </AppShell>
  );
}
