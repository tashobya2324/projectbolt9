"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("bolt-theme", next);
    } catch {
      // Private browsing or blocked storage: the toggle still works for this session.
    }
  }

  return (
    <button type="button" onClick={toggle} className="bolt-btn bolt-btn-secondary" aria-label="Toggle theme">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
