"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-panel p-8">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border border-hairline bg-surface-paper p-6">
        <h1 className="text-headline text-ink">Sign in</h1>

        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field name="password" label="Password" error={state.errors?.password?.[0]}>
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>

        {state.errors?._form?.[0] ? (
          <p role="alert" className="text-caption text-signal-danger">
            {state.errors._form[0]}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-caption text-ink-soft text-center">
          No account?{" "}
          <Link href="/signup" className="text-accent-evergreen-deep underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
