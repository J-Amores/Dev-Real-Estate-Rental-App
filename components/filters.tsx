import Link from "next/link";

import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAction } from "@/lib/actions";
import { PROPERTY_TYPES } from "@/lib/schemas";
import { humanize } from "@/lib/utils";

const SELECT_CLS =
  "block w-full appearance-none rounded-sm border border-hairline bg-surface-sunk px-3 py-[10px] pr-9 text-body text-ink " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus-visible:outline-none focus-visible:bg-surface-paper focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-0 " +
  "motion-reduce:transition-none";

export type FilterValues = {
  location?: string;
  beds?: number;
  baths?: number;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
};

const BED_OPTIONS = [1, 2, 3, 4] as const;
const BATH_OPTIONS = [1, 2, 3] as const;

function selectValue(n: number | undefined): string {
  return typeof n === "number" && n > 0 ? String(n) : "";
}

type SelectFieldProps = {
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
};

function SelectField({ name, label, defaultValue, children }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <select
          id={name}
          name={name}
          defaultValue={defaultValue}
          className={SELECT_CLS}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
        >
          ▾
        </span>
      </div>
    </div>
  );
}

export function Filters({ initial }: { initial: FilterValues }) {
  return (
    <form
      action={searchAction}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_1fr_auto] lg:items-end"
      role="search"
      aria-label="Property filters"
    >
      <Field name="location" label="Location" hint="City, neighborhood, or ZIP">
        <Input
          name="location"
          type="text"
          autoComplete="off"
          placeholder="Anywhere"
          defaultValue={initial.location ?? ""}
        />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="block text-label font-medium text-ink">
          Price per month
        </legend>
        <div className="flex items-center gap-2">
          <Input
            name="priceMin"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={selectValue(initial.priceMin)}
            className="tabular-nums"
          />
          <span aria-hidden className="text-caption text-ink-faint">
            –
          </span>
          <Input
            name="priceMax"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={selectValue(initial.priceMax)}
            className="tabular-nums"
          />
        </div>
      </fieldset>

      <SelectField name="beds" label="Beds" defaultValue={selectValue(initial.beds)}>
        <option value="">Any</option>
        {BED_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </SelectField>

      <SelectField name="baths" label="Baths" defaultValue={selectValue(initial.baths)}>
        <option value="">Any</option>
        {BATH_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </SelectField>

      <SelectField
        name="propertyType"
        label="Property type"
        defaultValue={initial.propertyType ?? ""}
      >
        <option value="">Any</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {humanize(t)}
          </option>
        ))}
      </SelectField>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary">
          Search
        </Button>
        <Link href="/search" className={buttonClassName({ variant: "ghost" })}>
          Clear
        </Link>
      </div>
    </form>
  );
}
