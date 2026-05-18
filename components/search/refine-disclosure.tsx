"use client";

import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME } from "@/components/ui/select-class";
import { PROPERTY_TYPES } from "@/lib/schemas";
import { humanize } from "@/lib/utils";

const BED_OPTIONS = [1, 2, 3, 4] as const;
const BATH_OPTIONS = [1, 2, 3] as const;
const ACTIVE_KEYS = ["beds", "baths", "priceMin", "priceMax", "propertyType"] as const;

const BUTTON_BASE =
  "inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2.5 py-1.5 text-caption tabular-nums " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper";

export function RefineDisclosure() {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const firstControlRef = useRef<HTMLSelectElement | null>(null);

  const active = ACTIVE_KEYS.some((k) => params.get(k));

  useEffect(() => {
    if (open) firstControlRef.current?.focus();
  }, [open]);

  const buttonClass = [
    BUTTON_BASE,
    active
      ? "bg-accent-evergreen-soft text-accent-evergreen-deep"
      : "bg-surface-sunk text-ink-soft hover:bg-surface-panel hover:text-ink",
  ].join(" ");

  const panelContent = (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface-paper p-4 md:grid-cols-4">
      <SelectField
        ref={firstControlRef}
        name="beds"
        label="Beds"
        defaultValue={params.get("beds") ?? ""}
      >
        <option value="">Any</option>
        {BED_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </SelectField>

      <SelectField
        name="baths"
        label="Baths"
        defaultValue={params.get("baths") ?? ""}
      >
        <option value="">Any</option>
        {BATH_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </SelectField>

      <fieldset className="col-span-2 space-y-1.5">
        <legend className="block text-label font-medium text-ink">
          Price per month
        </legend>
        <div className="flex items-center gap-2">
          <Input
            form="search-hero-form"
            name="priceMin"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={params.get("priceMin") ?? ""}
            className="tabular-nums"
          />
          <span aria-hidden className="text-caption text-ink-faint">
            –
          </span>
          <Input
            form="search-hero-form"
            name="priceMax"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={params.get("priceMax") ?? ""}
            className="tabular-nums"
          />
        </div>
      </fieldset>

      <SelectField
        name="propertyType"
        label="Property type"
        defaultValue={params.get("propertyType") ?? ""}
      >
        <option value="">Any</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {humanize(t)}
          </option>
        ))}
      </SelectField>
    </div>
  );

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="refine-panel"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
      >
        Refine
        <ChevronDown
          aria-hidden
          className={[
            "size-3.5 transition-transform duration-200 motion-reduce:transition-none",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open &&
          (reduce ? (
            <div id="refine-panel" className="mt-3">
              {panelContent}
            </div>
          ) : (
            <motion.div
              id="refine-panel"
              key="refine-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="mt-3 overflow-hidden"
            >
              {panelContent}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

type SelectFieldProps = {
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLSelectElement>;
};

function SelectField({ name, label, defaultValue, children, ref }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`refine-${name}`}>{label}</Label>
      <div className="relative">
        <select
          ref={ref}
          id={`refine-${name}`}
          form="search-hero-form"
          name={name}
          defaultValue={defaultValue}
          className={SELECT_CLASS_NAME}
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
