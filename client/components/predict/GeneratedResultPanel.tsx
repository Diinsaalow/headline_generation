"use client";

import Link from "next/link";

import { getCategoryLabel } from "@/lib/categories";
import { countWords, formatGenerationTime } from "@/lib/text-format";
import type { GeneratedDraft } from "@/lib/types";

type GeneratedResultPanelProps = {
  draft: GeneratedDraft;
  modelName: string;
  onHeadlineChange: (headline: string) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onEdit: () => void;
  saving: boolean;
  publishing: boolean;
  savedId: string | null;
  publishedId: string | null;
};

export default function GeneratedResultPanel({
  draft,
  modelName,
  onHeadlineChange,
  onSave,
  onPublish,
  onEdit,
  saving,
  publishing,
  savedId,
  publishedId,
}: GeneratedResultPanelProps) {
  const inFlight = saving || publishing;
  const hasHeadline = draft.headline.trim().length > 0;
  const hasRequiredFields =
    draft.article.trim().length > 0 &&
    hasHeadline &&
    draft.category.trim().length > 0 &&
    draft.model_used.trim().length > 0;
  const canSave = hasRequiredFields && !inFlight && !savedId && !publishedId;
  const canPublish = hasRequiredFields && !inFlight && !publishedId;
  const headlineWordCount = countWords(draft.headline);
  const headlineCharCount = draft.headline.length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          disabled={inFlight}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit Article
        </button>
      </div>

      <div>
        <label
          htmlFor="generated-headline"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          Headline
        </label>
        <textarea
          id="generated-headline"
          rows={4}
          value={draft.headline}
          onChange={(event) => onHeadlineChange(event.target.value)}
          disabled={inFlight}
          placeholder="Edit the generated headline..."
          className="w-full resize-y rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-base font-medium leading-relaxed text-slate-900 outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>
            {headlineCharCount.toLocaleString()}{" "}
            {headlineCharCount === 1 ? "character" : "characters"}
          </span>
          <span>
            {headlineWordCount.toLocaleString()}{" "}
            {headlineWordCount === 1 ? "word" : "words"}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Category
          </p>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {getCategoryLabel(draft.category)}
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
          This preview is not public yet. Use Save Database to keep it in
          history, or Publish to make it appear on the news page.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {saving && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
              />
            )}
            {saving ? "Saving..." : "Save Database"}
          </button>

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
            {publishing ? "Publishing..." : "Publish"}
          </button>

          {savedId && !publishedId && (
            <Link
              href={`/history/${savedId}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-blue-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              View saved article
            </Link>
          )}

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
