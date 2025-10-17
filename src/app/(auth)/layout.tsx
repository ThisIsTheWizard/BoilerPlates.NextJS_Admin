"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { BlockingLoader } from "@/components/ui/blocking-loader";
import { useAuthStore } from "@/store/auth.store";

export default function GuestLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false
  );
  const sessionUser = useAuthStore((state) => state.session?.user);
  const tokens = useAuthStore((state) => state.tokens);

  useEffect(() => {
    const unsub =
      useAuthStore.persist?.onFinishHydration(() => {
        setHydrated(true);
      }) ?? null;

    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    } else if (!useAuthStore.persist) {
      setHydrated(true);
    }

    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (tokens?.accessToken || sessionUser) {
      router.replace("/dashboard");
    }
  }, [hydrated, tokens?.accessToken, sessionUser, router]);

  const shouldBlock =
    !hydrated || Boolean(tokens?.accessToken) || Boolean(sessionUser);

  if (shouldBlock) {
    return <BlockingLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-white p-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-white/60 bg-white/70 p-10 shadow-2xl backdrop-blur-2xl">
        {children}
      </div>
    </div>
  );
}
