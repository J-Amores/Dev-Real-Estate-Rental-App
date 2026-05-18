"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function PropertyModal({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) el.showModal();

    const onCancel = (e: Event) => {
      e.preventDefault();
      router.back();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [router]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!cardRef.current) return;
    if (cardRef.current.contains(e.target as Node)) return;
    router.back();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={onBackdropClick}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/45"
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8">
        <div ref={cardRef} className="relative w-full max-w-[760px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-paper text-ink shadow-sm hover:bg-surface-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none">
              <path
                d="M4.5 4.5l7 7M11.5 4.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
