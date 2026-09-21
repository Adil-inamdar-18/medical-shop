"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Loader2 } from "lucide-react";

import Field, { inputClass } from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { validateEmail, validatePassword } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      router.push(user.role === "admin" ? "/" : "/orders");
    } catch (err) {
      // Show the server error on the fields themselves (red border + message
      // under the password field) instead of a banner at the top of the form.
      setEmailError(" ");
      setPasswordError(
        err instanceof ApiError ? err.message : "Failed to log in",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Activity size={22} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to Medical App
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Email" required error={emailError}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          <Field label="Password" required error={passwordError}>
            <PasswordInput
              required
              error={Boolean(passwordError)}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError(null);
              }}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
