"use client";

import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME } from "@/components/ui/select-class";
import { PROPERTY_TYPES } from "@/lib/schemas";
import { humanize } from "@/lib/utils";

const BED_OPTIONS = [1, 2, 3, 4] as const;
const BATH_OPTIONS = [1, 2, 3] as const;
const ACTIVE_KEYS = ["beds", "baths", "priceMin", "priceMax", "propertyType"] as const;

const TRIGGER_BASE =
  "inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2.5 py-1.5 text-caption tabular-nums " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper";

type Ctx = {
  open: boolean;
  toggle: () => void;
  registerFirstControl: (el: HTMLSelectElement | null) => void;
};

const RefineCtx = createContext<Ctx | null>(null);

function useRefine(): Ctx {
  const ctx = useContext(RefineCtx);
  if (!ctx) throw new Error("Refine components must render inside <RefineProvider>");
  return ctx;
}

export function RefineProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const firstRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  const value: Ctx = {
    open,
    toggle: () => setOpen((v) => !v),
    registerFirstControl: (el) => {
      firstRef.current = el;
    },
  };

  return <RefineCtx.Provider value={value}>{children}</RefineCtx.Provider>;
}

export function RefineTrigger() {
  const { open, toggle } = useRefine();
  const params = useSearchParams();
  const active = ACTIVE_KEYS.some((k) => params.get(k));

  const className = [
    TRIGGER_BASE,
    active
      ? "bg-accent-evergreen-soft text-accent-evergreen-deep"
      : "bg-surface-sunk text-ink-soft hover:bg-surface-panel hover:text-ink",
  ].join(" ");

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="refine-panel"
      onClick={toggle}
      className={className}
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
  );
}

export function RefinePanel() {
  const { open, registerFirstControl } = useRefine();
  const reduce = useReducedMotion();
  const params = useSearchParams();

  const content = (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface-paper p-4 md:grid-cols-4">
      <SelectField
        ref={registerFirstControl}
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
    <AnimatePresence initial={false}>
      {open &&
        (reduce ? (
          <div id="refine-panel">{content}</div>
        ) : (
          <motion.div
            id="refine-panel"
            key="refine-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            {content}
          </motion.div>
        ))}
    </AnimatePresence>
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
