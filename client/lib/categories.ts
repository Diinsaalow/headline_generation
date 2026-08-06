export const SYSTEM_NEWS_CATEGORIES = [
  "amni",
  "ciyaaro",
  "siyaasad",
  "caalamka",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  amni: "Amni",
  ciyaaro: "Ciyaaro",
  siyaasad: "Siyaasad",
  caalamka: "Caalamka",
};

export function getCategoryLabel(category: string) {
  const normalized = category.trim().toLowerCase();
  return CATEGORY_LABELS[normalized] ?? category;
}

export function getNewsCategories() {
  return [...SYSTEM_NEWS_CATEGORIES];
}
