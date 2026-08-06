"use client";

import { getCategoryLabel } from "@/lib/categories";

type CategoryFilterBarProps = {
  categories: string[];
  selectedCategory: string;
  onChange: (category: string) => void;
};

export default function CategoryFilterBar({
  categories,
  selectedCategory,
  onChange,
}: CategoryFilterBarProps) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-2">
      <div className="flex min-w-max gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === ""
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          All Categories
        </button>

        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>
    </div>
  );
}
