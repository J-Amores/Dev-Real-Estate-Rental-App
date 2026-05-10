"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-panel p-8">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border border-hairline bg-surface-paper p-6">
        <div>
          <h1 className="text-headline text-ink">Create account</h1>
          <p className="text-caption text-ink-soft">Phase 2 auth smoke test</p>
        </div>

        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field name="username" label="Username" error={state.errors?.username?.[0]}>
          <Input name="username" autoComplete="username" required />
        </Field>

        <Field name="password" label="Password" error={state.errors?.password?.[0]}>
          <Input name="password" type="password" autoComplete="new-password" required />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-label text-ink">Role</legend>
          <label className="flex items-center gap-2 text-body text-ink cursor-pointer">
            <input type="radio" name="role" value="tenant" defaultChecked />
            <span>Tenant — looking for a place</span>
          </label>
          <label className="flex items-center gap-2 text-body text-ink cursor-pointer">
            <input type="radio" name="role" value="manager" />
            <span>Manager — listing properties</span>
          </label>
          {state.errors?.role?.[0] ? (
            <p role="alert" className="text-caption text-signal-danger">
              {state.errors.role[0]}
            </p>
          ) : null}
        </fieldset>

        {state.message ? (
          <p role="status" className="text-caption text-signal-warning">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-caption text-ink-soft text-center">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent-evergreen-deep underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
