"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Folder,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
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
import { Badge, Button, Card, CardBody, Input, Label } from "@/presentation/ui";

import { CollectionSourcePicker } from "./collection-source-picker";

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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-ink">
            Collections
          </h1>
          <p className="mt-1 text-sm text-body">
            Organize saved sources, curate groups, and open focused collection
            views.
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setModal({ type: "create" })}
        >
          New Collection
        </Button>
      </div>

      <CollectionFilters filters={filters} />

      <form action={bulkAction} className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              checked={allVisibleSelected}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={toggleAllVisible}
              type="checkbox"
            />
            Select visible collections
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              {bulkPending ? "Deleting..." : "Delete Selected"}
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
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
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

          <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
      className="rounded-lg border border-border-subtle bg-surface shadow-card"
      method="get"
    >
      <div className="border-b border-border-subtle px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Filter collections
            </h3>
            <p className="mt-1 text-sm leading-6 text-body">
              Search by name, then open more filters only when needed.
            </p>
          </div>
          <p className="rounded-full border border-border-subtle bg-surface-subtle px-3 py-1 text-xs font-semibold text-body">
            {activeFilterCount === 0
              ? "No filters active"
              : `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Search by name</span>
            <input
              className="h-12 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-base text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              defaultValue={filters.query}
              name="q"
              placeholder="Example: research, work, reading list"
            />
          </label>

          <details
            className="group rounded-md border border-border-subtle bg-surface-raised lg:mt-7"
            open={advancedFilterCount > 0}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal
                  className="h-4 w-4 text-muted"
                  aria-hidden="true"
                />
                More filters
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
                {advancedFilterCount === 0
                  ? "Optional"
                  : `${advancedFilterCount} active`}
                <ChevronDown
                  className="h-4 w-4 transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </span>
            </summary>
            <fieldset className="grid gap-3 border-t border-border-subtle p-3 md:grid-cols-2">
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
              <FilterDate
                label="Added to"
                name="to"
                value={filters.createdTo}
              />
            </fieldset>
          </details>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-body transition hover:bg-surface-subtle"
            href="/collections"
          >
            Clear filters
          </Link>
          <Button icon={<Search className="h-4 w-4" />} type="submit">
            Apply filters
          </Button>
        </div>
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
    <Card className={selected ? "ring-2 ring-accent/50" : undefined}>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-body">
            <input
              checked={selected}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={onToggleSelected}
              type="checkbox"
            />
            <span className="sr-only">Select {collection.name}</span>
          </label>
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-accent-tint text-accent ring-1 ring-accent/15">
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
          <div className="flex gap-1">
            <button
              aria-label={`Edit ${collection.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={onEdit}
              type="button"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
            </button>
            <form action={deleteAction}>
              <input
                name="collectionId"
                type="hidden"
                value={collection.collection_id}
              />
              <button
                aria-label={`Delete ${collection.name}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-error hover:bg-error-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                disabled={deletePending}
                type="submit"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>

        <div>
          <Link
            className="text-base font-bold text-ink hover:text-accent"
            href={`/collections/${collection.collection_id}`}
          >
            {collection.name}
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="collection">{collection.source_count} sources</Badge>
            {collection.image_url ? <Badge tone="accent">image</Badge> : null}
          </div>
          {collection.description ? (
            <p className="mt-3 line-clamp-2 text-sm text-body">
              {collection.description}
            </p>
          ) : null}
        </div>

        <dl className="grid gap-3 text-sm text-body sm:grid-cols-2">
          <Info
            label="Created"
            value={formatDisplayDate(collection.created_at)}
          />
          <Info
            label="Updated"
            value={formatDisplayDate(collection.updated_at)}
          />
        </dl>
        <ActionMessage state={deleteState} />
      </CardBody>
    </Card>
  );
}

function CollectionModal({
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
  const action =
    mode === "create" ? createCollectionAction : updateCollectionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const title = mode === "create" ? "New Collection" : "Edit Collection";

  return (
    <div
      aria-labelledby="collection-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border-subtle bg-surface shadow-panel">
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
        <form action={formAction} className="space-y-5 p-5">
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
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="collection-description">
                Description{" "}
                <span className="font-normal text-muted">(optional)</span>
              </Label>
              <textarea
                className="min-h-24 w-full resize-y rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                defaultValue={collection?.description ?? ""}
                id="collection-description"
                maxLength={1000}
                name="description"
                placeholder="What belongs in this collection?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-image">
                Image <span className="font-normal text-muted">(optional)</span>
              </Label>
              <Input
                accept="image/jpeg,image/png,image/webp"
                id="collection-image"
                name="image"
                type="file"
              />
              <p className="flex items-center gap-2 text-xs text-muted">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                JPEG, PNG, or WebP. Maximum 4 MB.
              </p>
              {collection?.image_url ? (
                <p className="text-xs text-body">
                  Choose a file to replace the current image.
                </p>
              ) : null}
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
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
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
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        className="h-11 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        defaultValue={value ?? ""}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-subtle px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
