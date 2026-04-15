"use client";

const STORAGE_KEY = "fr_anthropic_key";

export function getStoredKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function setStoredKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearStoredKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
