import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
