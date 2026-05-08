"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-gray-500">Phase 2 auth smoke test</p>
        </div>

        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          errors={state.errors?.email}
        />
        <Field
          name="username"
          label="Username"
          autoComplete="username"
          errors={state.errors?.username}
        />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          errors={state.errors?.password}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Role</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="tenant" defaultChecked />
            Tenant — looking for a place
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="manager" />
            Manager — listing properties
          </label>
          {state.errors?.role && (
            <p className="text-xs text-red-600">{state.errors.role[0]}</p>
          )}
        </fieldset>

        {state.message && (
          <p className="text-sm text-amber-700">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-black text-white py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Already have an account?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  errors?: string[];
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium block">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      {errors?.[0] && <p className="text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}
