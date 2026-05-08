"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-gray-500">Phase 2 auth smoke test</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {state.errors?.email?.[0] && (
            <p className="text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {state.errors?.password?.[0] && (
            <p className="text-xs text-red-600">{state.errors.password[0]}</p>
          )}
        </div>

        {state.errors?._form?.[0] && (
          <p className="text-sm text-red-600">{state.errors._form[0]}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-black text-white py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
