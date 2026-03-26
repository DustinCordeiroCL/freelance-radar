import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "./db";
import { runCollection } from "@/connectors";
import { sendNotification } from "./notifier";

let collectionTask: ScheduledTask | null = null;
let followUpTask: ScheduledTask | null = null;

function minutesToCron(minutes: number): string {
  if (minutes < 60) return `*/${minutes} * * * *`;
  const hours = Math.floor(minutes / 60);
  return `0 */${hours} * * *`;
}

async function runFollowUpCheck(): Promise<void> {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.followUpDays);

    const staleProjects = await prisma.project.findMany({
      where: {
        proposalStatus: { in: ["em_negociacao", "em_desenvolvimento"] },
        statusUpdatedAt: { lt: cutoff },
        isDiscarded: false,
      },
      select: { id: true, title: true, platform: true },
    });

    for (const project of staleProjects) {
      const alreadyNotified = await prisma.notificationLog.findUnique({
        where: { projectId: project.id },
      });

      if (alreadyNotified) continue;

      sendNotification(
        "FreelanceRadar — Follow-up needed",
        `${project.title} (${project.platform}) has had no update in ${settings.followUpDays}+ days`
      );

      await prisma.notificationLog.upsert({
        where: { projectId: project.id },
        update: { sentAt: new Date() },
        create: { projectId: project.id },
      });

      console.log(`[follow-up] Notification sent for project ${project.id}`);
    }
  } catch (err) {
    console.error("[follow-up] Check failed:", err);
  }
}

export async function startScheduler(): Promise<void> {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Stop existing tasks before re-scheduling
  collectionTask?.stop();
  followUpTask?.stop();

  // --- Collection cron ---
  // Connectors run on different intervals based on their type.
  // We schedule on the shortest interval and check per-connector timing inside runCollection.
  const rssInterval = Math.max(1, settings.intervalRSS);
  const collectionCron = minutesToCron(rssInterval);

  collectionTask = cron.schedule(collectionCron, () => {
    console.log("[scheduler] Running scheduled collection...");
    void runCollection();
  });

  console.log(`[scheduler] Collection cron started: every ${rssInterval} min`);

  // --- Follow-up cron (runs once a day at 09:00) ---
  followUpTask = cron.schedule("0 9 * * *", () => {
    console.log("[scheduler] Running follow-up check...");
    void runFollowUpCheck();
  });

  console.log("[scheduler] Follow-up cron started: daily at 09:00");
}

export function stopScheduler(): void {
  collectionTask?.stop();
  followUpTask?.stop();
  collectionTask = null;
  followUpTask = null;
}
