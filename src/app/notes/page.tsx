import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { NoteForm } from "@/presentation/app/note-form";
import { PageHeader } from "@/presentation/app/page-header";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";
import { Card, CardBody, CardHeader } from "@/presentation/ui";

export default async function NotesPage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const notes = await knowledgeRepository.listKnowledgeSources({
    filters: { type: "note" },
    limit: 24,
    owner,
  });

  return (
    <AppShell activePath="/notes">
      <div className="space-y-6">
        <PageHeader
          badge="Capture"
          description="Save text notes, write in a markdown friendly body, then revise and reprocess them as your thinking changes."
          title="Notes"
        />

        <section aria-labelledby="note-editor-title" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div aria-labelledby="note-editor-title">
              <h2 className="sr-only" id="note-editor-title">
                Dedicated note editor
              </h2>
              <NoteForm spacious />
            </div>
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Note workflow
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-6 text-body">
                  Notes are processed immediately into the same retrieval path
                  as documents and URLs. Use the large editor for drafts,
                  structured notes, meeting summaries, and markdown style
                  research.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        <section aria-labelledby="saved-notes-title" className="space-y-4">
          <div>
            <h2
              className="text-xl font-semibold text-ink"
              id="saved-notes-title"
            >
              Saved notes
            </h2>
            <p className="mt-1 text-sm text-body">
              Edit a note in place or open its source detail page for metadata
              and organization.
            </p>
          </div>
          <SourceSummaryGrid
            editableNotes
            emptyDescription="Write your first note to make it available for grounded answers."
            emptyTitle="No notes yet"
            sources={notes.items}
          />
        </section>
      </div>
    </AppShell>
  );
}
