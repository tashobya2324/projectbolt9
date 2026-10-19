import { NavItem } from "@/components/NavItem";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[220px] flex-shrink-0 flex-col gap-[var(--space-300)] border-r border-[var(--border-000)] bg-[var(--bg-100)] p-[var(--space-300)]">
        <h1 className="px-[var(--space-200)] text-[20px] font-semibold">Bolt</h1>
        <nav className="flex flex-col gap-[var(--space-000)]">
          <NavItem href="/dashboard">Fleet overview</NavItem>
        </nav>
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-[var(--space-500)]">{children}</main>
    </div>
  );
}
