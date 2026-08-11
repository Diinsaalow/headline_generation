"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { PublicNewsDetail } from "@/lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<PublicNewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    const controller = new AbortController();

    async function loadNewsItem() {
      try {
        const response = await apiFetch<PublicNewsDetail>(
          `/news/${params.id}`,
          { signal: controller.signal },
        );
        setItem(response);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load this news article.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNewsItem();

    return () => controller.abort();
  }, [params.id]);

  const displayDate = item?.published_at ?? item?.created_at;

  return (
    <main className="flex-1 bg-slate-50/60">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/news"
          className="mb-8 inline-flex text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          ← Back to all headlines
        </Link>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-slate-600">Loading article...</p>
          </div>
        ) : !item ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h1 className="mb-2 text-xl font-semibold text-slate-900">
              Article not found
            </h1>
            <p className="text-sm text-slate-600">
              This headline may have been removed or is no longer available.
            </p>
          </div>
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {displayDate && (
                <time
                  dateTime={displayDate}
                  className="text-sm text-slate-500"
                >
                  Published {formatDate(displayDate)}
                </time>
              )}
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                {item.category}
              </span>
            </div>

            <h1 className="mb-8 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {item.headline}
            </h1>

            <div className="border-t border-slate-200 pt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                Full article
              </p>
              <div className="text-base leading-relaxed whitespace-pre-wrap text-slate-700">
                {item.article}
              </div>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
