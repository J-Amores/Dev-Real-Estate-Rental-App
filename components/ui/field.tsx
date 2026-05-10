import * as React from "react";

import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export interface FieldProps {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactElement<ControlProps>;
}

export function Field({ name, label, error, hint, children }: FieldProps) {
  const id = name;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-caption text-signal-danger">
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="mt-[2px] size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
