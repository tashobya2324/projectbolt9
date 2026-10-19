import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Primary: the one action a screen wants taken, once per view.
   * Secondary: a supporting action placed beside a primary one.
   * Ghost: a low emphasis action like Cancel or Dismiss.
   * Destructive: ends a session, revokes access, or removes a device;
   * never more than once in a dialog.
   */
  variant?: "primary" | "secondary" | "ghost" | "destructive";
}

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bolt-btn-primary",
  secondary: "bolt-btn-secondary",
  ghost: "bolt-btn-ghost",
  destructive: "bolt-btn-destructive"
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`bolt-btn ${variantClass[variant]} ${className}`} {...props} />;
}
