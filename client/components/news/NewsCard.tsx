import Link from "next/link";

import type { PublicNewsSummary } from "@/lib/types";
import { getCategoryLabel } from "@/lib/categories";

type NewsCardProps = {
  item: PublicNewsSummary;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function NewsCard({ item }: NewsCardProps) {
  const displayDate = item.published_at ?? item.created_at;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {getCategoryLabel(item.category)}
        </span>
        <time dateTime={displayDate} className="text-xs text-slate-500">
          {formatDate(displayDate)}
        </time>
      </div>

      <h2 className="mb-3 line-clamp-3 text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
        {item.headline}
      </h2>

      {item.article_preview && (
        <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {item.article_preview}
        </p>
      )}

      <Link
        href={`/news/${item.id}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        Read More
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
            clipRule="evenodd"
          />
        </svg>
      </Link>
    </article>
  );
}
