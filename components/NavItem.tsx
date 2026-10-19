import Link from "next/link";
import type { ReactNode } from "react";

interface NavItemProps {
  href: string;
  current?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function NavItem({ href, current, icon, children }: NavItemProps) {
  return (
    <Link href={href} className="bolt-nav-item" aria-current={current ? "page" : undefined}>
      {icon}
      {children}
    </Link>
  );
}

/** A group heading above a cluster of nav items, such as Fleet or Account. Not interactive. */
export function NavSectionLabel({ children }: { children: ReactNode }) {
  return <span className="bolt-nav-section-label px-[var(--space-200)]">{children}</span>;
}
