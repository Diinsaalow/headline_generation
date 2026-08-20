"use client";

import type { ModelInfo } from "@/lib/types";

type ModelSelectProps = {
  models: ModelInfo[];
  selectedModel: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

export default function ModelSelect({
  models,
  selectedModel,
  onChange,
  disabled = false,
  loading = false,
  error = null,
}: ModelSelectProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor="model"
          className="block text-sm font-medium text-slate-700"
        >
          Model
        </label>
        {!loading && models.length > 0 && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {models.length} available
          </span>
        )}
      </div>

      <div className="relative">
        <select
          id="model"
          name="model"
          value={selectedModel}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || loading || models.length === 0}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 hover:ring-2 hover:ring-blue-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:ring-0"
        >
          {loading && <option value="">Loading models...</option>}
          {!loading && models.length === 0 && (
            <option value="">No models available</option>
          )}
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
