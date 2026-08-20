export const SYSTEM_NEWS_CATEGORIES = [
  "amni",
  "ciyaaro",
  "siyaasad",
  "caalamka",
] as const;

export type SystemNewsCategory = (typeof SYSTEM_NEWS_CATEGORIES)[number];

const DEFAULT_NEWS_CATEGORY: SystemNewsCategory = "caalamka";

const CATEGORY_LABELS: Record<SystemNewsCategory, string> = {
  amni: "Amni",
  ciyaaro: "Ciyaaro",
  siyaasad: "Siyaasad",
  caalamka: "Caalamka",
};

const CATEGORY_ALIASES: Record<string, SystemNewsCategory> = {
  amni: "amni",
  security: "amni",
  safety: "amni",
  defense: "amni",
  defence: "amni",
  ciyaaro: "ciyaaro",
  sports: "ciyaaro",
  sport: "ciyaaro",
  siyaasad: "siyaasad",
  politics: "siyaasad",
  political: "siyaasad",
  caalamka: "caalamka",
  world: "caalamka",
  international: "caalamka",
  global: "caalamka",
  unknown: "caalamka",
  business: "caalamka",
  other: "caalamka",
  general: "caalamka",
};

export function normalizeCategory(category: string | null | undefined) {
  const cleaned = (category ?? "").trim().toLowerCase();
  if ((SYSTEM_NEWS_CATEGORIES as readonly string[]).includes(cleaned)) {
    return cleaned as SystemNewsCategory;
  }

  if (cleaned in CATEGORY_ALIASES) {
    return CATEGORY_ALIASES[cleaned];
  }

  for (const valid of SYSTEM_NEWS_CATEGORIES) {
    if (cleaned.includes(valid)) {
      return valid;
    }
  }

  return DEFAULT_NEWS_CATEGORY;
}

export function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[normalizeCategory(category)];
}

export function getNewsCategories() {
  return [...SYSTEM_NEWS_CATEGORIES];
}
