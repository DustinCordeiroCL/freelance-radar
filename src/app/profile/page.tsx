"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Save, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ParsedSuggestions {
  titles: string[];
  skills: string[];
}

interface SavedProfile {
  profileSkills: string | null;
  profileTitles: string | null;
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
        {items.map((item) => (
          <label
            key={item}
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
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<ParsedSuggestions | null>(null);
  const [checkedTitles, setCheckedTitles] = useState<Set<string>>(new Set());
  const [checkedSkills, setCheckedSkills] = useState<Set<string>>(new Set());
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSavedProfile(data as SavedProfile))
      .catch(() => toast.error("Failed to load profile"));
  }, []);

  function toggleItem(set: Set<string>, item: string): Set<string> {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  }

  async function processFile(file: File): Promise<void> {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setSuggestions(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/parse", { method: "POST", body: formData });
      const data = (await res.json()) as { titles?: string[]; skills?: string[]; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Failed to parse resume");

      const parsed: ParsedSuggestions = {
        titles: data.titles ?? [],
        skills: data.skills ?? [],
      };

      setSuggestions(parsed);
      setCheckedTitles(new Set(parsed.titles));
      setCheckedSkills(new Set(parsed.skills));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse resume");
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
      setSavedProfile({
        profileSkills: JSON.stringify([...checkedSkills]),
        profileTitles: JSON.stringify([...checkedTitles]),
      });
      toast.success("Profile saved — AI scoring and proposals updated");
    } catch {
      toast.error("Failed to save profile");
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
      setSavedProfile({
        profileTitles: JSON.stringify(nextTitles),
        profileSkills: JSON.stringify(nextSkills),
      });
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
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
      setSavedProfile({ profileSkills: null, profileTitles: null });
      setSuggestions(null);
      setFileName(null);
      toast.success("Profile cleared — using default curriculum");
    } catch {
      toast.error("Failed to clear profile");
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
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="text-xs text-muted-foreground">
            Upload your resume to improve AI match scoring and proposal generation
          </p>
        </div>
        {suggestions && (
          <Button size="sm" onClick={() => void saveProfile()} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save profile
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-2xl">

        {/* Current saved profile */}
        {hasProfile && !suggestions && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Current profile</h2>
              <button
                onClick={() => void clearProfile()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-3" /> Clear all
              </button>
            </div>
            {savedTitles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Job titles</p>
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

        {/* Upload area */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{hasProfile ? "Update resume" : "Upload resume"}</h2>

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
                <p className="text-sm text-muted-foreground">Reading resume with AI…</p>
              </>
            ) : fileName && suggestions ? (
              <>
                <FileText className="size-8 text-primary" />
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">Click to upload a different file</p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drop your resume here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse — PDF only, max 5MB</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Suggestions after parse */}
        {suggestions && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select what applies to you — uncheck anything that doesn&apos;t fit
              </p>
            </div>

            {suggestions.titles.length > 0 && (
              <CheckboxGroup
                label="Job titles"
                items={suggestions.titles}
                checked={checkedTitles}
                onToggle={(item) => setCheckedTitles((prev) => toggleItem(prev, item))}
              />
            )}

            {suggestions.skills.length > 0 && (
              <CheckboxGroup
                label="Skills"
                items={suggestions.skills}
                checked={checkedSkills}
                onToggle={(item) => setCheckedSkills((prev) => toggleItem(prev, item))}
              />
            )}

            <Button onClick={() => void saveProfile()} disabled={isSaving} className="w-fit gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save profile
            </Button>
          </section>
        )}

      </div>
    </div>
  );
}
