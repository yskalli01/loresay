# Homepage Note And Ingestion Flow

## Goal

Fix the homepage quick actions and content creation pages so New Note is only for writing a note, while documents and URLs share the existing ingestion page.

## Skills Read

I read AGENTS.md.

I read /develop from C:\Users\yskal\.agents\skills\develop\SKILL.md.

## Code Inspected

I inspected src/app/page.tsx.

I inspected src/app/notes/page.tsx.

I inspected src/app/ingestion/page.tsx.

I inspected src/presentation/app/note-form.tsx.

I inspected src/presentation/app/document-upload-form.tsx.

I inspected src/presentation/app/url-ingestion-form.tsx.

I inspected src/presentation/app/source-summary-grid.tsx.

I inspected src/presentation/ui/source-card.tsx.

I inspected src/app/page.test.tsx.

I searched node_modules/next/dist/docs for App Router guidance relevant to links and page forms.

## Decisions And Assumptions

This is UI behavior wiring, not a new architecture decision.

The homepage should keep quick actions, but it should have one combined ingestion action for documents and URLs.

The notes page should describe note creation only.

The note form should remove the method tiles for upload and URL, because those belong on the ingestion page.

The ingestion page should show document upload and URL ingestion as two tabs, similar to the method switcher style already used on the notes page.

The ingestion page should remove the processing status card.

The recent uploads area should sit below the tabs and use a wider layout than the current sidebar, so cards feel larger.

## Files Expected To Touch

src/app/page.tsx

src/app/notes/page.tsx

src/app/ingestion/page.tsx

src/presentation/app/note-form.tsx

src/app/page.test.tsx

Possibly src/presentation/app/source-summary-grid.tsx if the larger recent uploads layout needs a small reusable class option.

## Requirements

On the homepage, New Note must navigate to /notes.

On the homepage, there must be a single quick action for document upload and URL ingestion, navigating to /ingestion.

On the notes page, copy should clearly say the page is for notes only.

On the note form, remove upload and URL method tiles.

On the ingestion page, keep both DocumentUploadForm and UrlIngestionForm.

On the ingestion page, add tabs for switching between document ingestion and URL ingestion.

On the ingestion page, remove the processing status card and its status imports if unused.

On the ingestion page, move recent uploads below the document and URL tabs.

On the ingestion page, make recent upload cards larger by giving them the full page width area instead of the narrow aside.

Keep the existing design system and component style. Do not invent new visual language.

Keep accessibility labels and headings meaningful.

## Security Considerations

No authentication or authorization code should change.

No ingestion validation should change.

No database schema or Supabase code should change.

The page should keep using requireSessionUser and owner scoped repository calls.

## Acceptance Criteria

The homepage no longer has separate Upload File and Add URL quick actions.

The homepage has one ingestion quick action for both documents and URLs.

The notes page does not present upload or URL options.

The ingestion page still allows document upload and URL ingestion through tabs.

The ingestion page recent uploads section appears below the tabs.

The ingestion page no longer renders Processing status.

The route render tests reflect the new labels and removed processing status.

## Checks To Run

Run pnpm run test:core.

Run pnpm run lint.

Run pnpm run typecheck.

If those pass quickly, run pnpm run quality:deadline.

## Manual Test Steps

1. Open http://localhost:3000.

2. Click New Note.

3. Confirm /notes opens with only the note creation form and saved notes.

4. Go back to the homepage.

5. Click the combined ingestion action.

6. Confirm /ingestion opens with tabs for document upload and URL ingestion.

7. Switch between the document and URL tabs.

8. Confirm recent uploads are lower on the page and larger than the old sidebar version.

9. Confirm the processing status card is gone.

