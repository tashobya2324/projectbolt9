import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  const input = <input id={id} className={`bolt-input ${className}`} {...props} />;

  if (!label) return input;

  return (
    <label className="flex flex-col gap-[var(--space-100)]">
      <span className="bolt-label">{label}</span>
      {input}
    </label>
  );
}
