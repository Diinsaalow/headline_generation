"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { HistoryItem, HistoryListResponse } from "@/lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      try {
        const response = await apiFetch<HistoryListResponse>("/history", {
          token,
          signal: controller.signal,
        });
        setItems(response.items);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your history.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

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
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== historyId),
      );
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

  return (
    <AuthGate>
      <main className="flex-1 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
                Saved results
              </p>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
                Your headline history
              </h1>
              <p className="max-w-2xl text-slate-600">
                Every authenticated headline generation is stored here with the
                original article, generated headline, category, and timestamp.
              </p>
            </div>

            <Link
              href="/predict"
              className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
            >
              Generate another headline
            </Link>
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
                No saved headlines yet
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
                Generate a headline from the prediction page and it will appear
                here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                        {formatDate(item.created_at)}
                      </p>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {item.headline}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                        {item.category}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.model_used}
                      </span>
                    </div>
                  </div>

                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {item.article}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/history/${item.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
                    >
                      Open details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGate>
  );
}
