import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const platform = searchParams.get("platform");
  const minScore = searchParams.get("minScore");
  const isFavorite = searchParams.get("isFavorite");
  const isDiscarded = searchParams.get("isDiscarded");
  const proposalStatus = searchParams.get("proposalStatus");
  const search = searchParams.get("search");

  try {
    const projects = await prisma.project.findMany({
      where: {
        ...(platform ? { platform } : {}),
        ...(minScore ? { matchScore: { gte: parseInt(minScore, 10) } } : {}),
        ...(isFavorite !== null ? { isFavorite: isFavorite === "true" } : {}),
        ...(isDiscarded !== null ? { isDiscarded: isDiscarded === "true" } : { isDiscarded: false }),
        ...(proposalStatus === "none"
          ? { proposalStatus: null }
          : proposalStatus
            ? { proposalStatus }
            : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ matchScore: "desc" }, { collectedAt: "desc" }],
    });

    return NextResponse.json(projects);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
