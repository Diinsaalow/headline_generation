"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.id) {
      return;
    }

    const controller = new AbortController();

    async function loadHistoryItem() {
      try {
        const response = await apiFetch<HistoryItem>(`/history/${params.id}`, {
          token,
          signal: controller.signal,
        });
        setItem(response);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load this history item.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistoryItem();

    return () => controller.abort();
  }, [params.id, token]);

  async function handleDelete() {
    if (!token || !params.id || !window.confirm("Delete this history item?")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiFetch<{ message: string }>(`/history/${params.id}`, {
        method: "DELETE",
        token,
      });
      router.push("/history");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this history item.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthGate>
      <main className="flex-1 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/history"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Back to history
            </Link>

            <Link
              href="/predict"
              className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
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
              <p className="text-sm text-slate-600">
                Loading saved headline details...
              </p>
            </div>
          ) : !item ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h1 className="mb-2 text-xl font-semibold text-slate-900">
                History item not available
              </h1>
              <p className="text-sm text-slate-600">
                This item may have been deleted or you may not have access to
                it anymore.
              </p>
            </div>
          ) : (
            <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                    Saved {formatDate(item.created_at)}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {item.headline}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                    {item.category}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {item.model_used}
                  </span>
                </div>
              </div>

              <div className="grid gap-6">
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Generated headline
                  </p>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 text-lg font-medium leading-relaxed text-slate-900">
                    {item.headline}
                  </div>
                </section>

                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Original article
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                    {item.article}
                  </div>
                </section>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete history item"}
                </button>
              </div>
            </article>
          )}
        </div>
      </main>
    </AuthGate>
  );
}
