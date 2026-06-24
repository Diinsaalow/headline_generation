"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type {
  ModelInfo,
  ModelsResponse,
  PredictionResult,
} from "@/lib/types";

export default function PredictPage() {
  const { token } = useAuth();
  const [article, setArticle] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      try {
        const data = await apiFetch<ModelsResponse>("/models", {
          signal: controller.signal,
        });
        const availableModels = Array.isArray(data.models) ? data.models : [];

        setModels(availableModels);
        setSelectedModel(
          data.default_model &&
            availableModels.some((model) => model.id === data.default_model)
            ? data.default_model
            : (availableModels[0]?.id ?? ""),
        );

        if (availableModels.length === 0) {
          setModelsError("No models are currently available.");
        }
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setModelsError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the available models.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setModelsLoading(false);
        }
      }
    }

    loadModels();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const submitButton = submitButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      submitButton?.focus();
    };
  }, [modalOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedArticle = article.trim();
    if (!trimmedArticle || !selectedModel || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setModalOpen(false);

    try {
      const data = await apiFetch<PredictionResult>("/predict", {
        method: "POST",
        token,
        body: {
          article: trimmedArticle,
          model_id: selectedModel,
        },
      });

      setResult(data);
      setModalOpen(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while generating the headline.",
      );
    } finally {
      setLoading(false);
    }
  }

  const resultModelName =
    models.find((model) => model.id === result?.model_used)?.name ??
    result?.model_used;

  return (
    <AuthGate>
      <main className="flex-1 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
              Protected generation
            </p>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">
              Generate and save a headline
            </h1>
            <p className="text-slate-600">
              Choose a model, paste your Somali news article, and every result
              will be stored in your account history automatically.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-slate-700"
                >
                  Model
                </label>
                {!modelsLoading && models.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {models.length} available
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  id="model"
                  name="model"
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  disabled={modelsLoading || loading || models.length === 0}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  {modelsLoading && <option value="">Loading models...</option>}
                  {!modelsLoading && models.length === 0 && (
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
              {modelsError && (
                <p className="mt-2 text-sm text-red-600">{modelsError}</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="article"
                  className="block text-sm font-medium text-slate-700"
                >
                  Article text
                </label>
                <span className="text-xs text-slate-400">
                  {article.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                id="article"
                name="article"
                rows={12}
                value={article}
                onChange={(event) => setArticle(event.target.value)}
                placeholder="Paste your Somali news article here..."
                disabled={loading}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!article.trim() || !selectedModel || modelsLoading || loading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {loading ? "Generating headline..." : "Generate headline"}
            </button>
          </form>

          {error && (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {modalOpen && result && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-modal-title"
          >
            <button
              type="button"
              aria-label="Close result"
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
            />

            <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                    Saved successfully
                  </p>
                  <h2
                    id="result-modal-title"
                    className="text-xl font-semibold text-slate-900"
                  >
                    Generated result
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close result"
                  className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  This headline has been saved to your account history.
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Headline
                  </p>
                  <p className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-base font-medium leading-relaxed text-slate-900">
                    {result.headline}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Category
                    </p>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
                      {result.category}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Model used
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {resultModelName}
                    </p>
                    {resultModelName !== result.model_used && (
                      <p className="mt-1 text-xs text-slate-500">
                        {result.model_used}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/history/${result.history_id}`}
                    className="inline-flex w-full items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
                  >
                    Open saved item
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    Keep editing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
