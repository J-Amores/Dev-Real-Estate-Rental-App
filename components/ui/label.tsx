import * as React from "react";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...rest }, ref) {
    return (
      <label
        ref={ref}
        className={["block text-label text-ink", className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
