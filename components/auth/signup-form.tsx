"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ModeSlider } from "@/components/auth/mode-slider";
import { RoleToggle } from "@/components/auth/role-toggle";
import { signUpAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Phase 11 spec §5 — right-panel form. Same motion + eye-toggle pattern as
 * SignInForm, plus the Host/Tenant role toggle above the username field.
 */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const reduced = useReducedMotion() === true;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex h-full w-full flex-col justify-center bg-surface-paper p-8 md:p-10"
    >
      <h1 className="text-headline text-ink">Create your account</h1>
      <p className="mb-6 text-body text-ink-soft">Pick a role and we&apos;ll set you up.</p>

      <ModeSlider />

      <form action={formAction} className="mt-6 space-y-4">
        <RoleToggle />

        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field name="username" label="Username" error={state.errors?.username?.[0]}>
          <Input name="username" autoComplete="username" required />
        </Field>

        <Field name="password" label="Password" error={state.errors?.password?.[0]}>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>

        {state.message ? (
          <p role="status" className="text-caption text-signal-warning">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-center text-caption text-ink-soft">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent-evergreen-deep underline">
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
