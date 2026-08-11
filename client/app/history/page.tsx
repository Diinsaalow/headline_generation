"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type {
  HistoryFiltersResponse,
  HistoryItem,
  HistoryListResponse,
  HistorySortField,
  HistoryStatus,
  SortOrder,
} from "@/lib/types";

const PAGE_SIZE = 10;

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function StatusBadge({ status }: { status: HistoryStatus }) {
  const isSuccess = status === "success";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function VisibilityBadge({ publishedAt }: { publishedAt: string | null }) {
  const isPublished = Boolean(publishedAt);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        isPublished
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {isPublished ? "Published" : "Saved"}
    </span>
  );
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filters, setFilters] = useState<HistoryFiltersResponse>({
    categories: [],
    models: [],
    statuses: ["success", "failed"],
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryStatus | "">("");
  const [sortBy, setSortBy] = useState<HistorySortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: categoryFilter || undefined,
      model_used: modelFilter || undefined,
      status: statusFilter || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [
      page,
      debouncedSearch,
      categoryFilter,
      modelFilter,
      statusFilter,
      sortBy,
      sortOrder,
    ],
  );

  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<HistoryListResponse>("/history", {
          token,
          signal,
          params: queryParams,
        });

        setItems(response.items);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      } catch (loadError) {
        if (signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your history.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [token, queryParams],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();
    loadHistory(controller.signal);

    return () => controller.abort();
  }, [token, loadHistory]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function loadFilters() {
      try {
        const response = await apiFetch<HistoryFiltersResponse>(
          "/history/filters",
          {
            token,
            signal: controller.signal,
          },
        );
        setFilters(response);
      } catch {
        if (!controller.signal.aborted) {
          setFilters({
            categories: [],
            models: [],
            statuses: ["success", "failed"],
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setFiltersLoading(false);
        }
      }
    }

    loadFilters();

    return () => controller.abort();
  }, [token]);

  async function handleDelete(historyId: string) {
    if (!token || !window.confirm("Delete this saved headline history item?")) {
      return;
    }

    setDeletingId(historyId);
    setError(null);

    try {
      await apiFetch<{ message: string }>(`/history/${historyId}`, {
        method: "DELETE",
        token,
      });

      const controller = new AbortController();
      await loadHistory(controller.signal);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this history item.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleFilterChange(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setPage(1);
  }

  function handleSortChange(field: HistorySortField) {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "created_at" ? "desc" : "asc");
    }
    setPage(1);
  }

  function sortIndicator(field: HistorySortField) {
    if (sortBy !== field) {
      return null;
    }

    return sortOrder === "asc" ? "↑" : "↓";
  }

  const hasActiveFilters =
    debouncedSearch || categoryFilter || modelFilter || statusFilter;

  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <AuthGate>
      <main className="flex-1 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
                Prediction history
              </p>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
                Headline generation history
              </h1>
              <p className="max-w-2xl text-slate-600">
                Review every article processed through the system, including
                generated headlines, predicted categories, models used, and
                generation status.
              </p>
            </div>

            <Link
              href="/predict"
              className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
            >
              Generate another headline
            </Link>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))]">
              <div>
                <label
                  htmlFor="history-search"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Search
                </label>
                <input
                  id="history-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search article or headline..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="history-category"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Category
                </label>
                <select
                  id="history-category"
                  value={categoryFilter}
                  onChange={(event) =>
                    handleFilterChange(setCategoryFilter, event.target.value)
                  }
                  disabled={filtersLoading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 disabled:bg-slate-50"
                >
                  <option value="">All categories</option>
                  {filters.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="history-model"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Model
                </label>
                <select
                  id="history-model"
                  value={modelFilter}
                  onChange={(event) =>
                    handleFilterChange(setModelFilter, event.target.value)
                  }
                  disabled={filtersLoading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 disabled:bg-slate-50"
                >
                  <option value="">All models</option>
                  {filters.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="history-status"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Status
                </label>
                <select
                  id="history-status"
                  value={statusFilter}
                  onChange={(event) =>
                    handleFilterChange(
                      (value) => setStatusFilter(value as HistoryStatus | ""),
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
                >
                  <option value="">All statuses</option>
                  {filters.statuses.map((entryStatus) => (
                    <option key={entryStatus} value={entryStatus}>
                      {entryStatus}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-xs text-slate-500">Active filters applied.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedSearch("");
                    setCategoryFilter("");
                    setModelFilter("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-slate-600">Loading your history...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="mb-2 text-xl font-semibold text-slate-900">
                {hasActiveFilters
                  ? "No matching records found"
                  : "No saved headlines yet"}
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
                {hasActiveFilters
                  ? "Try adjusting your search or filters to find processed articles."
                  : "Save Database or Publish a generated headline and it will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {showingFrom}-{showingTo} of {total} records
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Sorted by {sortBy.replace("_", " ")} ({sortOrder})
                </p>
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          ["created_at", "Date"],
                          ["headline", "Headline"],
                          ["category", "Category"],
                          ["model_used", "Model"],
                          ["status", "Status"],
                        ].map(([field, label]) => (
                          <th
                            key={field}
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleSortChange(field as HistorySortField)
                              }
                              className="inline-flex items-center gap-1 transition-colors hover:text-blue-600"
                            >
                              {label}
                              <span className="text-blue-600">
                                {sortIndicator(field as HistorySortField)}
                              </span>
                            </button>
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="max-w-xs px-4 py-4">
                            <p className="text-sm font-medium text-slate-900">
                              {item.headline || "Generation failed"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {truncateText(item.article, 120)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {item.model_used}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge status={item.status} />
                              <VisibilityBadge publishedAt={item.published_at} />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right">
                            <div className="inline-flex gap-2">
                              <Link
                                href={`/history/${item.id}`}
                                className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
                              >
                                View
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === item.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:hidden">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {formatDate(item.created_at)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={item.status} />
                        <VisibilityBadge publishedAt={item.published_at} />
                      </div>
                    </div>

                    <h2 className="mb-2 text-lg font-semibold text-slate-900">
                      {item.headline || "Generation failed"}
                    </h2>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                        {item.category}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.model_used}
                      </span>
                    </div>

                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {item.article}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/history/${item.id}`}
                        className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
                      >
                        Open details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1}
                      className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={page >= totalPages}
                      className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </AuthGate>
  );
}
