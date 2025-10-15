/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENT_USER_QUERY, LOGIN_MUTATION } from "@/services/auth";
import { useAuthStore } from "@/store/auth.store";
import type { AuthSession, AuthUser } from "@/types/auth";

type LoginFormState = {
  email: string;
  password: string;
  remember: boolean;
};

const INITIAL_STATE: LoginFormState = {
  email: "",
  password: "",
  remember: false,
};

export default function LoginPage() {
  const router = useRouter();
  const client = useApolloClient();
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setTokens = useAuthStore((state) => state.setTokens);
  const setSession = useAuthStore((state) => state.setSession);
  const clearAuth = useAuthStore((state) => state.clear);
  const sessionUser = useAuthStore((state) => state.session?.user);

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);

  useEffect(() => {
    if (!sessionUser) return;

    const redirectTo =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") ??
          "/dashboard"
        : "/dashboard";

    router.replace(redirectTo);
  }, [router, sessionUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const { data } = await loginMutation({
        variables: {
          input: { email: formState.email, password: formState.password },
        },
      });

      const tokens = data?.login;

      if (!tokens) {
        throw new Error("Missing tokens in response.");
      }

      setTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      const profile = await fetchCurrentUser(client);
      setSession(profile);

      if (typeof document !== "undefined") {
        const maxAge = formState.remember ? 60 * 60 * 24 * 7 : undefined;
        const base = "next-admin-auth=1; path=/; SameSite=Strict";
        document.cookie = maxAge ? `${base}; Max-Age=${maxAge}` : base;
      }

      const redirectTo =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next") ??
            "/dashboard"
          : "/dashboard";

      router.replace(redirectTo);
    } catch (error) {
      console.error("[login]", error);
      clearAuth();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Check your credentials and try again."
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Sign in to Admin
        </h1>
        <p className="text-sm text-slate-600">
          Use your work email and password to access the dashboard.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formState.email}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                email: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formState.password}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              type="checkbox"
              name="remember"
              checked={formState.remember}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  remember: event.target.checked,
                }))
              }
            />
            Remember me
          </label>
          <Link
            className="font-medium text-slate-900 hover:text-slate-700"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          className="font-medium text-slate-900 hover:text-slate-700"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

async function fetchCurrentUser(
  client: ApolloClient<NormalizedCacheObject>
): Promise<AuthSession> {
  const { data } = await client.query<{ user: AuthUser | null }>({
    query: CURRENT_USER_QUERY,
    fetchPolicy: "network-only",
  });
  if (!data?.user) {
    throw new Error("Unable to load your profile after login.");
  }

  return { user: data?.user };
}
