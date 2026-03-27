/**
 * Sequential scoring queue — processes one project at a time to avoid
 * concurrent Claude API calls that spike memory and hit rate limits.
 */

import { scoreProject } from "./scorer";

const queue: string[] = [];
let isProcessing = false;

export function enqueueScore(projectId: string): void {
  if (!queue.includes(projectId)) {
    queue.push(projectId);
  }
  if (!isProcessing) {
    void processQueue();
  }
}

export function queueSize(): number {
  return queue.length;
}

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 1000;

async function processQueue(): Promise<void> {
  isProcessing = true;
  while (queue.length > 0) {
    const batch = queue.splice(0, BATCH_SIZE);
    await Promise.all(
      batch.map((id) => scoreProject(id).catch(() => { /* scoreProject handles its own errors */ }))
    );
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  isProcessing = false;
}
