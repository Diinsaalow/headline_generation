import { WORD_PATTERN } from "@/lib/article-validation";

export function countWords(text: string) {
  return Array.from(text.matchAll(WORD_PATTERN)).length;
}

export function formatGenerationTime(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return "Not recorded";
  }

  const wholeSeconds = Math.round(Math.abs(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  const minuteLabel = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const secondLabel =
    remainingSeconds === 1 ? "1 second" : `${remainingSeconds} seconds`;

  if (minutes === 0) {
    return wholeSeconds === 1 ? "1 second" : `${wholeSeconds} seconds`;
  }

  if (remainingSeconds === 0) {
    return minuteLabel;
  }

  return `${minuteLabel} ${secondLabel}`;
}

export function formatGeneratedHeadline(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const formatted = trimmed
    .split(/([.!?]+)/)
    .map((part) => {
      if (!part || /^[.!?]+$/.test(part)) {
        return part;
      }

      const leadingWhitespace = part.match(/^\s*/)?.[0] ?? "";
      const content = part.slice(leadingWhitespace.length);
      if (!content) {
        return part;
      }

      return (
        leadingWhitespace + content.charAt(0).toUpperCase() + content.slice(1)
      );
    })
    .join("");

  if (/[.!?…]$/.test(formatted)) {
    return formatted;
  }

  return `${formatted}.`;
}
