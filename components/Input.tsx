import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  /** Shown below the field in text 200 at 12px; hidden while an error shows. */
  hint?: ReactNode;
  /** States the fix plainly, for example "Enter a full number, at least 9 digits." */
  error?: ReactNode;
}

export function Input({ label, hint, error, id, className = "", ...props }: InputProps) {
  const input = (
    <input id={id} className={`bolt-input ${className}`} data-invalid={error ? "true" : undefined} {...props} />
  );

  const help = error ? (
    <span className="bolt-input-error">{error}</span>
  ) : hint ? (
    <span className="bolt-input-hint">{hint}</span>
  ) : null;

  if (!label && !help) return input;

  return (
    <label className="flex flex-col gap-[var(--space-100)]">
      {label ? <span className="bolt-label">{label}</span> : null}
      {input}
      {help}
    </label>
  );
}
