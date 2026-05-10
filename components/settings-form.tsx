"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/lib/actions";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

type Props = {
  initial: { name: string; email: string; phoneNumber: string };
};

export function SettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field name="name" label="Name" error={errors.name?.[0]}>
        <Input name="name" defaultValue={initial.name} />
      </Field>
      <Field name="email" label="Email" error={errors.email?.[0]}>
        <Input name="email" type="email" defaultValue={initial.email} />
      </Field>
      <Field name="phoneNumber" label="Phone number" error={errors.phoneNumber?.[0]}>
        <Input name="phoneNumber" defaultValue={initial.phoneNumber} />
      </Field>

      {errors._form ? (
        <p role="alert" className="text-caption text-signal-danger">
          {errors._form.join(", ")}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="text-caption text-signal-success">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
