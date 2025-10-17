"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { CURRENT_USER_QUERY } from "@/services/auth";

import { Button } from "@/components/ui/button";
import { BlockingLoader } from "@/components/ui/blocking-loader";
import { SidebarNav } from "@/components/shared/sidebar-nav";

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

function breadcrumbFor(pathname: string) {
  const crumbs = pathname.split("/").filter(Boolean);
  if (crumbs.length === 0) return "Dashboard";

  const navMatch = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  if (navMatch) return navMatch.title;

  return crumbs[crumbs.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeHydrated, setStoreHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false
  );
  const pathname = usePathname();
  const router = useRouter();

  const session = useAuthStore((state) => state.session);
  const tokens = useAuthStore((state) => state.tokens);
  const clearAuth = useAuthStore((state) => state.clear);
  const setSession = useAuthStore((state) => state.setSession);
  const user = session?.user;

  const [logoutMutation, { loading: loggingOut }] = useMutation(
    LOGOUT_MUTATION,
    {
      fetchPolicy: "no-cache",
    }
  );
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const shouldFetchUser = Boolean(tokens?.accessToken);
  const {
    data: currentUserData,
    loading: userLoading,
    error: currentUserError,
  } = useQuery(CURRENT_USER_QUERY, {
    skip: !shouldFetchUser,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!shouldFetchUser) return;
    if (userLoading) return;

    if (currentUserData?.user) {
      setSession({ user: currentUserData.user });
    } else {
      clearAuth();
      router.replace("/login");
    }
  }, [
    shouldFetchUser,
    userLoading,
    currentUserData,
    setSession,
    clearAuth,
    router,
  ]);

  useEffect(() => {
    if (!currentUserError) return;
    clearAuth();
    router.replace("/login");
  }, [currentUserError, clearAuth, router]);

  const userDisplay = useMemo(() => {
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
  }, [user]);

  const userStatusLabel = user?.status
    ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
    : "Unknown status";

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
        setStoreHydrated(true);
        checkAuth();
      }) ?? null;

    if (useAuthStore.persist?.hasHydrated?.()) {
      setStoreHydrated(true);
      checkAuth();
    } else if (!useAuthStore.persist) {
      setStoreHydrated(true);
      checkAuth();
    }

    return () => {
      unsub?.();
    };
  }, [router]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const redirectingToLogin = storeHydrated && !tokens?.accessToken;
  const awaitingSession =
    !storeHydrated ||
    (Boolean(tokens?.accessToken) && (userLoading || !session?.user));

  if (redirectingToLogin || awaitingSession) {
    return <BlockingLoader />;
  }

  return (
    <div className="flex min-h-screen gap-6 bg-transparent px-4 py-6 sm:px-8">
      <aside className="hidden w-72 flex-col rounded-3xl border border-white/40 bg-white/60 px-6 py-8 shadow-2xl backdrop-blur-2xl transition-all lg:flex lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-3rem)] lg:overflow-y-auto">
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
              <div className="text-sm font-semibold text-slate-700">
                {breadcrumbFor(pathname)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold text-slate-900">
                      {userDisplay.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {userDisplay.role}
                    </span>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {userDisplay.initials}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      profileOpen ? "rotate-180" : "rotate-0"
                    )}
                    aria-hidden="true"
                  />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-white/40 bg-white/95 p-4 text-left shadow-xl backdrop-blur">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {userDisplay.initials}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {userDisplay.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {session?.user?.email ?? "No email on record"}
                        </span>
                        <span className="mt-1 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                          {userDisplay.role}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                      {user ? (
                        <>
                          <p>
                            Status:{" "}
                            <span className="font-medium text-slate-700">
                              {userStatusLabel}
                            </span>
                          </p>
                          <p>
                            Permissions:{" "}
                            <span className="font-medium text-slate-700">
                              {user.permissions.length}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p>You are not currently signed in.</p>
                      )}
                    </div>

                    <Button
                      className="mt-4 w-full"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setProfileOpen(false);
                        void handleLogout();
                      }}
                      disabled={loggingOut}
                    >
                      {loggingOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </div>
                ) : null}
              </div>
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
