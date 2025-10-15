"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUEST_PASSWORD_RESET_MUTATION } from "@/services/auth";
import { useAuthStore } from "@/store/auth.store";

type ForgotPasswordResponse = {
  forgotPassword: {
    success: boolean;
    message?: string | null;
  };
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionUser = useAuthStore((state) => state.session?.user);
  const router = useRouter();

  const [requestPasswordReset, { loading }] = useMutation<
    ForgotPasswordResponse,
    { input: { email: string } }
  >(REQUEST_PASSWORD_RESET_MUTATION);

  useEffect(() => {
    if (!sessionUser) return;

    router.replace("/dashboard");
  }, [router, sessionUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setErrorMessage(null);

    try {
      const { data } = await requestPasswordReset({
        variables: {
          input: { email },
        },
      });

      if (data?.forgotPassword?.success) {
        setFeedback(
          data.forgotPassword.message ??
            "If an account exists with that email, instructions have been sent.",
        );
        setEmail("");
      } else {
        setErrorMessage(
          data?.forgotPassword?.message ??
            "We were unable to trigger a password reset. Please try again.",
        );
      }
    } catch (error) {
      console.error("[forgotPassword]", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to process your request. Please try again later.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Reset your password
        </h1>
        <p className="text-sm text-slate-600">
          Enter the email address associated with your account and we'll send reset instructions.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-100/80 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        {feedback ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-100/80 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Sending instructions..." : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Remembered your credentials?{" "}
        <Link
          className="font-medium text-slate-900 hover:text-slate-700"
          href="/login"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
