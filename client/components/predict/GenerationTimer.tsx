"use client";

type GenerationTimerProps = {
  loading: boolean;
  elapsedSeconds: number | null;
  finalSeconds: number | null;
};

export default function GenerationTimer({
  loading,
  elapsedSeconds,
  finalSeconds,
}: GenerationTimerProps) {
  if (!loading && finalSeconds === null && elapsedSeconds === null) {
    return null;
  }

  const displaySeconds = loading
    ? (elapsedSeconds ?? 0)
    : (finalSeconds ?? elapsedSeconds ?? 0);

  return (
    <div
      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600"
      aria-live="polite"
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
          />
          <span>Generating... {displaySeconds.toFixed(2)}s</span>
        </>
      ) : (
        <span>Generated in {displaySeconds.toFixed(2)} seconds</span>
      )}
    </div>
  );
}
