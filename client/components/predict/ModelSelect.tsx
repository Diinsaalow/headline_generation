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

export function isRecommendedModel(model: ModelInfo): boolean {
  return (
    model.recommended === true ||
    /afriteva/i.test(model.id) ||
    /afriteva/i.test(model.name)
  );
}

export function pickDefaultModelId(
  models: ModelInfo[],
  apiDefault?: string | null,
): string {
  const recommendedId = models.find(isRecommendedModel)?.id;
  if (recommendedId) {
    return recommendedId;
  }

  if (apiDefault && models.some((model) => model.id === apiDefault)) {
    return apiDefault;
  }

  return models[0]?.id ?? "";
}

function ModelLimitsHint({ model }: { model: ModelInfo }) {
  return (
    <p className="mt-2 text-xs text-slate-500">
      This model accepts up to {model.max_article_characters.toLocaleString()}{" "}
      characters ({model.max_input_tokens} tokens, min {model.min_article_words}{" "}
      words).
    </p>
  );
}

export default function ModelSelect({
  models,
  selectedModel,
  onChange,
  disabled = false,
  loading = false,
  error = null,
}: ModelSelectProps) {
  const recommendedModels = models.filter(isRecommendedModel);
  const otherModels = models.filter((model) => !isRecommendedModel(model));
  const selectedModelInfo =
    models.find((model) => model.id === selectedModel) ?? null;
  const selectedOtherId = otherModels.some((model) => model.id === selectedModel)
    ? selectedModel
    : "";
  const controlsDisabled = disabled || loading || models.length === 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor="model" className="block text-sm font-medium text-slate-700">
          Model
        </label>
        {!loading && models.length > 0 && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {models.length} available
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Loading models...
        </div>
      )}

      {!loading && models.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No models available
        </div>
      )}

      {!loading && recommendedModels.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Recommended model"
          className="space-y-2"
        >
          {recommendedModels.map((model) => {
            const selected = model.id === selectedModel;

            return (
              <button
                key={model.id}
                id={model.id === recommendedModels[0]?.id ? "model" : undefined}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={controlsDisabled}
                onClick={() => onChange(model.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left shadow-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:ring-2 hover:ring-blue-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {model.name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Highest scored model on the evaluation test. Selected by
                      default.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Best
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && recommendedModels.length === 0 && models.length > 0 && (
        <div className="relative">
          <select
            id="model"
            name="model"
            value={selectedModel}
            onChange={(event) => onChange(event.target.value)}
            disabled={controlsDisabled}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 hover:ring-2 hover:ring-blue-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:ring-0"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      )}

      {!loading && otherModels.length > 0 && recommendedModels.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3">
          <label
            htmlFor="other-model"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Others
          </label>
          <div className="relative">
            <select
              id="other-model"
              name="other-model"
              value={selectedOtherId}
              onChange={(event) => {
                if (event.target.value) {
                  onChange(event.target.value);
                  return;
                }

                if (recommendedModels[0]) {
                  onChange(recommendedModels[0].id);
                }
              }}
              disabled={controlsDisabled}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 hover:ring-2 hover:ring-blue-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:ring-0"
            >
              <option value="">Use a different model</option>
              {otherModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Optional. AfriTeVa stays selected unless you pick one of these
            models.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {selectedModelInfo && <ModelLimitsHint model={selectedModelInfo} />}
    </div>
  );
}

function SelectChevron() {
  return (
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
  );
}
