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

async function processQueue(): Promise<void> {
  isProcessing = true;
  while (queue.length > 0) {
    const id = queue.shift()!;
    try {
      await scoreProject(id);
    } catch {
      // scoreProject already handles its own errors — swallow here
    }
    // Small pause between calls to respect rate limits
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  isProcessing = false;
}
