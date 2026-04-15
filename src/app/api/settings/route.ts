import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invalidateProfileCache } from "@/lib/profile";

async function getOrCreateSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getOrCreateSettings();
    const { anthropicKey: _ak, freelancerToken, ...safeSettings } = settings;
    return NextResponse.json({
      ...safeSettings,
      // anthropicKeySet reflects only the server env var — client key lives in localStorage
      anthropicKeySet: !!process.env.ANTHROPIC_API_KEY?.trim(),
      freelancerTokenSet: !!freelancerToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const BOOLEAN_FIELDS = new Set([
  "activeWorkana", "activeFreelancer", "active99Freelas", "activeIndeed",
  "activeSoyFreelancer", "activeUpwork", "activeRemoteOK", "activeWeWorkRemotely",
  "activeRemotive", "activeTrampos", "activeTorre", "activeGetOnBoard",
  "activeProgramathor", "activeGuru",
]);

const NUMBER_FIELDS = new Set([
  "intervalRSS", "intervalAPI", "intervalScraping", "followUpDays", "scoreAlertThreshold",
]);

const STRING_FIELDS = new Set([
  "anthropicKey", "freelancerToken", "profileSkills", "profileTitles", "excludeKeywords",
]);

function validateField(key: string, value: unknown): string | null {
  if (BOOLEAN_FIELDS.has(key)) {
    if (typeof value !== "boolean") return `${key} must be a boolean`;
  } else if (NUMBER_FIELDS.has(key)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return `${key} must be a non-negative number`;
    if (key === "scoreAlertThreshold" && (value < 0 || value > 100)) return "scoreAlertThreshold must be between 0 and 100";
    if (["intervalRSS", "intervalAPI", "intervalScraping"].includes(key) && value < 1) return `${key} must be at least 1`;
  } else if (STRING_FIELDS.has(key)) {
    if (value !== null && typeof value !== "string") return `${key} must be a string or null`;
    if (typeof value === "string" && value.length > 2000) return `${key} is too long`;
    if (key === "anthropicKey" && typeof value === "string" && value.length > 0 && !value.startsWith("sk-ant-")) {
      return "anthropicKey must start with sk-ant-";
    }
  }
  return null;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const allowed = [...BOOLEAN_FIELDS, ...NUMBER_FIELDS, ...STRING_FIELDS];
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const key of allowed) {
    if (key in (body as object)) {
      const value = (body as Record<string, unknown>)[key];
      const error = validateField(key, value);
      if (error) {
        errors.push(error);
      } else {
        data[key] = value;
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  try {
    await getOrCreateSettings();

    const updated = await prisma.settings.update({
      where: { id: 1 },
      data: data as Parameters<typeof prisma.settings.update>[0]["data"],
    });

    if ("profileSkills" in data || "profileTitles" in data || "excludeKeywords" in data) {
      invalidateProfileCache();
    }

    const { anthropicKey: _ak2, freelancerToken, ...safeUpdated } = updated;
    return NextResponse.json({
      ...safeUpdated,
      anthropicKeySet: !!process.env.ANTHROPIC_API_KEY?.trim(),
      freelancerTokenSet: !!freelancerToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
