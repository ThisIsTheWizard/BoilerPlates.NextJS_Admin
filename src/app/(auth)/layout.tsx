import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-white p-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-white/60 bg-white/70 p-10 shadow-2xl backdrop-blur-2xl">
        {children}
      </div>
    </div>
  );
}
