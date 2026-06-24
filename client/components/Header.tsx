"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, user } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-blue-600"
        >
          HeadlineAI
        </Link>

        <nav className="flex flex-wrap items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                href="/predict"
                className={`text-sm transition-colors hover:text-blue-600 ${
                  pathname === "/predict" ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Predict
              </Link>
              <Link
                href="/history"
                className={`text-sm transition-colors hover:text-blue-600 ${
                  pathname.startsWith("/history")
                    ? "text-blue-600"
                    : "text-slate-600"
                }`}
              >
                History
              </Link>
            </>
          )}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {status === "loading" ? (
            <span className="text-sm text-slate-500">Checking session...</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
