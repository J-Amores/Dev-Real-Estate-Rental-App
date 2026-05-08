"use client";

import { useActionState } from "react";

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
      <Field
        label="Name"
        name="name"
        defaultValue={initial.name}
        errors={errors.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initial.email}
        errors={errors.email}
      />
      <Field
        label="Phone number"
        name="phoneNumber"
        defaultValue={initial.phoneNumber}
        errors={errors.phoneNumber}
      />

      {errors._form ? (
        <p className="text-sm text-red-600">{errors._form.join(", ")}</p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-green-700">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  errors?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-800">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      {errors?.length ? (
        <span className="mt-1 block text-xs text-red-600">
          {errors.join(", ")}
        </span>
      ) : null}
    </label>
  );
}
