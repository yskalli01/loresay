import { describe, expect, it } from "vitest";

import {
  buildSearchSourceFilters,
  parseSearchFilters,
  resolveSearchTimeRange,
} from "./search-filters";

const collectionId = "11111111-1111-4111-8111-111111111111";

describe("parseSearchFilters", () => {
  it("keeps supported values and trims the query", () => {
    const filters = parseSearchFilters({
      collection: collectionId,
      q: "  treeset  ",
      time: "30d",
      type: "url",
    });

    expect(filters).toEqual({
      collectionId,
      query: "treeset",
      time: "30d",
      type: "url",
    });
  });

  it("ignores unsupported or malformed values", () => {
    const filters = parseSearchFilters({
      collection: "collection-1",
      q: "   ",
      time: "soon",
      type: "banana",
    });

    expect(filters).toEqual({});
  });

  it("uses the first value of a repeated parameter", () => {
    const filters = parseSearchFilters({
      q: ["first", "second"],
      type: ["note"],
    });

    expect(filters).toEqual({ query: "first", type: "note" });
  });
});

describe("resolveSearchTimeRange", () => {
  const now = new Date(2026, 2, 15, 13, 45);

  it("returns no range without a preset", () => {
    expect(resolveSearchTimeRange(undefined, now)).toEqual({});
  });

  it("covers today", () => {
    expect(resolveSearchTimeRange("today", now)).toEqual({
      createdFrom: "2026-03-15",
      createdTo: "2026-03-15",
    });
  });

  it("covers the last 7 days inclusively", () => {
    expect(resolveSearchTimeRange("7d", now)).toEqual({
      createdFrom: "2026-03-09",
      createdTo: "2026-03-15",
    });
  });

  it("covers the last 30 days inclusively", () => {
    expect(resolveSearchTimeRange("30d", now)).toEqual({
      createdFrom: "2026-02-14",
      createdTo: "2026-03-15",
    });
  });

  it("covers the last 90 days inclusively", () => {
    expect(resolveSearchTimeRange("90d", now)).toEqual({
      createdFrom: "2025-12-16",
      createdTo: "2026-03-15",
    });
  });

  it("covers the current year", () => {
    expect(resolveSearchTimeRange("year", now)).toEqual({
      createdFrom: "2026-01-01",
      createdTo: "2026-03-15",
    });
  });
});

describe("buildSearchSourceFilters", () => {
  const now = new Date(2026, 2, 15, 13, 45);

  it("omits every key that has no value", () => {
    expect(buildSearchSourceFilters({}, now)).toEqual({});
  });

  it("combines query, type, collection, and time window", () => {
    const filters = buildSearchSourceFilters(
      { collectionId, query: "treeset", time: "7d", type: "document" },
      now,
    );

    expect(filters).toEqual({
      collectionId,
      createdFrom: "2026-03-09",
      createdTo: "2026-03-15",
      query: "treeset",
      type: "document",
    });
  });
});
