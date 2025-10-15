"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { CURRENT_USER_QUERY } from "@/services/auth";

import { Button } from "../ui/button";
import { SidebarNav } from "./sidebar-nav";

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const session = useAuthStore((state) => state.session);
  const tokens = useAuthStore((state) => state.tokens);
  const clearAuth = useAuthStore((state) => state.clear);
  const setSession = useAuthStore((state) => state.setSession);

  const [logoutMutation, { loading: loggingOut }] = useMutation(
    LOGOUT_MUTATION,
    {
      fetchPolicy: "no-cache",
    }
  );

  useQuery(CURRENT_USER_QUERY, {
    skip: !tokens?.accessToken,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.user) {
        setSession({ user: data.user });
      } else {
        clearAuth();
        router.replace("/login");
      }
    },
    onError: () => {
      clearAuth();
      router.replace("/login");
    },
  });

  const userDisplay = useMemo(() => {
    const user = session?.user;
    console.log({ user });
    if (!user) {
      return {
        name: "Guest",
        role: "Not signed in",
        initials: "NA",
      };
    }

    const name = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const fallbackName = user.email;
    const initials = [user.first_name?.[0], user.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
    const primaryRole = user.role;

    return {
      name: name.length > 0 ? name : fallbackName,
      role: primaryRole
        ? primaryRole?.charAt?.(0)?.toUpperCase?.() + primaryRole?.substring(1)
        : "User",
      initials: initials || fallbackName.slice(0, 2).toUpperCase(),
    };
  }, [session]);

  const handleLogout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.warn("[logout]", error);
    } finally {
      clearAuth();
      router.replace("/login");
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const state = useAuthStore.getState();
      if (!state.tokens?.accessToken) {
        router.replace("/login");
      }
    };

    const unsub =
      useAuthStore.persist?.onFinishHydration(() => {
        checkAuth();
      }) ?? null;

    if (useAuthStore.persist?.hasHydrated?.()) {
      checkAuth();
    }

    return () => {
      unsub?.();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen gap-6 bg-transparent px-4 py-6 sm:px-8">
      <aside className="hidden w-72 flex-col rounded-3xl border border-white/40 bg-white/60 px-6 py-8 shadow-2xl backdrop-blur-2xl transition-all lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/90 text-sm font-semibold text-white shadow-inner">
            NA
          </span>
          <span className="text-lg font-semibold text-slate-900">
            Next Admin
          </span>
        </Link>
        <div className="mt-8">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex w-full flex-col">
        <header className="sticky top-0 z-20 rounded-3xl border border-white/40 bg-white/60 backdrop-blur-2xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                className="lg:hidden"
                size="icon"
                variant="ghost"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <div className="text-sm font-medium text-slate-500">
                {breadcrumbFor(pathname)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5 text-slate-500" />
              </Button>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {userDisplay.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {userDisplay.role}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {userDisplay.initials}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-1 py-6 sm:px-2 lg:px-4">
          <div className="min-h-[calc(100vh-7rem)] rounded-3xl border border-white/40 bg-white/70 p-4 shadow-2xl backdrop-blur-2xl sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 rounded-r-3xl border border-white/40 bg-white/70 px-6 py-8 shadow-2xl backdrop-blur-2xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </div>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
}

function breadcrumbFor(pathname: string) {
  const crumbs = pathname.split("/").filter(Boolean);
  if (crumbs.length === 0) return "Dashboard";

  const navMatch = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  if (navMatch) return navMatch.title;

  return crumbs[crumbs.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
