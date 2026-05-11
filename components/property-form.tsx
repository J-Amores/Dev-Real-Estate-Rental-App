"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId } from "react";
import { Controller, useForm, type Path } from "react-hook-form";

import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SELECT_CLASS_NAME } from "@/components/ui/select-class";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/actions";
import { PLACEHOLDER, onImageError } from "@/lib/images";
import {
  AMENITIES,
  HIGHLIGHTS,
  PROPERTY_TYPES,
  propertySchema,
  type PropertyInput,
} from "@/lib/schemas";
import { humanize } from "@/lib/utils";

const EMPTY_VALUES: PropertyInput = {
  name: "",
  description: "",
  pricePerMonth: 0,
  securityDeposit: 0,
  applicationFee: 0,
  isPetsAllowed: false,
  isParkingIncluded: false,
  photoUrls: [""],
  amenities: [],
  highlights: [],
  beds: 1,
  baths: 1,
  squareFeet: 0,
  propertyType: "Apartment",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
};

type ToggleChipProps = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

function ToggleChip({ label, checked, onChange }: ToggleChipProps) {
  const surface = checked
    ? "bg-accent-evergreen-soft text-accent-evergreen-deep border-accent-evergreen-soft"
    : "bg-surface-sunk text-ink-soft border-hairline hover:bg-surface-panel hover:text-ink";

  return (
    <label
      className={
        "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-sm border px-3 py-[6px] text-label font-medium tracking-[0.005em] " +
        "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
        "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-accent-evergreen has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-surface-paper " +
        "motion-reduce:transition-none " +
        surface
      }
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={`size-3.5 ${checked ? "opacity-100" : "opacity-0"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8.5l3.5 3.5L13 5" />
      </svg>
      <span>{label}</span>
    </label>
  );
}

type EnumChipGroupProps<T extends string> = {
  options: readonly T[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  srLabel: string;
};

function EnumChipGroup<T extends string>({
  options,
  value,
  onChange,
  srLabel,
}: EnumChipGroupProps<T>) {
  return (
    <fieldset>
      <legend className="sr-only">{srLabel}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = value.includes(opt);
          return (
            <ToggleChip
              key={opt}
              label={humanize(opt)}
              checked={checked}
              onChange={() =>
                onChange(checked ? value.filter((v) => v !== opt) : [...value, opt])
              }
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-title text-ink">{title}</h2>
        {description ? (
          <p className="text-caption text-ink-soft">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export type PropertyFormProps = {
  defaultValues?: Partial<PropertyInput>;
  submitLabel: string;
  onSubmit: (values: PropertyInput) => Promise<FormState>;
  footerExtras?: React.ReactNode;
};

export function PropertyForm({
  defaultValues,
  submitLabel,
  onSubmit,
  footerExtras,
}: PropertyFormProps) {
  const formId = useId();
  const merged: PropertyInput = { ...EMPTY_VALUES, ...defaultValues };

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: merged,
    mode: "onSubmit",
  });

  const photoUrls = watch("photoUrls") ?? [];
  const photoCount = photoUrls.length;

  const appendPhoto = () => {
    if (photoCount >= 10) return;
    setValue("photoUrls", [...photoUrls, ""], { shouldDirty: true });
  };
  const removePhoto = (index: number) => {
    if (photoCount <= 1) return;
    setValue(
      "photoUrls",
      photoUrls.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: false },
    );
  };

  const submit = handleSubmit(async (values) => {
    const result = await onSubmit(values);
    if (!result?.errors) return;
    for (const [key, messages] of Object.entries(result.errors)) {
      if (!messages?.length) continue;
      setError(key === "_form" ? "root" : (key as Path<PropertyInput>), {
        type: "server",
        message: messages[0],
      });
    }
  });

  const rootError = errors.root?.message;
  const photoListError = errors.photoUrls?.message ?? errors.photoUrls?.root?.message;

  return (
    <form
      id={formId}
      onSubmit={submit}
      noValidate
      className="rounded-lg border border-hairline bg-surface-paper"
    >
      <div className="space-y-8 p-6 sm:p-8">
        <Section
          title="Basics"
          description="What renters see first when your listing surfaces."
        >
          <Field name="name" label="Listing name" error={errors.name?.message}>
            <Input placeholder="Sunlit two-bedroom near the canal" {...register("name")} />
          </Field>
          <Field
            name="description"
            label="Description"
            error={errors.description?.message}
            hint="A few sentences. Tone is hospitable, not promotional."
          >
            <Textarea rows={5} {...register("description")} />
          </Field>
          <Field
            name="propertyType"
            label="Property type"
            error={errors.propertyType?.message}
          >
            <div className="relative">
              <select className={SELECT_CLASS_NAME} {...register("propertyType")}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </Field>
        </Section>

        <hr className="border-t border-hairline" />

        <Section
          title="Pricing"
          description="Monthly rent plus one-time fees collected before move-in."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              name="pricePerMonth"
              label="Rent per month"
              error={errors.pricePerMonth?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="1"
                min={0}
                {...register("pricePerMonth", { valueAsNumber: true })}
              />
            </Field>
            <Field
              name="securityDeposit"
              label="Security deposit"
              error={errors.securityDeposit?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="1"
                min={0}
                {...register("securityDeposit", { valueAsNumber: true })}
              />
            </Field>
            <Field
              name="applicationFee"
              label="Application fee"
              error={errors.applicationFee?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="1"
                min={0}
                {...register("applicationFee", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </Section>

        <hr className="border-t border-hairline" />

        <Section title="Specs" description="Layout and what's included.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="beds" label="Beds" error={errors.beds?.message}>
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min={0}
                {...register("beds", { valueAsNumber: true })}
              />
            </Field>
            <Field name="baths" label="Baths" error={errors.baths?.message}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                {...register("baths", { valueAsNumber: true })}
              />
            </Field>
            <Field
              name="squareFeet"
              label="Square feet"
              error={errors.squareFeet?.message}
            >
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min={0}
                {...register("squareFeet", { valueAsNumber: true })}
              />
            </Field>
          </div>
          <fieldset className="space-y-2">
            <legend className="block text-label text-ink">Included</legend>
            <div className="flex flex-wrap gap-2">
              <Controller
                control={control}
                name="isPetsAllowed"
                render={({ field }) => (
                  <ToggleChip
                    label="Pets allowed"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="isParkingIncluded"
                render={({ field }) => (
                  <ToggleChip
                    label="Parking included"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </fieldset>
        </Section>

        <hr className="border-t border-hairline" />

        <Section
          title="Photos"
          description="Paste image URLs. Up to 10. Broken URLs fall back to a placeholder."
        >
          {photoListError ? (
            <p role="alert" className="text-caption text-signal-danger">
              {photoListError}
            </p>
          ) : null}
          <ul className="space-y-3">
            {Array.from({ length: photoCount }).map((_, index) => {
              const current = photoUrls[index] ?? "";
              const previewSrc = current.trim() ? current : PLACEHOLDER;
              return (
                <li
                  key={index}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-start"
                >
                  <Field
                    name={`photoUrls.${index}`}
                    label={`Photo ${index + 1} URL`}
                    error={errors.photoUrls?.[index]?.message}
                  >
                    <Input
                      type="url"
                      placeholder="https://…"
                      {...register(`photoUrls.${index}` as const)}
                    />
                  </Field>
                  <div
                    aria-hidden
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-photo bg-surface-sunk sm:mt-[26px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={onImageError}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    disabled={photoCount <= 1}
                    className="inline-flex items-center justify-center self-start rounded-sm px-3 py-2 text-label font-medium tracking-[0.005em] text-ink-soft transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-sunk hover:text-signal-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink-soft sm:mt-[26px] motion-reduce:transition-none"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <div>
            <button
              type="button"
              onClick={appendPhoto}
              disabled={photoCount >= 10}
              className={`${buttonClassName({ variant: "ghost" })} disabled:hover:bg-transparent disabled:hover:text-ink-soft`}
            >
              + Add another photo
            </button>
            <p className="mt-1.5 text-caption text-ink-faint">{photoCount} of 10</p>
          </div>
        </Section>

        <hr className="border-t border-hairline" />

        <Section title="Amenities" description="What's available on the property.">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <EnumChipGroup
                options={AMENITIES}
                value={field.value ?? []}
                onChange={field.onChange}
                srLabel="Amenities"
              />
            )}
          />
        </Section>

        <hr className="border-t border-hairline" />

        <Section title="Highlights" description="Standout features renters search for.">
          <Controller
            control={control}
            name="highlights"
            render={({ field }) => (
              <EnumChipGroup
                options={HIGHLIGHTS}
                value={field.value ?? []}
                onChange={field.onChange}
                srLabel="Highlights"
              />
            )}
          />
        </Section>

        <hr className="border-t border-hairline" />

        <Section title="Address" description="We geocode this to place the listing on the map.">
          <Field name="address" label="Street address" error={errors.address?.message}>
            <Input {...register("address")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="city" label="City" error={errors.city?.message}>
              <Input {...register("city")} />
            </Field>
            <Field name="state" label="State or region" error={errors.state?.message}>
              <Input {...register("state")} />
            </Field>
            <Field
              name="postalCode"
              label="Postal code"
              error={errors.postalCode?.message}
            >
              <Input {...register("postalCode")} />
            </Field>
            <Field name="country" label="Country" error={errors.country?.message}>
              <Input {...register("country")} />
            </Field>
          </div>
        </Section>
      </div>

      <footer className="flex flex-col gap-3 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="min-h-[1.25rem] text-caption text-signal-danger" role="status">
          {rootError ?? ""}
        </div>
        <div className="flex items-center justify-end gap-2">
          {footerExtras}
          <Link
            href="/dashboard/properties"
            className={buttonClassName({ variant: "ghost" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </footer>
    </form>
  );
}
