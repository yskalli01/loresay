"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

import {
  createCollectionAction,
  deleteCollectionAction,
  deleteCollectionsAction,
  updateCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type {
  CollectionListFilters,
  CollectionSummaryDto,
} from "@/application/knowledge/repositories";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import {
  Button,
  Card,
  CardBody,
  FileUploadField,
  Input,
  Label,
} from "@/presentation/ui";

import { CollectionSourcePicker } from "./collection-source-picker";
import { PageHeader } from "./page-header";

const initialState: NoteActionState = {};

type CollectionManagerProps = {
  collections: CollectionSummaryDto[];
  filters: CollectionListFilters;
  sources: SourceSummaryDto[];
};

type ModalMode =
  | { type: "closed" }
  | { type: "create" }
  | { collection: CollectionSummaryDto; type: "edit" };

export function CollectionManager({
  collections,
  filters,
  sources,
}: CollectionManagerProps) {
  const [modal, setModal] = useState<ModalMode>({ type: "closed" });
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );
  const [bulkState, bulkAction, bulkPending] = useActionState(
    deleteCollectionsAction,
    initialState,
  );
  const selectedCount = selectedCollectionIds.length;
  const collectionsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(
    1,
    Math.ceil(collections.length / collectionsPerPage),
  );
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * collectionsPerPage;
  const pageCollections = collections.slice(
    pageStart,
    pageStart + collectionsPerPage,
  );
  const pageCollectionIds = useMemo(
    () => pageCollections.map((collection) => collection.collection_id),
    [pageCollections],
  );
  const allVisibleSelected =
    pageCollectionIds.length > 0 &&
    pageCollectionIds.every((collectionId) =>
      selectedCollectionIds.includes(collectionId),
    );

  function toggleCollection(collectionId: string) {
    setSelectedCollectionIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId],
    );
  }

  function toggleAllVisible() {
    setSelectedCollectionIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !pageCollectionIds.includes(id));
      }

      return Array.from(new Set([...current, ...pageCollectionIds]));
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        description="Organize saved sources, curate groups, and open focused collection views."
        title="Collections"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setModal({ type: "create" })}
          >
            New collection
          </Button>
        }
      />

      <CollectionFilters filters={filters} />

      <form action={bulkAction} className="space-y-3">
        <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              checked={allVisibleSelected}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={toggleAllVisible}
              type="checkbox"
            />
            Select visible collections
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-body">
              {selectedCount === 0
                ? "No collections selected"
                : `${selectedCount} selected`}
            </p>
            {selectedCollectionIds.map((collectionId) => (
              <input
                key={collectionId}
                name="collectionIds"
                type="hidden"
                value={collectionId}
              />
            ))}
            <Button
              disabled={bulkPending || selectedCount === 0}
              icon={<Trash2 className="h-4 w-4" />}
              type="submit"
              variant="danger"
            >
              {bulkPending ? "Deleting..." : "Delete selected"}
            </Button>
          </div>
        </div>
        <ActionMessage state={bulkState} />
      </form>

      {collections.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-body">
              No collections match this view. Adjust the filters or create a new
              collection.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <section
            aria-label="Collections"
            className="grid grid-flow-dense gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {pageCollections.map((collection) => (
              <CollectionCard
                collection={collection}
                key={collection.collection_id}
                onEdit={() => setModal({ collection, type: "edit" })}
                onToggleSelected={() =>
                  toggleCollection(collection.collection_id)
                }
                selected={selectedCollectionIds.includes(
                  collection.collection_id,
                )}
              />
            ))}
          </section>

          <div className="flex flex-col gap-2 rounded-md bg-surface-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-body">
              Showing {pageStart + 1}-
              {Math.min(pageStart + collectionsPerPage, collections.length)} of{" "}
              {collections.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={safePage === 1}
                icon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                size="sm"
                type="button"
                variant="secondary"
              >
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm font-semibold text-ink">
                {safePage} / {pageCount}
              </span>
              <Button
                disabled={safePage === pageCount}
                icon={<ChevronRight className="h-4 w-4" />}
                onClick={() =>
                  setCurrentPage((page) => Math.min(pageCount, page + 1))
                }
                size="sm"
                type="button"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {modal.type !== "closed" ? (
        <CollectionModal
          collection={modal.type === "edit" ? modal.collection : undefined}
          mode={modal.type}
          onClose={() => setModal({ type: "closed" })}
          sources={sources}
        />
      ) : null}
    </div>
  );
}

function CollectionFilters({ filters }: { filters: CollectionListFilters }) {
  const activeFilterCount = [
    filters.createdFrom,
    filters.createdTo,
    filters.hasSources,
    filters.query,
  ].filter(Boolean).length;
  const advancedFilterCount = [
    filters.createdFrom,
    filters.createdTo,
    filters.hasSources,
  ].filter(Boolean).length;

  return (
    <form
      className="rounded-lg border border-border-subtle bg-surface p-3 shadow-card"
      method="get"
    >
      <div className="grid gap-2 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] lg:items-start">
        <label className="relative">
          <span className="sr-only">Search by name</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised pl-9 pr-3 text-sm text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:h-10"
            defaultValue={filters.query}
            name="q"
            placeholder="Search collections by name"
          />
        </label>

        <details
          className="group relative rounded-md border border-border-subtle bg-surface-raised"
          open={advancedFilterCount > 0}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-muted"
                aria-hidden="true"
              />
              Filters
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
              {advancedFilterCount === 0 ? "" : advancedFilterCount}
              <ChevronDown
                className="h-4 w-4 transition group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          </summary>
          <fieldset className="grid gap-3 border-t border-border-subtle p-3 sm:grid-cols-2 lg:absolute lg:right-0 lg:top-[calc(100%+0.5rem)] lg:z-30 lg:w-[30rem] lg:rounded-lg lg:border lg:bg-surface lg:shadow-panel">
            <legend className="sr-only">More collection filters</legend>
            <FilterSelect
              label="Sources"
              name="sources"
              value={
                filters.hasSources === true
                  ? "with"
                  : filters.hasSources === false
                    ? "empty"
                    : ""
              }
            >
              <option value="">Any count</option>
              <option value="with">Has sources</option>
              <option value="empty">Empty</option>
            </FilterSelect>
            <FilterSelect
              label="Sort"
              name="sort"
              value={filters.sort ?? "name"}
            >
              <option value="name">Name</option>
              <option value="updated">Recently updated</option>
              <option value="newest">Newest</option>
              <option value="source_count">Source count</option>
            </FilterSelect>
            <FilterDate
              label="Added from"
              name="from"
              value={filters.createdFrom}
            />
            <FilterDate label="Added to" name="to" value={filters.createdTo} />
          </fieldset>
        </details>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-body transition hover:bg-surface-subtle sm:h-10"
          href="/collections"
        >
          Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Link>
        <Button icon={<Search className="h-4 w-4" />} type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
}

function CollectionCard({
  collection,
  onEdit,
  onToggleSelected,
  selected,
}: {
  collection: CollectionSummaryDto;
  onEdit: () => void;
  onToggleSelected: () => void;
  selected: boolean;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCollectionAction,
    initialState,
  );

  return (
    <Card
      className={
        selected ? "border-accent/40 ring-2 ring-accent/30" : undefined
      }
    >
      <CardBody className="p-0">
        <div className="flex items-start gap-3 p-3.5">
          <label className="mt-1 inline-flex items-center text-sm font-medium text-body">
            <input
              checked={selected}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={onToggleSelected}
              type="checkbox"
            />
            <span className="sr-only">Select {collection.name}</span>
          </label>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent-tint text-accent ring-1 ring-accent/15">
            {collection.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-full w-full object-cover"
                src={collectionImageSrc(collection)}
              />
            ) : (
              <Folder className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  className="line-clamp-1 text-base font-bold text-ink hover:text-accent"
                  href={`/collections/${collection.collection_id}`}
                >
                  {collection.name}
                </Link>
                <p className="mt-1 text-xs font-medium text-muted">
                  {collection.source_count}{" "}
                  {collection.source_count === 1 ? "source" : "sources"}
                  <span aria-hidden="true"> · </span>
                  {formatDisplayDate(collection.created_at)}
                </p>
              </div>
              <details className="group relative shrink-0">
                <summary
                  aria-label={`Actions for ${collection.name}`}
                  className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-muted transition hover:bg-surface-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </summary>
                <div className="absolute right-0 top-10 z-20 w-40 rounded-md border border-border-subtle bg-surface p-1.5 shadow-panel">
                  <button
                    className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-ink hover:bg-surface-subtle"
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      onEdit();
                    }}
                    type="button"
                  >
                    <Edit3 className="h-4 w-4 text-muted" aria-hidden="true" />
                    Edit
                  </button>
                  <form action={deleteAction}>
                    <input
                      name="collectionId"
                      type="hidden"
                      value={collection.collection_id}
                    />
                    <button
                      className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-error hover:bg-error-tint"
                      disabled={deletePending}
                      type="submit"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {deletePending ? "Deleting" : "Delete"}
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-body">
              {collection.description || "No description added."}
            </p>
          </div>
        </div>

        {deleteState.error || deleteState.message ? (
          <div className="px-3.5 pb-3">
            <ActionMessage state={deleteState} />
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function CollectionModal({
  collection,
  mode,
  onClose,
  sources,
}: {
  collection?: CollectionSummaryDto;
  mode: "create" | "edit";
  onClose: () => void;
  sources: SourceSummaryDto[];
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const action =
    mode === "create" ? createCollectionAction : updateCollectionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const title = mode === "create" ? "New Collection" : "Edit Collection";

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>("input:not([type='hidden'])")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]):not([type='hidden']), textarea:not([disabled]), [href]",
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby="collection-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex overflow-y-auto bg-ink/35 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-border-subtle bg-surface shadow-panel sm:mx-auto sm:max-h-[calc(100dvh-3rem)]"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <h2
              className="text-lg font-bold text-ink"
              id="collection-modal-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-body">
              Add the collection details and optionally attach sources.
            </p>
          </div>
          <button
            aria-label="Close collection modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form action={formAction} className="space-y-4 p-4 sm:p-5">
          {collection ? (
            <>
              <input
                name="collectionId"
                type="hidden"
                value={collection.collection_id}
              />
              <input
                name="currentImageUrl"
                type="hidden"
                value={collection.image_url ?? ""}
              />
            </>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Name</Label>
              <Input
                defaultValue={collection?.name}
                id="collection-name"
                maxLength={200}
                name="name"
                placeholder="Research, Work, Reading list"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="collection-description">
                Description{" "}
                <span className="font-normal text-muted">(optional)</span>
              </Label>
              <textarea
                className="min-h-24 w-full resize-y rounded-sm border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                defaultValue={collection?.description ?? ""}
                id="collection-description"
                maxLength={1000}
                name="description"
                placeholder="What belongs in this collection?"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <FileUploadField
                accept="image/jpeg,image/png,image/webp"
                description="JPEG, PNG, or WebP up to 4 MB"
                id="collection-image"
                kind="image"
                label={
                  collection?.image_url
                    ? "Replace collection image"
                    : "Add a collection image"
                }
                name="image"
              />
            </div>
          </div>
          <CollectionSourcePicker sources={sources} />
          <ActionMessage state={state} />
          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancel
            </Button>
            <Button
              disabled={pending}
              icon={
                mode === "create" ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <CheckSquare className="h-4 w-4" />
                )
              }
              type="submit"
            >
              {pending
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Collection"
                  : "Save Collection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function collectionImageSrc(collection: CollectionSummaryDto) {
  return collection.image_url?.startsWith("http")
    ? collection.image_url
    : `/api/collections/${collection.collection_id}/image`;
}

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return (
      <p className="rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong">
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong">
        {state.message}
      </p>
    );
  }

  return null;
}

function FilterDate({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-normal text-muted">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        defaultValue={value ?? ""}
        name={name}
        type="date"
      />
    </label>
  );
}

function FilterSelect({
  children,
  label,
  name,
  value,
}: {
  children: ReactNode;
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-normal text-muted">
        {label}
      </span>
      <select
        className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        defaultValue={value ?? ""}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
