"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeSlider } from "@/components/auth/mode-slider";
import { signInAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Phase 11 spec §5 — right-panel form with framer-motion entrance reveal
 * (fade + 12px lift, suppressed under reduced-motion) and password eye/EyeOff
 * toggle. Form logic, validation, and server action are unchanged from Phase 2.
 */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const reduced = useReducedMotion() === true;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex h-full w-full flex-col justify-center bg-surface-paper p-8 md:p-10"
    >
      <h1 className="text-headline text-ink">Welcome back</h1>
      <p className="mb-6 text-body text-ink-soft">Sign in to your account.</p>

      <ModeSlider />

      <form action={formAction} className="mt-6 space-y-4">
        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              aria-invalid={state.errors?.password?.[0] ? true : undefined}
              aria-describedby={state.errors?.password?.[0] ? "password-error" : undefined}
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
          {state.errors?.password?.[0] ? (
            <p id="password-error" role="alert" className="text-caption text-signal-danger">
              {state.errors.password[0]}
            </p>
          ) : null}
        </div>

        {state.errors?._form?.[0] ? (
          <p role="alert" className="text-caption text-signal-danger">
            {state.errors._form[0]}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-caption text-ink-soft">
          No account?{" "}
          <Link href="/signup" className="text-accent-evergreen-deep underline">
            Sign up
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
