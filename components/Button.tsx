import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "bolt-btn-primary" : "bolt-btn-secondary";
  return <button className={`bolt-btn ${variantClass} ${className}`} {...props} />;
}
