"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { PublicNewsListResponse } from "@/lib/types";

const PAGE_SIZE = 12;

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function NewsPage() {
  const [items, setItems] = useState<PublicNewsListResponse["items"]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
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
    }),
    [page, debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<PublicNewsListResponse>("/news", {
          signal: controller.signal,
          params: queryParams,
        });

        setItems(response.items);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load news headlines.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => controller.abort();
  }, [queryParams]);

  return (
    <main className="flex-1 bg-slate-50/60">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
            Platform news
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Generated headlines
          </h1>
          <p className="mx-auto max-w-2xl text-slate-600">
            Browse all Somali news headlines generated on this platform. Click
            any headline to read the full article.
          </p>
        </div>

        <div className="mb-8">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search headlines..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-slate-600">Loading headlines...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              {debouncedSearch ? "No headlines found" : "No headlines yet"}
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
              {debouncedSearch
                ? "Try a different search term."
                : "Headlines will appear here once articles are processed on the platform."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">
              {total} headline{total === 1 ? "" : "s"} published
            </p>

            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group block px-6 py-5 transition-colors hover:bg-slate-50"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </span>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700">
                      {item.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
                    {item.headline}
                  </h2>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages}
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
