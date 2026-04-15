/**
 * Sequential scoring queue — processes one batch at a time to avoid
 * concurrent Claude API calls that spike memory and hit rate limits.
 * The API key is passed per-item and never stored globally.
 */

import { scoreProject } from "./scorer";

interface QueueItem {
  projectId: string;
  apiKey: string;
}

const queue: QueueItem[] = [];
let isProcessing = false;

export function enqueueScore(projectId: string, apiKey: string): void {
  if (!apiKey.trim()) return; // sem chave — não enfileira
  if (!queue.some((item) => item.projectId === projectId)) {
    queue.push({ projectId, apiKey });
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
      batch.map(({ projectId, apiKey }) =>
        scoreProject(projectId, apiKey).catch(() => { /* scoreProject handles its own errors */ })
      )
    );
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  isProcessing = false;
}
