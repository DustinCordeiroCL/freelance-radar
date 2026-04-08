"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function AuthGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [secret, setSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data: { authRequired: boolean; authenticated: boolean }) => {
        setAuthState(data.authenticated ? "authenticated" : "unauthenticated");
      })
      .catch(() => setAuthState("authenticated")); // Fail open for local dev
  }, []);

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (res.ok) {
        setAuthState("authenticated");
      } else {
        toast.error("Invalid secret — try again");
        setSecret("");
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authState === "loading") {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 rounded-full bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-semibold">FreelanceRadar</h1>
            <p className="text-sm text-muted-foreground text-center">Enter the access secret to continue</p>
          </div>
          <form onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="secret" className="text-sm">Access Secret</Label>
              <Input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !secret} className="w-full">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Unlock"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
