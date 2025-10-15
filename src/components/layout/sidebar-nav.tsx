"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-3",
                isActive ? "text-white" : "text-slate-600 group-hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900",
                )}
              />
              {item.title}
            </span>
            {item.badge ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
