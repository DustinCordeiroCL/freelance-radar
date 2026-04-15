"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Senha incorreta");
      }
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">FreelanceRadar</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="h-10"
          />
          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
          <Button type="submit" disabled={isLoading || !password.trim()} className="w-full">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
