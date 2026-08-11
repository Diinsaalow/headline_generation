const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const NON_LATIN_SCRIPT_PATTERN =
  /[\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
const MATH_PATTERN =
  /(\d+\s*[+\-*/^=]\s*\d+)|(\$\$)|(\\frac\b)|(\bintegral\b)|(\bsqrt\b)/i;
export const WORD_PATTERN = /[A-Za-z\u00C0-\u024F']+/gu;

const ENGLISH_STOP_WORDS = new Set([
  "the", "and", "is", "are", "was", "were", "have", "has", "had", "this", "that",
  "with", "from", "they", "their", "been", "will", "would", "could", "should",
  "about", "which", "when", "where", "what", "who", "how", "why", "not", "but",
  "for", "you", "your", "our", "we", "he", "she", "it", "them", "than", "then",
  "into", "over", "after", "before", "because", "said", "according", "government",
  "people", "year", "years", "new", "news", "report", "reports", "officials",
]);

const SOMALI_MARKERS = new Set([
  "waxaa", "waxay", "waxa", "ayaa", "ayuu", "ayay", "waa", "ma", "ka", "ku", "la",
  "uu", "ee", "oo", "si", "lo", "leh", "yahay", "ahaa", "karo", "karaa", "ay",
  "iyadoo", "kadib", "markii", "haddii", "sida", "dadka", "dalka", "magaalada",
  "wasiir", "madaxweyne", "gobol", "qaranka", "soomaali", "soomaaliya", "dowladda",
  "wasaradda", "baarlamaanka", "booliska", "ciidanka", "degmada",
]);

const SWAHILI_MARKERS = new Set([
  "na", "kwa", "ya", "wa", "ni", "katika", "ambao", "hii", "hilo", "yake", "zake",
  "pia", "lakini", "kutoka", "baina", "watu", "serikali", "nchi", "mjini", "habari",
]);

export type ArticleValidationResult = {
  valid: boolean;
  message: string | null;
};

export type ArticleValidationOptions = {
  maxCharacters: number;
  minWords?: number;
};

function wordList(text: string) {
  return Array.from(text.matchAll(WORD_PATTERN), (match) =>
    match[0].toLowerCase(),
  );
}

export function validateSomaliArticle(
  text: string,
  options: ArticleValidationOptions,
): ArticleValidationResult {
  const cleaned = text.trim().replace(/\s+/g, " ");
  const minWords = options.minWords ?? 5;

  if (!cleaned) {
    return { valid: false, message: "Article text is required." };
  }

  if (cleaned.length > options.maxCharacters) {
    return {
      valid: false,
      message: `Article is too long. Maximum ${options.maxCharacters.toLocaleString()} characters are allowed for the selected model.`,
    };
  }

  if (ARABIC_SCRIPT_PATTERN.test(cleaned)) {
    return {
      valid: false,
      message:
        "Arabic script is not allowed. Please paste a Somali article written in Latin letters.",
    };
  }

  if (NON_LATIN_SCRIPT_PATTERN.test(cleaned)) {
    return {
      valid: false,
      message:
        "Only Somali text in Latin letters is accepted. Remove other scripts such as Cyrillic or Chinese characters.",
    };
  }

  if (MATH_PATTERN.test(cleaned)) {
    return {
      valid: false,
      message:
        "Mathematical formulas and equations are not accepted. Please paste a Somali news article.",
    };
  }

  const words = wordList(cleaned);
  if (words.length < minWords) {
    return {
      valid: false,
      message: `Please provide a Somali news article with at least ${minWords} words.`,
    };
  }

  const digitCount = Array.from(cleaned).filter((character) =>
    /\d/.test(character),
  ).length;
  const symbolCount = Array.from(cleaned).filter(
    (character) => !/\w|\s/.test(character),
  ).length;

  if ((digitCount + symbolCount) / cleaned.length > 0.2) {
    return {
      valid: false,
      message:
        "The input looks like numbers or symbols rather than a Somali news article.",
    };
  }

  const meaningfulWords = words.filter((word) => word.length > 2);
  if (meaningfulWords.length === 0) {
    return {
      valid: false,
      message: "Please provide a readable Somali news article.",
    };
  }

  const englishHits = meaningfulWords.filter((word) =>
    ENGLISH_STOP_WORDS.has(word),
  ).length;
  const somaliHits = meaningfulWords.filter((word) =>
    SOMALI_MARKERS.has(word),
  ).length;
  const swahiliHits = meaningfulWords.filter((word) =>
    SWAHILI_MARKERS.has(word),
  ).length;
  const englishRatio = englishHits / meaningfulWords.length;
  const swahiliRatio = swahiliHits / meaningfulWords.length;

  if (englishRatio >= 0.2 && somaliHits < 2) {
    return {
      valid: false,
      message:
        "The text appears to be English. This tool only accepts Somali news articles.",
    };
  }

  if (swahiliHits >= 3 && swahiliHits > somaliHits) {
    return {
      valid: false,
      message:
        "The text appears to be Swahili. This tool only accepts Somali news articles.",
    };
  }

  if (swahiliRatio >= 0.12 && somaliHits === 0) {
    return {
      valid: false,
      message:
        "The text does not look like Somali. Please paste a Somali news article.",
    };
  }

  if (somaliHits === 0 && englishRatio >= 0.08) {
    return {
      valid: false,
      message:
        "Could not detect Somali language patterns. Please paste a Somali news article.",
    };
  }

  if (somaliHits === 0 && meaningfulWords.length < 12) {
    return {
      valid: false,
      message:
        "The article is too short to verify Somali language. Please paste a longer Somali news article.",
    };
  }

  return { valid: true, message: null };
}

export function getCharacterCountState(
  length: number,
  maxCharacters: number,
) {
  const ratio = length / maxCharacters;

  if (length > maxCharacters) {
    return {
      tone: "error" as const,
      label: `${length.toLocaleString()} / ${maxCharacters.toLocaleString()} characters`,
    };
  }

  if (ratio >= 0.9) {
    return {
      tone: "warning" as const,
      label: `${length.toLocaleString()} / ${maxCharacters.toLocaleString()} characters`,
    };
  }

  return {
    tone: "normal" as const,
    label: `${length.toLocaleString()} / ${maxCharacters.toLocaleString()} characters`,
  };
}
