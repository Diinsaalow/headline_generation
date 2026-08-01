"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getCharacterCountState,
  validateSomaliArticle,
} from "@/lib/article-validation";
import { apiFetch } from "@/lib/api";
import type {
  ModelInfo,
  ModelsResponse,
  PredictionResult,
} from "@/lib/types";

const DEFAULT_MAX_CHARACTERS = 1476;
const DEFAULT_MIN_WORDS = 5;

export default function PredictPage() {
  const { token } = useAuth();
  const [article, setArticle] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelLimits, setModelLimits] = useState({
    maxCharacters: DEFAULT_MAX_CHARACTERS,
    minWords: DEFAULT_MIN_WORDS,
  });
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const articleInputRef = useRef<HTMLTextAreaElement>(null);

  const selectedModelInfo = useMemo(
    () => models.find((model) => model.id === selectedModel) ?? null,
    [models, selectedModel],
  );

  const activeLimits = useMemo(
    () => ({
      maxCharacters:
        selectedModelInfo?.max_article_characters ?? modelLimits.maxCharacters,
      minWords: selectedModelInfo?.min_article_words ?? modelLimits.minWords,
    }),
    [modelLimits, selectedModelInfo],
  );

  const validation = useMemo(
    () =>
      article.trim()
        ? validateSomaliArticle(article, {
            maxCharacters: activeLimits.maxCharacters,
            minWords: activeLimits.minWords,
          })
        : { valid: false, message: null },
    [article, activeLimits.maxCharacters, activeLimits.minWords],
  );

  const characterCount = getCharacterCountState(
    article.length,
    activeLimits.maxCharacters,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      try {
        const data = await apiFetch<ModelsResponse>("/models", {
          signal: controller.signal,
        });
        const availableModels = Array.isArray(data.models) ? data.models : [];

        setModels(availableModels);
        setModelLimits({
          maxCharacters: data.max_article_characters ?? DEFAULT_MAX_CHARACTERS,
          minWords: data.min_article_words ?? DEFAULT_MIN_WORDS,
        });
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

  function handleArticleChange(value: string) {
    if (value.length <= activeLimits.maxCharacters) {
      setArticle(value);
    } else {
      setArticle(value.slice(0, activeLimits.maxCharacters));
    }

    setValidationMessage(null);
    setError(null);
  }

  function handleClearArticle() {
    setArticle("");
    setValidationMessage(null);
    setError(null);
    articleInputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedArticle = article.trim();
    if (!trimmedArticle || !selectedModel || !token) {
      return;
    }

    const submitValidation = validateSomaliArticle(trimmedArticle, {
      maxCharacters: activeLimits.maxCharacters,
      minWords: activeLimits.minWords,
    });

    if (!submitValidation.valid) {
      setValidationMessage(submitValidation.message);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationMessage(null);
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

  const canSubmit =
    article.trim().length > 0 &&
    validation.valid &&
    selectedModel &&
    !modelsLoading &&
    !loading;

  const counterClassName =
    characterCount.tone === "error"
      ? "text-red-600"
      : characterCount.tone === "warning"
        ? "text-amber-600"
        : "text-slate-400";

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
              {selectedModelInfo && (
                <p className="mt-2 text-xs text-slate-500">
                  This model accepts up to{" "}
                  {selectedModelInfo.max_article_characters.toLocaleString()}{" "}
                  characters ({selectedModelInfo.max_input_tokens} tokens).
                </p>
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
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${counterClassName}`}>
                    {characterCount.label}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearArticle}
                    disabled={!article || loading}
                    className="rounded-md border border-red-600 bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-red-700 hover:bg-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                ref={articleInputRef}
                id="article"
                name="article"
                rows={12}
                value={article}
                onChange={(event) => handleArticleChange(event.target.value)}
                placeholder="Paste your Somali news article here..."
                disabled={loading}
                maxLength={activeLimits.maxCharacters}
                aria-invalid={Boolean(validationMessage || (article.trim() && !validation.valid))}
                aria-describedby="article-help article-validation"
                className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500 ${
                  validationMessage || (article.trim() && !validation.valid)
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200"
                }`}
              />
              <p id="article-help" className="mt-2 text-xs text-slate-500">
                Somali news articles only. English, Arabic, Swahili, math, and
                symbol-heavy input are blocked before submission.
              </p>
              {article.trim() && !validation.valid && validation.message && (
                <p
                  id="article-validation"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {validation.message}
                </p>
              )}
              {validationMessage && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {validationMessage}
                </p>
              )}
            </div>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!canSubmit}
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
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    result.status === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {result.status === "success"
                    ? "This headline has been saved to your account history."
                    : "This generation attempt was saved to your history with a failed status."}
                </div>

                {result.error_message && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {result.error_message}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Headline
                  </p>
                  <p className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-base font-medium leading-relaxed text-slate-900">
                    {result.headline || "No headline generated."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium capitalize ${
                        result.status === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {result.status}
                    </span>
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
