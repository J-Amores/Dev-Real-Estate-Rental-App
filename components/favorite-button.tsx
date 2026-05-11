"use client";

import { useState, useTransition } from "react";

import { toggleFavoriteAction } from "@/lib/actions";

type Variant = "card" | "detail";

type Props = {
  propertyId: number;
  initialFavorited: boolean;
  variant?: Variant;
};

const CARD_CLASSES =
  "inline-flex h-9 w-9 items-center justify-center rounded-full " +
  "bg-surface-paper/90 text-ink shadow-sm backdrop-blur " +
  "hover:bg-surface-paper " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "motion-reduce:transition-none";

const DETAIL_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-sm text-label font-medium tracking-[0.005em] " +
  "bg-surface-panel text-ink hover:bg-surface-sunk active:bg-surface-sunk px-4 py-[10px] " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "motion-reduce:transition-none";

export function FavoriteButton({
  propertyId,
  initialFavorited,
  variant = "card",
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(propertyId);
      if (!result.ok) {
        setFavorited(!next);
        return;
      }
      if (result.isFavorited !== next) {
        setFavorited(result.isFavorited);
      }
    });
  };

  const label = favorited ? "Remove from favorites" : "Save to favorites";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={favorited}
        aria-label={label}
        title={label}
        className={CARD_CLASSES}
      >
        <Heart filled={favorited} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={label}
      className={DETAIL_CLASSES}
    >
      <Heart filled={favorited} />
      <span>{favorited ? "Saved" : "Save"}</span>
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={filled ? "text-accent-evergreen" : "text-ink-soft"}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
