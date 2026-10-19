"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(searchParams.get("next") ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-000)] p-[var(--space-500)]">
      <form onSubmit={handleSubmit} className="bolt-card flex w-full max-w-sm flex-col gap-[var(--space-300)]">
        <h1 className="text-[28px] font-semibold">Bolt</h1>
        <p className="text-[14px] text-[var(--text-100)]">Sign in as a fleet manager to view the dashboard.</p>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error ? <p className="text-[14px] text-[var(--status-critical)]">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
