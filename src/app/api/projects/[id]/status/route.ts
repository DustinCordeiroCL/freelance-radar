import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["em_negociacao", "em_desenvolvimento", "concluida"];

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { proposalStatus, proposalValue } = body as {
    proposalStatus?: string | null;
    proposalValue?: number | null;
  };

  if (proposalStatus !== null && proposalStatus !== undefined && !VALID_STATUSES.includes(proposalStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")} or null` },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        proposalStatus: proposalStatus ?? null,
        ...(proposalValue !== undefined ? { proposalValue } : {}),
        statusUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      proposalStatus: updated.proposalStatus,
      proposalValue: updated.proposalValue,
      statusUpdatedAt: updated.statusUpdatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
