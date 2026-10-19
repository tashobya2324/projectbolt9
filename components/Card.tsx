import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Raised steps the background and shadow up for a modal body or a popover. */
  surface?: "resting" | "raised";
}

export function Card({ surface = "resting", className = "", ...props }: CardProps) {
  return (
    <div
      className={`bolt-card ${className}`}
      data-surface={surface === "raised" ? "raised" : undefined}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: string;
  meta?: ReactNode;
}

/** Title on the left, an optional monospace meta value (an id, a count) on the right. */
export function CardHeader({ title, meta }: CardHeaderProps) {
  return (
    <div className="bolt-card-header">
      <span className="bolt-card-title">{title}</span>
      {meta ? <span className="bolt-card-meta">{meta}</span> : null}
    </div>
  );
}
