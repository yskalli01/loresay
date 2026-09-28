# 0003. Design System And UI Foundation

**Date**: 2026-09-10
**Status**: Accepted

## Summary

Build a calm app foundation for the private knowledge base. The first UI slice should define the product shell, design tokens, local reusable components, and common states so later features can move fast without inventing layout and interaction patterns each time.

## Context

The app currently has a scaffold landing page, root layout, Tailwind globals, `lucide-react`, and a small `cn` helper. It does not yet have the authenticated workspace shell, shared product components, or interaction states that the next slices need.

The product is an internal, signed in workspace for private knowledge work. Users will repeatedly browse sources, inspect ingestion status, ask grounded questions, organize collections, and adjust settings. The foundation needs to feel quiet, dense enough for work, and accessible by default.

The project uses Next.js App Router, Tailwind CSS, lucide icons, Clean Architecture, and a Tracer Bullet build approach. This feature should prove one real app shell path first, then add breadth through reusable primitives and documented patterns.

## Requirements

**User stories**:

1. As a signed in user, I want a clear app shell so that I can move between knowledge, chat, collections, ingestion, and settings.
2. As a user managing private knowledge, I want consistent source, table, form, loading, empty, and error states so that the product feels predictable even before every feature is complete.
3. As a builder, I want local reusable UI primitives and design tokens so that future slices can reuse accessible patterns instead of inventing page local markup.

**Acceptance criteria**:

1. **AC-1**: The app has a responsive authenticated workspace shell with desktop sidebar navigation and a mobile top bar with sheet navigation.
2. **AC-2**: The first signed in screen is a knowledge dashboard that shows recent sources, ingestion status, and a visible chat entry point, using placeholder or seeded view model data until live features connect.
3. **AC-3**: The UI foundation defines light theme tokens for color, typography, spacing, radius, borders, focus, and common surfaces, with names that allow dark mode later.
4. **AC-4**: The project has small local primitives for buttons, inputs, text areas, labels, badges, cards, tables, dialogs or sheets, empty states, error states, loading states, source cards, and chat shell primitives.
5. **AC-5**: Core components are keyboard usable, labelled for assistive technology, and expose visible focus states.
6. **AC-6**: Navigation, dashboard, component states, and responsive behavior are covered by focused tests or checks that future slices can keep running.

## Options considered

### Option 1: Keep page local markup

Build each screen directly with Tailwind classes and no shared UI primitives beyond the current `cn` helper.

**Pros**:

1. Fastest way to draw the next page.
2. No component API decisions up front.

**Cons**:

1. Repeats accessibility and state handling across every feature.
2. Makes later UI consistency depend on memory rather than code.
3. Pushes design decisions into each `/develop` run.

### Option 2: Local UI foundation

Create a small local component set, design tokens, and an app shell shaped around the planned knowledge workflows.

**Pros**:

1. Fits the current stack without a new dependency.
2. Gives later slices consistent states, focus behavior, and layout.
3. Lets the project keep only the primitives it needs.

**Cons**:

1. Requires a little more design and testing before the thin knowledge loop.
2. The team must maintain these primitives as product needs grow.

### Option 3: Install a full component library now

Adopt a larger UI library or generated component kit before building the workspace shell.

**Pros**:

1. Speeds up access to many components.
2. Can bring mature accessibility behavior if chosen well.

**Cons**:

1. Adds dependency and styling choices before the product patterns are known.
2. Can make the app feel generic or harder to tune for a dense knowledge workspace.
3. May conflict with the existing Tailwind first setup.

### Option 4: Design tool first

Pause implementation until a complete external design system exists in a design tool.

**Pros**:

1. Gives a strong visual source of truth if a designer is actively shaping the product.
2. Can reduce rework for pixel level polish.

**Cons**:

1. Blocks the next engineering slice when no design file exists in the repo context.
2. Risks over designing screens before the product loop proves itself.

## Decision

**Chosen option**: Option 2: Local UI foundation

Build a local, light theme UI foundation with a desktop sidebar plus main workspace, a mobile top bar plus sheet navigation, a knowledge dashboard as the first screen, and focused reusable primitives built with Tailwind, `cn`, and `lucide-react`.

## Rationale

The product needs a working app surface more than a broad imported design system. A local foundation gives the next slices stable interaction patterns while staying close to the existing stack. It also keeps the visual language work focused on the app's real workflows: saving knowledge, checking ingestion state, asking questions, and finding sources.

The chosen direction avoids the known failure of page local UI sprawl. It also avoids adopting a large component dependency before the team knows which patterns the product truly needs. The main tradeoff is that the project now owns the component APIs and must keep them small, documented by usage, and tested through the flows that matter.

## Feature design

**Data model sketch**:

No database schema changes. This slice uses typed presentation view models only.

| View model               | Key fields                                                                                                                                    | Source                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `NavigationItem`         | `label required`, `href required`, `icon required`, `status optional`, `active optional`                                                      | Defined in presentation shell code                          |
| `DashboardSourceCard`    | `id required`, `title required`, `type required`, `status required`, `updated_at required`, `collection_names optional`, `tag_names optional` | Placeholder data now, later mapped from source summary DTOs |
| `IngestionStatusSummary` | `queued_count required`, `processing_count required`, `failed_count required`, `latest_activity optional`                                     | Placeholder data now, later mapped from ingestion views     |
| `ChatEntrySummary`       | `thread_id optional`, `title required`, `last_message_preview optional`, `href required`                                                      | Placeholder data now, later mapped from chat thread DTOs    |

**State transitions**:

No persisted state machine. The UI must represent these display states consistently:

| Surface           | States                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| Navigation        | expanded desktop, collapsed mobile sheet, active item, disabled future item |
| Dashboard regions | loading, empty, ready, error                                                |
| Source cards      | draft, processing, ready, failed, deleted                                   |
| Forms             | idle, focused, invalid, submitting, disabled                                |
| Chat shell        | empty, composing, streaming placeholder, error                              |

**API surface**:

| Endpoint or action   | Method                        | Key inputs                                      | Key outputs                                         | Auth                       | Key errors                                              |
| -------------------- | ----------------------------- | ----------------------------------------------- | --------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| `AppShell`           | React server component layout | `children` required, current route from Next.js | responsive shell, navigation landmarks              | signed in once auth exists | missing active route should fall back to no active item |
| `KnowledgeDashboard` | React server component page   | placeholder view model data for this slice      | recent sources, ingestion summary, chat entry point | signed in once auth exists | view model load failure shows error state               |
| `ui/*` primitives    | React components              | typed props, accessible labels where needed     | reusable rendered controls and states               | none by themselves         | invalid required props fail at TypeScript or test level |

**Value sourcing**:

| Action                   | Value produced or displayed                    | Source                                                                                      |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Render shell navigation  | navigation labels                              | This spec: Knowledge, Chat, Collections, Ingestion, Settings                                |
| Render shell navigation  | navigation hrefs                               | Presentation route constants                                                                |
| Render shell navigation  | active item                                    | Current pathname from Next.js navigation APIs in the client shell boundary                  |
| Render mobile navigation | sheet open state                               | Local component state                                                                       |
| Render dashboard         | recent source title, type, status, update time | Placeholder dashboard view model now, later `knowledge_sources` summary DTOs from spec 0002 |
| Render dashboard         | ingestion counts                               | Placeholder dashboard view model now, later ingestion job summaries from spec 0002          |
| Render dashboard         | chat entry label and href                      | Presentation route constants and placeholder chat summary                                   |
| Render component states  | empty, loading, and error copy                 | Component props supplied by each screen                                                     |
| Render focus styles      | focus ring color and outline behavior          | Design tokens in globals and component classes                                              |
| Render icons             | icon choice                                    | `lucide-react` imports selected per component purpose                                       |

**Key invariants**:

1. The app shell must expose one primary navigation landmark and one main content landmark.
2. Navigation labels and routes must be defined once and reused across desktop and mobile navigation.
3. Icon only controls must have accessible names.
4. Interactive components must show a visible focus state.
5. Components must not require live database data to render their empty, loading, or error states.
6. Presentation primitives must stay in `src/presentation` and must not import domain, database, Supabase, or OpenAI code.
7. The first theme is light only, but token names must not encode light only assumptions.

**Security model**:

This slice does not introduce new data access. The shell is designed for signed in surfaces, but authentication enforcement belongs to the thin knowledge loop or auth implementation that wires live data. Placeholder content must not include private real user data. Later live dashboard reads must resolve ownership from the Supabase server session, not from client input.

**Configuration required**:

No new environment variables or third party credentials.

**Critical test scenarios**:

1. Happy path: desktop renders shell navigation, dashboard content, source cards, ingestion summary, and chat entry point, verifies **AC-1**, **AC-2**, and **AC-4**.
2. Responsive path: mobile renders a top bar and opens sheet navigation by keyboard and pointer interaction, verifies **AC-1** and **AC-5**.
3. State coverage: components render loading, empty, error, disabled, invalid, and ready states without layout breakage, verifies **AC-3**, **AC-4**, and **AC-6**.
4. Accessibility path: focus moves through navigation and primary controls in a logical order with visible focus rings and labels, verifies **AC-5**.
5. Boundary path: presentation primitives do not import infrastructure or domain modules, verifies **AC-6**.

## Build plan

- [x] Replace the scaffold page with the authenticated workspace shell skeleton and dashboard route using placeholder view models, satisfies **AC-1** and **AC-2**.
- [x] Define light theme tokens in global CSS for background, foreground, muted surfaces, borders, accent, danger, success, warning, focus, radius, and typography, satisfies **AC-3**.
- [x] Add the local UI primitive folder under `src/presentation` with button, input, text area, label, badge, card, table, sheet, empty state, error state, loading state, source card, and chat shell primitives, satisfies **AC-4** and **AC-5**.
- [x] Wire desktop sidebar navigation and mobile sheet navigation from one route config, satisfies **AC-1** and **AC-5**.
- [x] Build the knowledge dashboard sections for recent sources, ingestion status, and chat entry point using the new primitives, satisfies **AC-2** and **AC-4**.
- [x] Add focused component and route tests for navigation, responsive menu behavior, state rendering, focus labels, and Clean Architecture import boundaries, satisfies **AC-5** and **AC-6**.
- [x] Run lint, typecheck, tests, and a production build, then capture any UI issues that should move into the thin knowledge loop instead of this foundation, satisfies **AC-6**.

## Consequences

**Positive**:

1. Later slices get a real shell and common UI vocabulary before they add live data.
2. Accessibility and empty state patterns become reusable code instead of scattered Tailwind snippets.
3. The first product surface can be verified before ingestion and chat workflows are fully wired.

**Negative / tradeoffs**:

1. The project owns the primitive APIs and must keep them small.
2. Placeholder dashboard data may need careful replacement so it does not become fake product logic.
3. Dark mode is deferred, so this slice must avoid hard coding colors outside tokenized classes.

**Neutral**:

1. This decision does not add schema, auth, ingestion, retrieval, or live chat behavior.
2. The dashboard is a foundation surface, not the final knowledge organization experience.

## Follow-up

1. Design the thin knowledge loop before replacing placeholder dashboard data with live source, retrieval, and chat flows.
2. Revisit dark mode after the first real screens prove the token set.
