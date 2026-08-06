"use client";

import Link from "next/link";

import type { GeneratedDraft } from "@/lib/types";

function formatGenerationTime(seconds: number | undefined | null) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "Not recorded";
  }

  return `${seconds.toFixed(2)} seconds`;
}

type GeneratedResultPanelProps = {
  draft: GeneratedDraft;
  modelName: string;
  onPublish: () => Promise<void>;
  onEdit: () => void;
  publishing: boolean;
  publishedId: string | null;
};

export default function GeneratedResultPanel({
  draft,
  modelName,
  onPublish,
  onEdit,
  publishing,
  publishedId,
}: GeneratedResultPanelProps) {
  const canPublish =
    draft.article.trim().length > 0 &&
    draft.headline.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.model_used.trim().length > 0 &&
    !publishing &&
    !publishedId;

  return (
    <div className="space-y-5 p-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          disabled={publishing}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit Article
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Headline
        </p>
        <p className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-base font-medium leading-relaxed text-slate-900">
          {draft.headline || "No headline generated."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Category
          </p>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
            {draft.category}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Model used
          </p>
          <p className="text-sm font-medium text-slate-900">{modelName}</p>
          {modelName !== draft.model_used && (
            <p className="mt-1 text-xs text-slate-500">{draft.model_used}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Generation time
          </p>
          <p className="text-sm font-medium tabular-nums text-slate-900">
            {formatGenerationTime(draft.generation_time_seconds)}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Original article
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
          {draft.article}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <p className="mb-4 text-xs text-slate-500">
          This preview is not published yet. Click Publish to News when you are
          ready for it to appear on the news page.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {publishing && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {publishing ? "Publishing..." : "Publish to News"}
          </button>

          {publishedId && (
            <Link
              href={`/news/${publishedId}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-blue-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              View published article
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
