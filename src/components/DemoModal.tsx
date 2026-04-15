"use client";

import { useState } from "react";
import { X, Radar, Search, Star, FileText, Sparkles, KeyRound, Copy, Check } from "lucide-react";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-primary hover:text-primary/70 transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 rounded-t-2xl bg-primary">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Radar className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-primary-foreground text-lg font-bold tracking-tight">FreelanceRadar</h2>
          </div>
          <p className="text-primary-foreground/60 text-xs tracking-widest uppercase">Sistema de demostración</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Bienvenido/a. Este es un agregador inteligente de oportunidades freelance.
            Recopila proyectos de múltiples plataformas y los puntúa con IA según tu
            perfil profesional.
          </p>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Funcionalidades
          </p>

          <ul className="space-y-2.5 mb-5">
            {[
              { icon: Search,   text: "Recopilación automática desde Upwork, RemoteOK, Trampos, Torre y más" },
              { icon: Sparkles, text: "Scoring de compatibilidad con IA según tu perfil y currículum" },
              { icon: FileText, text: "Generación de propuestas personalizadas con IA" },
              { icon: Star,     text: "Panel de favoritos, seguimiento de estado y registro de ganancias" },
              { icon: Radar,    text: "Lista negra de palabras clave para filtrar proyectos irrelevantes" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80">{text}</span>
              </li>
            ))}
          </ul>

          {/* API Key info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Funciones de IA (opcional)
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed mb-2">
              El scoring y la generación de propuestas requieren una API key de Anthropic.
              Puedes ingresar la tuya en <strong>Configuración → Claves de API</strong> para
              activar estas funciones con tu propia cuenta.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sin API key, puedes explorar todos los proyectos, filtros, favoritos y el registro de ganancias sin costo alguno.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-widest mb-1.5">
              Contacto
            </p>
            <div className="font-mono text-xs bg-background rounded-md px-3 py-2 flex items-center gap-1 border border-border">
              <span className="text-muted-foreground select-none">E-mail:</span>
              <span className="font-semibold text-foreground">cordeiro.dustin00@gmail.com</span>
              <CopyButton value="cordeiro.dustin00@gmail.com" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-primary-foreground text-sm font-semibold bg-primary hover:bg-primary/90 transition-colors"
          >
            Explorar el sistema
          </button>
        </div>
      </div>
    </div>
  );
}

export function DemoModalTrigger() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <DemoModal onClose={() => setOpen(false)} />;
}
