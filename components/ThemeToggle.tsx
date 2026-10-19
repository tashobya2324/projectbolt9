"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

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
    <Button type="button" variant="ghost" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
