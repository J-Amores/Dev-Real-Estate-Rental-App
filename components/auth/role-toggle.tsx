"use client";

import { useState } from "react";

type Role = "tenant" | "manager";

const OPTIONS: ReadonlyArray<{ value: Role; label: string; hint: string }> = [
  { value: "tenant", label: "Tenant", hint: "I'm looking for a place" },
  { value: "manager", label: "Host", hint: "I have a place to rent" },
];

type Props = {
  /** Initial value. Defaults to "tenant" to match Phase 2 form behavior. */
  defaultValue?: Role;
};

/**
 * Phase 11 spec §3 — inline segmented control above the username field on /signup.
 * Hidden input name="role" carries the selected value into FormData; signUpAction
 * (lib/actions.ts) accepts role as-is. Label "Host" maps to DB role "manager".
 */
export function RoleToggle({ defaultValue = "tenant" }: Props) {
  const [value, setValue] = useState<Role>(defaultValue);

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-label text-ink">I am a</legend>
      <input type="hidden" name="role" value={value} />
      <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-sm bg-surface-sunk p-1">
        {OPTIONS.map((o) => {
          const isActive = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setValue(o.value)}
              className={[
                "flex h-9 w-full items-center justify-center rounded-sm text-label transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper",
                isActive
                  ? "border border-hairline bg-surface-paper text-ink font-medium"
                  : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-ink-soft">{OPTIONS.find((o) => o.value === value)?.hint}</p>
    </fieldset>
  );
}
