"use client";

import { useState } from "react";
import { Button } from "./Button";

interface UnlockControlProps {
  deviceId: string;
}

/**
 * UC-2 in two actions: press the button, read the code. The fleet manager
 * never types anything to issue one.
 */
export function UnlockControl({ deviceId }: UnlockControlProps) {
  const [state, setState] = useState<"idle" | "loading" | "issued" | "error">("idle");
  const [code, setCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function issueCode() {
    setState("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });

      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.error ?? "Could not issue a code.");
        setState("error");
        return;
      }

      setCode(body.code);
      setState("issued");
    } catch {
      setErrorMessage("Could not reach the server.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-200)]">
      <Button onClick={issueCode} disabled={state === "loading"}>
        {state === "loading" ? "Issuing code" : "Issue unlock code"}
      </Button>
      {code ? (
        <p className="bolt-stat-figure text-[20px]">{code}</p>
      ) : null}
      {errorMessage ? <p className="text-[14px] text-[var(--status-300)]">{errorMessage}</p> : null}
    </div>
  );
}
