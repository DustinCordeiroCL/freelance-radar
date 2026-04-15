"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Save, X, FileText } from "lucide-react";
import Link from "next/link";
import { getStoredKey } from "@/lib/clientKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ParsedSuggestions {
  titles: string[];
  skills: string[];
}

interface SavedProfile {
  profileSkills: string | null;
  profileTitles: string | null;
  excludeKeywords: string | null;
  anthropicKeySet: boolean;
}

function CheckboxGroup({
  label,
  items,
  checked,
  onToggle,
}: {
  label: string;
  items: string[];
  checked: Set<string>;
  onToggle: (item: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <label
            key={`${item}-${i}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer transition-colors select-none ${
              checked.has(item)
                ? "bg-primary/10 border-primary text-primary"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked.has(item)}
              onChange={() => onToggle(item)}
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage(): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<ParsedSuggestions | null>(null);
  const [checkedTitles, setCheckedTitles] = useState<Set<string>>(new Set());
  const [checkedSkills, setCheckedSkills] = useState<Set<string>>(new Set());
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [excludeInput, setExcludeInput] = useState("");
  const excludeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasApiKey(!!getStoredKey());
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSavedProfile(data as SavedProfile))
      .catch(() => toast.error("Error al cargar el perfil"));
  }, []);

  function toggleItem(set: Set<string>, item: string): Set<string> {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  }

  function getExcludeKeywords(): string[] {
    return savedProfile?.excludeKeywords
      ? (JSON.parse(savedProfile.excludeKeywords) as string[])
      : [];
  }

  async function addExcludeKeyword(): Promise<void> {
    const kw = excludeInput.trim();
    if (!kw) return;
    const current = getExcludeKeywords();
    if (current.includes(kw)) return;
    const updated = [...current, kw];
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeKeywords: JSON.stringify(updated) }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedProfile((prev) => prev ? { ...prev, excludeKeywords: JSON.stringify(updated) } : prev);
      setExcludeInput("");
      excludeInputRef.current?.focus();
    } catch {
      toast.error("Error al guardar la palabra clave");
    }
  }

  async function removeExcludeKeyword(kw: string): Promise<void> {
    const updated = getExcludeKeywords().filter((k) => k !== kw);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeKeywords: updated.length > 0 ? JSON.stringify(updated) : null }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedProfile((prev) => prev ? { ...prev, excludeKeywords: updated.length > 0 ? JSON.stringify(updated) : null } : prev);
    } catch {
      toast.error("Error al eliminar la palabra clave");
    }
  }

  async function processFile(file: File): Promise<void> {
    if (file.type !== "application/pdf") {
      toast.error("Solo se admiten archivos PDF");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setSuggestions(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/parse", {
        method: "POST",
        headers: { "x-anthropic-key": getStoredKey() },
        body: formData,
      });
      const data = (await res.json()) as { titles?: string[]; skills?: string[]; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Error al procesar el currículum");

      const parsed: ParsedSuggestions = {
        titles: [...new Set(data.titles ?? [])],
        skills: [...new Set(data.skills ?? [])],
      };

      setSuggestions(parsed);
      setCheckedTitles(new Set(parsed.titles));
      setCheckedSkills(new Set(parsed.skills));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el currículum");
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  async function saveProfile(): Promise<void> {
    if (!suggestions) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSkills: JSON.stringify([...checkedSkills]),
          profileTitles: JSON.stringify([...checkedTitles]),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedProfile((prev) => ({
        excludeKeywords: prev?.excludeKeywords ?? null,
        profileSkills: JSON.stringify([...checkedSkills]),
        profileTitles: JSON.stringify([...checkedTitles]),
        anthropicKeySet: prev?.anthropicKeySet ?? false,
      }));
      toast.success("Perfil guardado — el scoring y las propuestas con IA han sido actualizados");
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeItem(type: "title" | "skill", item: string): Promise<void> {
    const nextTitles = type === "title" ? savedTitles.filter((t) => t !== item) : savedTitles;
    const nextSkills = type === "skill" ? savedSkills.filter((s) => s !== item) : savedSkills;
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileTitles: JSON.stringify(nextTitles),
          profileSkills: JSON.stringify(nextSkills),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedProfile((prev) => ({
        excludeKeywords: prev?.excludeKeywords ?? null,
        profileTitles: JSON.stringify(nextTitles),
        profileSkills: JSON.stringify(nextSkills),
        anthropicKeySet: prev?.anthropicKeySet ?? false,
      }));
      toast.success("Elemento eliminado");
    } catch {
      toast.error("Error al eliminar el elemento");
    }
  }

  async function clearProfile(): Promise<void> {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSkills: null, profileTitles: null }),
      });
      if (!res.ok) throw new Error("Clear failed");
      setSavedProfile((prev) => ({ ...prev, profileSkills: null, profileTitles: null, excludeKeywords: null, anthropicKeySet: prev?.anthropicKeySet ?? false }));
      setSuggestions(null);
      setFileName(null);
      toast.success("Perfil eliminado — usando currículum por defecto");
    } catch {
      toast.error("Error al limpiar el perfil");
    }
  }

  const savedSkills: string[] = savedProfile?.profileSkills
    ? (JSON.parse(savedProfile.profileSkills) as string[])
    : [];
  const savedTitles: string[] = savedProfile?.profileTitles
    ? (JSON.parse(savedProfile.profileTitles) as string[])
    : [];
  const hasProfile = savedSkills.length > 0 || savedTitles.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-semibold">Perfil</h1>
          <p className="text-xs text-muted-foreground">
            Sube tu currículum para mejorar el scoring de compatibilidad y la generación de propuestas con IA
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-2xl p-6 space-y-8">

        {/* Suggestions after parse — shown first so layout is stable */}
        {suggestions && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Selecciona lo que corresponda — desmarca lo que no encaje
              </p>
              <button
                onClick={() => { setSuggestions(null); setFileName(null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>

            {suggestions.titles.length > 0 && (
              <CheckboxGroup
                label="Títulos de trabajo"
                items={suggestions.titles}
                checked={checkedTitles}
                onToggle={(item) => setCheckedTitles((prev) => toggleItem(prev, item))}
              />
            )}

            {suggestions.skills.length > 0 && (
              <CheckboxGroup
                label="Habilidades"
                items={suggestions.skills}
                checked={checkedSkills}
                onToggle={(item) => setCheckedSkills((prev) => toggleItem(prev, item))}
              />
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => void saveProfile()} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar perfil
              </Button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                {fileName ?? "Usar otro archivo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
          </section>
        )}

        {/* Current saved profile */}
        {hasProfile && !suggestions && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Perfil actual</h2>
              <button
                onClick={() => void clearProfile()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-3" /> Limpiar todo
              </button>
            </div>
            {savedTitles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Títulos de trabajo</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedTitles.map((t) => (
                    <button
                      key={t}
                      onClick={() => void removeItem("title", t)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary text-primary text-xs hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors group"
                      title="Remove"
                    >
                      {t}
                      <X className="size-2.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {savedSkills.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedSkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => void removeItem("skill", s)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors group"
                      title="Remove"
                    >
                      {s}
                      <X className="size-2.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Separator />
          </section>
        )}

        {/* Keyword blacklist */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1">Lista negra de palabras clave</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Los proyectos que contengan alguna de estas palabras se descartan automáticamente durante la recopilación.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              ref={excludeInputRef}
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addExcludeKeyword(); } }}
              placeholder="ej. wordpress, php, diseño de logos"
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void addExcludeKeyword()}
              disabled={!excludeInput.trim()}
            >
              Agregar
            </Button>
          </div>
          {getExcludeKeywords().length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {getExcludeKeywords().map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20"
                >
                  {kw}
                  <button
                    onClick={() => void removeExcludeKeyword(kw)}
                    className="hover:text-destructive/70 transition-colors"
                    aria-label={`Remove ${kw}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin palabras excluidas</p>
          )}
          <Separator />
        </section>

        {/* Upload area — hidden when suggestions are active (link inside suggestions section) */}
        {!suggestions && <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{hasProfile ? "Actualizar currículum" : "Subir currículum"}</h2>

          {!hasApiKey ? (
            <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-10 opacity-50 select-none">
              <Upload className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Función de IA no disponible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configura una clave de API en{" "}
                  <Link href="/settings" className="underline hover:text-foreground transition-colors">
                    Configuración → Claves de API
                  </Link>{" "}
                  para analizar tu currículum con IA.
                </p>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />

              {isParsing ? (
                <>
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analizando currículum con IA…</p>
                </>
              ) : fileName && suggestions ? (
                <>
                  <FileText className="size-8 text-primary" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Haz clic para subir un archivo diferente</p>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Suelta tu currículum aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">o haz clic para buscar — solo PDF, máx. 5MB</p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>}

      </div>
      </div>
    </div>
  );
}
