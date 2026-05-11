"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createApplicationAction } from "@/lib/actions";
import { applicationSchema, type ApplicationInput } from "@/lib/schemas";

type Props = {
  propertyId: number;
  defaults: ApplicationInput;
};

export function ApplyForm({ propertyId, defaults }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: defaults,
    mode: "onSubmit",
  });

  const submit = handleSubmit(async (values) => {
    const result = await createApplicationAction(propertyId, values);
    if (!result?.errors) return;
    for (const [key, messages] of Object.entries(result.errors)) {
      if (!messages?.length) continue;
      setError(key === "_form" ? "root" : (key as Path<ApplicationInput>), {
        type: "server",
        message: messages[0],
      });
    }
  });

  const rootError = errors.root?.message;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-paper p-6"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-title text-ink">Apply to rent</h2>
        <p className="text-caption text-ink-soft">
          The manager will see your contact details and decide from there.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field name="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field
          name="phoneNumber"
          label="Phone number"
          error={errors.phoneNumber?.message}
        >
          <Input type="tel" autoComplete="tel" {...register("phoneNumber")} />
        </Field>
      </div>

      <Field
        name="message"
        label="Message (optional)"
        error={errors.message?.message}
        hint="A short note to the manager. Tell them why this place is right for you."
      >
        <Textarea rows={4} maxLength={1000} {...register("message")} />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="min-h-[1.25rem] text-caption text-signal-danger"
          role="status"
        >
          {rootError ?? ""}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}
