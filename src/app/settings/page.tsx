"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InfoPopover } from "@/components/InfoPopover";

interface Settings {
  id: number;
  intervalRSS: number;
  intervalAPI: number;
  intervalScraping: number;
  activeWorkana: boolean;
  activeFreelancer: boolean;
  active99Freelas: boolean;
  activeIndeed: boolean;
  followUpDays: number;
  anthropicKey: string | null;
  freelancerToken: string | null;
}

const CONNECTOR_INFO = [
  { key: "activeWorkana", label: "Workana", type: "Scraping (PT + ES)" },
  { key: "active99Freelas", label: "99Freelas", type: "Scraping" },
  { key: "activeFreelancer", label: "Freelancer.com", type: "API" },
  { key: "activeIndeed", label: "Indeed Chile", type: "Scraping" },
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
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data as Settings;
        setSettings(s);
        setAnthropicKey(s.anthropicKey ?? "");
        setFreelancerToken(s.freelancerToken ?? "");
      })
      .catch(() => toast.error("Failed to load settings"));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(): Promise<void> {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervalRSS: settings.intervalRSS,
          intervalAPI: settings.intervalAPI,
          intervalScraping: settings.intervalScraping,
          activeWorkana: settings.activeWorkana,
          activeFreelancer: settings.activeFreelancer,
          active99Freelas: settings.active99Freelas,
          activeIndeed: settings.activeIndeed,
          followUpDays: settings.followUpDays,
          anthropicKey: anthropicKey || null,
          freelancerToken: freelancerToken || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Settings</h1>
        <Button size="sm" onClick={() => void save()} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-2xl">

        {/* API Keys */}
        <section>
          <h2 className="text-sm font-semibold mb-4">API Keys</h2>
          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Anthropic API Key</Label>
                <InfoPopover>
                  <p className="font-medium text-foreground mb-1">What is this?</p>
                  <p className="mb-2">Required for AI match scoring and proposal generation.</p>
                  <p className="font-medium text-foreground mb-1">How to get it</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <span className="font-mono text-xs bg-muted px-1 rounded">console.anthropic.com</span></li>
                    <li>Navigate to <strong>API Keys</strong></li>
                    <li>Click <strong>Create key</strong> and copy it</li>
                  </ol>
                </InfoPopover>
              </div>
              <ApiKeyInput
                value={anthropicKey}
                onChange={setAnthropicKey}
                placeholder="sk-ant-..."
              />
              {!anthropicKey && (
                <p className="text-xs text-amber-500">Key not configured — AI scoring and proposals are disabled</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Freelancer.com API Token</Label>
                <InfoPopover>
                  <p className="font-medium text-foreground mb-1">What is this?</p>
                  <p className="mb-2">Required for the Freelancer.com connector. Without it, that platform is skipped.</p>
                  <p className="font-medium text-foreground mb-1">How to get it</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <span className="font-mono text-xs bg-muted px-1 rounded">freelancer.com/api</span></li>
                    <li>Register an application</li>
                    <li>Copy the <strong>OAuth token</strong></li>
                  </ol>
                </InfoPopover>
              </div>
              <ApiKeyInput
                value={freelancerToken}
                onChange={setFreelancerToken}
                placeholder="Paste your token here"
              />
              {!freelancerToken && (
                <p className="text-xs text-muted-foreground">Optional — Freelancer.com connector will be skipped if not set</p>
              )}
            </div>

          </div>
        </section>

        <Separator />

        {/* Collection intervals */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Collection intervals</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">RSS / Scraping interval</Label>
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
                <Label className="text-sm">API interval</Label>
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
                <Label className="text-sm">Scraping interval (slow)</Label>
                <p className="text-xs text-muted-foreground">Indeed Chile (anti-bot protection)</p>
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
          <h2 className="text-sm font-semibold mb-4">Active connectors</h2>
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
          <h2 className="text-sm font-semibold mb-4">Follow-up notifications</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Days without status update</Label>
              <p className="text-xs text-muted-foreground">
                Sends a desktop notification when a project in negotiation or development has no update
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
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
