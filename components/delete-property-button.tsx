"use client";

import { useState, useTransition } from "react";

import { deletePropertyAction } from "@/lib/actions";

type Variant = "card" | "page";

type Props = {
  propertyId: number;
  variant?: Variant;
};

export function DeletePropertyButton({ propertyId, variant = "card" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    startTransition(async () => {
      await deletePropertyAction(propertyId);
    });
  };

  const base =
    "inline-flex items-center justify-center rounded-sm text-label font-medium tracking-[0.005em] " +
    "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper " +
    "disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none";

  const size = variant === "page" ? "px-4 py-[10px]" : "px-3 py-2";

  if (!confirming) {
    if (variant === "page") {
      return (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${base} ${size} bg-signal-danger text-surface-paper hover:bg-signal-danger/90`}
        >
          Delete property
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${base} ${size} bg-transparent text-ink-soft hover:bg-surface-sunk hover:text-signal-danger`}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={runDelete}
        disabled={pending}
        className={`${base} ${size} bg-signal-danger text-surface-paper hover:bg-signal-danger/90`}
      >
        {pending ? "Deleting…" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className={`${base} ${size} bg-transparent text-ink-soft hover:bg-surface-sunk hover:text-ink`}
      >
        Cancel
      </button>
    </div>
  );
}
