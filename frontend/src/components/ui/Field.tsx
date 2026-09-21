import { cloneElement, isValidElement, type ReactElement } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

// Applied on top of `inputClass` (or whatever className the input already
// has) so the field's border/ring turns red when it has a validation error.
export const invalidInputClass =
  "!border-red-400 focus:!border-red-500 focus:!ring-red-100";

export default function Field({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: FieldProps) {
  // Automatically mark the wrapped input as invalid (red border) whenever
  // this field has an error, so every caller gets red-field validation for
  // free just by passing `error` - no need to touch each input's className.
  const child = isValidElement(children)
    ? (children as ReactElement<{ className?: string; "aria-invalid"?: boolean }>)
    : null;

  const content = child
    ? cloneElement(child, {
        className: [child.props.className, error ? invalidInputClass : ""]
          .filter(Boolean)
          .join(" "),
        "aria-invalid": Boolean(error),
      })
    : children;

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      {content}

      {error?.trim() ? (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      ) : (
        !error && hint && (
          <span className="mt-1 block text-xs text-slate-400">{hint}</span>
        )
      )}
    </label>
  );
}
