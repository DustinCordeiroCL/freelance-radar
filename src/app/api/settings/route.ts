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
    return NextResponse.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = [
    "intervalRSS",
    "intervalAPI",
    "intervalScraping",
    "activeWorkana",
    "activeFreelancer",
    "active99Freelas",
    "activeIndeed",
    "followUpDays",
    "anthropicKey",
    "freelancerToken",
    "profileSkills",
    "profileTitles",
    "excludeKeywords",
    "activeSoyFreelancer",
    "activeUpwork",
    "activeRemoteOK",
    "activeWeWorkRemotely",
    "activeRemotive",
    "activeTrampos",
    "activeTorre",
    "activeGetOnBoard",
    "activeProgramathor",
    "activeGuru",
    "scoreAlertThreshold",
  ] as const;

  type AllowedKey = (typeof allowed)[number];

  const data: Partial<Record<AllowedKey, unknown>> = {};
  for (const key of allowed) {
    if (body !== null && typeof body === "object" && key in (body as object)) {
      data[key] = (body as Record<string, unknown>)[key];
    }
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

    // Invalidate profile cache if skills or titles changed
    if ("profileSkills" in data || "profileTitles" in data || "excludeKeywords" in data) {
      invalidateProfileCache();
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
