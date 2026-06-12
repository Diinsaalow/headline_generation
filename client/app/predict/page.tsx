"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type PredictionResult = {
  headline: string;
  category: string;
};

export default function PredictPage() {
  const [article, setArticle] = useState("");
  const [headline, setHeadline] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setModalOpen(false);
  }

  useEffect(() => {
    if (!modalOpen) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedArticle = article.trim();
    if (!trimmedArticle) return;

    setLoading(true);
    setError(null);
    setModalOpen(false);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: trimmedArticle }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data: PredictionResult = await response.json();
      setHeadline(data.headline || "No headline generated.");
      setCategory(data.category || "unknown");
      setModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Is the API running on port 8000?",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">
            Generate headline
          </h1>
          <p className="text-slate-600">
            Paste your Somali news article below to generate a headline and
            category.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="article"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Article text
            </label>
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
            type="submit"
            disabled={!article.trim() || loading}
            className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {modalOpen && headline && category && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-modal-title"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/30"
          />

          <div className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                  Result
                </p>
                <h2
                  id="result-modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Generated headline
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Headline
                </p>
                <p className="text-sm leading-relaxed text-slate-900">
                  {headline}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Category
                </p>
                <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                  {category}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
