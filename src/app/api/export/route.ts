import { exportOwnedKnowledge } from "@/application/knowledge/use-cases";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";

export async function GET() {
  const user = await requireSessionUser();
  const payload = await exportOwnedKnowledge(knowledgeRepository, {
    userId: user.id,
  });
  const stamp = new Date().toISOString().slice(0, 10);

  return Response.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="ai-knowledge-export-${stamp}.json"`,
    },
  });
}
