"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthSession, AuthTokens } from "@/types/auth";

type AuthState = {
  tokens: AuthTokens | null;
  session: AuthSession | null;
  setTokens: (tokens: AuthTokens | null) => void;
  setSession: (session: AuthSession | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      session: null,
      setTokens: (tokens) => set({ tokens }),
      setSession: (session) => set({ session }),
      clear: () => {
        set({ tokens: null, session: null });
        if (typeof document !== "undefined") {
          document.cookie = "next-admin-auth=; path=/; max-age=0;";
        }
      },
    }),
    {
      name: "next-admin-auth",
      partialize: (state) => ({
        tokens: state.tokens,
        session: state.session,
      }),
    },
  ),
);

export const authStore = useAuthStore;
