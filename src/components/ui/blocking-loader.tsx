"use client";

import { Loader2 } from "lucide-react";

export function BlockingLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 p-10">
      <div className="flex items-center justify-center h-full w-full rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur">
        <Loader2 className="animate-spin h-16 w-16 text-slate-500" />
      </div>
    </div>
  );
}
