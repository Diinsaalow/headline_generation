"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";
import GeneratedResultPanel from "@/components/predict/GeneratedResultPanel";
import GenerationTimer from "@/components/predict/GenerationTimer";
import ModelSelect from "@/components/predict/ModelSelect";
import PredictHero from "@/components/predict/PredictHero";
import Toast from "@/components/ui/Toast";
import {
  getCharacterCountState,
  validateSomaliArticle,
} from "@/lib/article-validation";
import { apiFetch } from "@/lib/api";
import type {
  GeneratedDraft,
  ModelInfo,
  ModelsResponse,
  PredictionResult,
  PublishNewsResponse,
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
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [finalSeconds, setFinalSeconds] = useState<number | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const articleInputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!resultModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const submitButton = submitButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !publishing) {
        setResultModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      submitButton?.focus();
    };
  }, [resultModalOpen, publishing]);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function invalidateDraftIfChanged(nextArticle: string, nextModel?: string) {
    if (!draft) {
      return;
    }

    const articleChanged = nextArticle.trim() !== draft.article.trim();
    const modelChanged =
      nextModel !== undefined && nextModel !== draft.model_used;

    if (articleChanged || modelChanged) {
      setDraft(null);
      setPublishedId(null);
      setResultModalOpen(false);
      setFinalSeconds(null);
      setElapsedSeconds(null);
    }
  }

  function handleArticleChange(value: string) {
    if (value.length <= activeLimits.maxCharacters) {
      invalidateDraftIfChanged(value);
      setArticle(value);
    } else {
      const trimmed = value.slice(0, activeLimits.maxCharacters);
      invalidateDraftIfChanged(trimmed);
      setArticle(trimmed);
    }

    setValidationMessage(null);
    setError(null);
  }

  function handleModelChange(modelId: string) {
    invalidateDraftIfChanged(article, modelId);
    setSelectedModel(modelId);
  }

  function handleEditArticle() {
    setResultModalOpen(false);
    window.setTimeout(() => {
      articleInputRef.current?.focus();
    }, 0);
  }

  function handleClearArticle() {
    setArticle("");
    setDraft(null);
    setPublishedId(null);
    setResultModalOpen(false);
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
    setDraft(null);
    setResultModalOpen(false);
    setPublishedId(null);
    setFinalSeconds(null);
    setElapsedSeconds(0);
    startTimeRef.current = performance.now();

    clearTimer();
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedSeconds((performance.now() - startTimeRef.current) / 1000);
      }
    }, 100);

    try {
      const data = await apiFetch<PredictionResult>("/predict", {
        method: "POST",
        token,
        body: {
          article: trimmedArticle,
          model_id: selectedModel,
        },
      });

      const duration =
        startTimeRef.current !== null
          ? (performance.now() - startTimeRef.current) / 1000
          : data.generation_time_seconds;

      setFinalSeconds(duration);

      if (data.status === "success" && data.headline) {
        setDraft({
          article: trimmedArticle,
          headline: data.headline,
          category: data.category,
          model_used: data.model_used,
          generation_time_seconds:
            data.generation_time_seconds ?? duration ?? 0,
        });
        setResultModalOpen(true);
      } else if (data.error_message) {
        setError(data.error_message);
      }
    } catch (submitError) {
      if (startTimeRef.current !== null) {
        setFinalSeconds((performance.now() - startTimeRef.current) / 1000);
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while generating the headline.",
      );
    } finally {
      clearTimer();
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!draft || !token || publishing) {
      return;
    }

    setPublishing(true);
    setToast(null);

    try {
      const response = await apiFetch<PublishNewsResponse>("/history/publish", {
        method: "POST",
        token,
        body: {
          article: draft.article,
          headline: draft.headline,
          category: draft.category,
          model_used: draft.model_used,
          generation_time_seconds: draft.generation_time_seconds ?? 0,
        },
      });

      setPublishedId(response.id);
      setToast({
        message: "Article published successfully",
        type: "success",
      });
    } catch (publishError) {
      setToast({
        message:
          publishError instanceof Error
            ? publishError.message
            : "Could not publish the article.",
        type: "error",
      });
    } finally {
      setPublishing(false);
    }
  }

  const resultModelName =
    models.find((model) => model.id === draft?.model_used)?.name ??
    draft?.model_used ??
    "";

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
        <PredictHero />

        <div className="mx-auto max-w-4xl px-6 py-12">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <ModelSelect
              models={models}
              selectedModel={selectedModel}
              onChange={handleModelChange}
              disabled={loading}
              loading={modelsLoading}
              error={modelsError}
            />

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
                aria-invalid={Boolean(
                  validationMessage || (article.trim() && !validation.valid),
                )}
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

            <GenerationTimer
              loading={loading}
              elapsedSeconds={elapsedSeconds}
              finalSeconds={finalSeconds}
            />

            {draft && !resultModalOpen && (
              <button
                type="button"
                onClick={() => setResultModalOpen(true)}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                View generated result
              </button>
            )}
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

        {resultModalOpen && draft && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-modal-title"
          >
            <button
              type="button"
              aria-label="Close result"
              onClick={() => setResultModalOpen(false)}
              disabled={publishing}
              className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px] disabled:cursor-not-allowed"
            />

            <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                    Generated result
                  </p>
                  <h2
                    id="result-modal-title"
                    className="text-xl font-semibold text-slate-900"
                  >
                    Preview your headline
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setResultModalOpen(false)}
                  disabled={publishing}
                  aria-label="Close result"
                  className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              <GeneratedResultPanel
                draft={draft}
                modelName={resultModelName}
                onPublish={handlePublish}
                onEdit={handleEditArticle}
                publishing={publishing}
                publishedId={publishedId}
              />
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </main>
    </AuthGate>
  );
}
