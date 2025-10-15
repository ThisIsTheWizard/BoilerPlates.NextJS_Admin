"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REGISTER_MUTATION, type GraphQLUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth.store";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const INITIAL_STATE: RegisterFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const [formState, setFormState] = useState<RegisterFormState>(INITIAL_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const sessionUser = useAuthStore((state) => state.session?.user);
  const router = useRouter();

  const [registerMutation, { loading }] = useMutation<
    { createUser: GraphQLUser },
    {
      input: {
        email: string;
        password: string;
        first_name?: string;
        last_name?: string;
      };
    }
  >(REGISTER_MUTATION);

  useEffect(() => {
    if (!sessionUser) return;

    router.replace("/dashboard");
  }, [router, sessionUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await registerMutation({
        variables: {
          input: {
            email: formState.email,
            password: formState.password,
            first_name: formState.firstName || undefined,
            last_name: formState.lastName || undefined,
          },
        },
      });

      setSuccessMessage(
        "Account created successfully. You can now sign in with your credentials."
      );
      setFormState(INITIAL_STATE);
    } catch (error) {
      console.error("[register]", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again."
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create account
        </h1>
        <p className="text-sm text-slate-600">
          Set up your admin profile to access the dashboard.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={formState.firstName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={formState.lastName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={formState.password}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
          />
        </div>
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-100/80 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-100/80 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have access?{" "}
        <Link
          className="font-medium text-slate-900 hover:text-slate-700"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
