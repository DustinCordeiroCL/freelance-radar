export async function register(): Promise<void> {
  // Only run on the Node.js server runtime (not in the Edge runtime or browser)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./src/lib/scheduler");
    await startScheduler();
  }
}
