"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InfoPopover } from "@/components/InfoPopover";
import { getStoredKey, setStoredKey, clearStoredKey } from "@/lib/clientKey";

interface Settings {
  id: number;
  intervalRSS: number;
  intervalAPI: number;
  intervalScraping: number;
  activeWorkana: boolean;
  activeFreelancer: boolean;
  active99Freelas: boolean;
  activeIndeed: boolean;
  activeSoyFreelancer: boolean;
  activeUpwork: boolean;
  activeRemoteOK: boolean;
  activeWeWorkRemotely: boolean;
  activeRemotive: boolean;
  activeTrampos: boolean;
  activeTorre: boolean;
  activeGetOnBoard: boolean;
  activeProgramathor: boolean;
  activeGuru: boolean;
  followUpDays: number;
  scoreAlertThreshold: number;
  anthropicKeySet: boolean;
  freelancerTokenSet: boolean;
  profileSkills: string | null;
  profileTitles: string | null;
}

const CONNECTOR_INFO = [
  { key: "activeWorkana", label: "Workana", type: "Scraping (PT + ES)" },
  { key: "active99Freelas", label: "99Freelas", type: "Scraping" },
  { key: "activeFreelancer", label: "Freelancer.com", type: "API" },
  { key: "activeIndeed", label: "Indeed Chile", type: "Scraping" },
  { key: "activeSoyFreelancer", label: "SoyFreelancer", type: "Scraping (CL)" },
  { key: "activeUpwork", label: "Upwork", type: "Feed RSS" },
  { key: "activeRemoteOK", label: "RemoteOK", type: "API JSON pública" },
  { key: "activeWeWorkRemotely", label: "We Work Remotely", type: "Feed RSS" },
  { key: "activeRemotive", label: "Remotive", type: "Feed RSS" },
  { key: "activeTrampos", label: "Trampos.co", type: "API JSON (BR)" },
  { key: "activeTorre", label: "Torre.co", type: "API JSON (Latam)" },
  { key: "activeGetOnBoard", label: "GetOnBoard", type: "Scraping (CL/Latam)" },
  { key: "activeProgramathor", label: "Programathor", type: "Scraping (BR)" },
  { key: "activeGuru", label: "Guru.com", type: "Feed RSS" },
] as const;

function ApiKeyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): React.ReactElement {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm pr-9 font-mono"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide key" : "Show key"}
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

export default function SettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [freelancerToken, setFreelancerToken] = useState("");

  useEffect(() => {
    // Load anthropic key from localStorage (never from DB)
    const stored = getStoredKey();
    if (stored) setAnthropicKey(stored);

    void fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        const s = data as Settings;
        setSettings(s);
        setFreelancerToken("");
      })
      .catch(() => toast.error("Error al cargar la configuración"));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(): Promise<void> {
    if (!settings) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        intervalRSS: settings.intervalRSS,
        intervalAPI: settings.intervalAPI,
        intervalScraping: settings.intervalScraping,
        activeWorkana: settings.activeWorkana,
        activeFreelancer: settings.activeFreelancer,
        active99Freelas: settings.active99Freelas,
        activeIndeed: settings.activeIndeed,
        activeSoyFreelancer: settings.activeSoyFreelancer,
        activeUpwork: settings.activeUpwork,
        activeRemoteOK: settings.activeRemoteOK,
        activeWeWorkRemotely: settings.activeWeWorkRemotely,
        activeRemotive: settings.activeRemotive,
        activeTrampos: settings.activeTrampos,
        activeTorre: settings.activeTorre,
        activeGetOnBoard: settings.activeGetOnBoard,
        activeProgramathor: settings.activeProgramathor,
        activeGuru: settings.activeGuru,
        followUpDays: settings.followUpDays,
        scoreAlertThreshold: settings.scoreAlertThreshold,
      };
      if (freelancerToken) payload.freelancerToken = freelancerToken;

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");

      // Anthropic key: save/clear in localStorage only (never sent to DB)
      if (anthropicKey.trim()) {
        setStoredKey(anthropicKey);
        setSettings((prev) => prev ? { ...prev, anthropicKeySet: true } : prev);
      } else {
        clearStoredKey();
        setSettings((prev) => prev ? { ...prev, anthropicKeySet: false } : prev);
      }

      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin mr-2" /> Cargando configuración...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Configuración</h1>
        <Button size="sm" onClick={() => void save()} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl p-6 space-y-8">

        {/* API Keys */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Claves de API</h2>
          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Anthropic API Key</Label>
                <InfoPopover>
                  <p className="font-medium text-foreground mb-1">¿Qué es esto?</p>
                  <p className="mb-2">Requerida para el scoring de compatibilidad y generación de propuestas con IA.</p>
                  <p className="font-medium text-foreground mb-1">Cómo obtenerla</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Ve a <span className="font-mono text-xs bg-muted px-1 rounded">console.anthropic.com</span></li>
                    <li>Navega a <strong>API Keys</strong></li>
                    <li>Haz clic en <strong>Create key</strong> y cópiala</li>
                  </ol>
                </InfoPopover>
              </div>
              <ApiKeyInput
                value={anthropicKey}
                onChange={setAnthropicKey}
                placeholder="sk-ant-..."
              />
              {!anthropicKey && (
                <p className="text-xs text-amber-500">Clave no configurada — el scoring y las propuestas con IA están desactivados</p>
              )}
              {anthropicKey && (
                <p className="text-xs text-emerald-500">Clave guardada localmente en este navegador — no se envía al servidor</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Freelancer.com API Token</Label>
                <InfoPopover>
                  <p className="font-medium text-foreground mb-1">¿Qué es esto?</p>
                  <p className="mb-2">Requerido para el conector de Freelancer.com. Sin él, esa plataforma se omite.</p>
                  <p className="font-medium text-foreground mb-1">Cómo obtenerlo</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Ve a <span className="font-mono text-xs bg-muted px-1 rounded">freelancer.com/api</span></li>
                    <li>Registra una aplicación</li>
                    <li>Copia el <strong>OAuth token</strong></li>
                  </ol>
                </InfoPopover>
              </div>
              <ApiKeyInput
                value={freelancerToken}
                onChange={setFreelancerToken}
                placeholder={settings.freelancerTokenSet ? "Dejar vacío para mantener el token actual" : "Pega tu token aquí"}
              />
              {!settings.freelancerTokenSet && !freelancerToken && (
                <p className="text-xs text-muted-foreground">Opcional — el conector de Freelancer.com se omitirá si no está configurado</p>
              )}
              {settings.freelancerTokenSet && !freelancerToken && (
                <p className="text-xs text-emerald-500">Token configurado — dejar vacío para mantenerlo</p>
              )}
            </div>

          </div>
        </section>

        <Separator />

        {/* Collection intervals */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Intervalos de recopilación</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Intervalo RSS / Scraping</Label>
                <p className="text-xs text-muted-foreground">Workana, 99Freelas, Indeed</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5}
                  value={settings.intervalRSS}
                  onChange={(e) => update("intervalRSS", parseInt(e.target.value, 10) || 30)}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Intervalo API</Label>
                <p className="text-xs text-muted-foreground">Freelancer.com</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5}
                  value={settings.intervalAPI}
                  onChange={(e) => update("intervalAPI", parseInt(e.target.value, 10) || 30)}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Intervalo Scraping (lento)</Label>
                <p className="text-xs text-muted-foreground">Indeed Chile (protección anti-bot)</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={60}
                  value={settings.intervalScraping}
                  onChange={(e) => update("intervalScraping", parseInt(e.target.value, 10) || 180)}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Active connectors */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Conectores activos</h2>
          <div className="flex flex-col gap-3">
            {CONNECTOR_INFO.map(({ key, label, type }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{type}</p>
                </div>
                <button
                  onClick={() => update(key, !settings[key])}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    settings[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Follow-up */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Notificaciones de seguimiento</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Días sin actualización de estado</Label>
              <p className="text-xs text-muted-foreground">
                Envía una notificación cuando un proyecto en negociación o desarrollo no tiene actualizaciones
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={settings.followUpDays}
                onChange={(e) => update("followUpDays", parseInt(e.target.value, 10) || 3)}
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">días</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Umbral de alerta por score</Label>
              <p className="text-xs text-muted-foreground">
                Envía una notificación cuando un proyecto nuevo obtiene este score o más
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.scoreAlertThreshold}
                onChange={(e) => update("scoreAlertThreshold", parseInt(e.target.value, 10) || 70)}
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
        </section>


        </div>
      </div>
    </div>
  );
}
