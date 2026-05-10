import * as React from "react";

const BASE =
  "block w-full rounded-sm border border-hairline bg-surface-sunk px-3 py-[10px] text-body text-ink " +
  "placeholder:text-ink-faint " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus-visible:outline-none focus-visible:bg-surface-paper focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-0 " +
  "disabled:bg-surface-panel disabled:text-ink-faint disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-2 aria-[invalid=true]:border-signal-danger " +
  "resize-y min-h-[96px] " +
  "motion-reduce:transition-none";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={[BASE, className].filter(Boolean).join(" ")} {...rest} />;
});
