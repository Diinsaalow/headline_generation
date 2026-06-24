"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router, status]);

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50/60 px-6 py-20">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <h1 className="mb-2 text-xl font-semibold text-slate-900">
            Checking your session
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Protected tools are loading. If you are not signed in, you will be
            sent to the login page.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
