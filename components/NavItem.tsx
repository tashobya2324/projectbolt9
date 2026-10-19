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
