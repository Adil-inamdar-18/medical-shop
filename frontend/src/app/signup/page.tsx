"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Loader2 } from "lucide-react";

import Field, { inputClass } from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/lib/validation";
import type { UserRole } from "@/types/user";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextNameError = validateRequired(name, "Full name");
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = !confirmPassword
      ? "Please confirm your password"
      : confirmPassword !== password
        ? "Passwords do not match"
        : null;

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    if (
      nextNameError ||
      nextEmailError ||
      nextPasswordError ||
      nextConfirmPasswordError
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await signup(name.trim(), email.trim(), password, role);
      router.push(user.role === "admin" ? "/" : "/orders");
    } catch (err) {
      // Surface the server-side error on the email field (red border +
      // message) instead of a banner at the top of the form.
      setEmailError(
        err instanceof ApiError ? err.message : "Failed to create account",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Activity size={22} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Create an account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign up for Medical App
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Full Name" required error={nameError}>
            <input
              required
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Jane Doe"
              className={inputClass}
            />
          </Field>

          <Field label="Email" required error={emailError}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Password"
              required
              error={passwordError}
              hint={!passwordError ? "At least 6 characters, 1 letter & 1 number" : undefined}
            >
              <PasswordInput
                required
                error={Boolean(passwordError)}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                  if (
                    confirmPasswordError &&
                    confirmPassword &&
                    event.target.value === confirmPassword
                  ) {
                    setConfirmPasswordError(null);
                  }
                }}
              />
            </Field>

            <Field label="Confirm Password" required error={confirmPasswordError}>
              <PasswordInput
                required
                error={Boolean(confirmPasswordError)}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
              />
            </Field>
          </div>

          <Field label="Account Type" required>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "user", label: "Customer / User" },
                  { value: "admin", label: "Admin" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    role === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
