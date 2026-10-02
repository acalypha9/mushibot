export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return;
    }
    try {
      const { initWhatsAppOnStartup } = await import("./lib/whatsapp/startup");
      await initWhatsAppOnStartup();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[WhatsApp Startup] Failed during server registration:", message);
    }
  }
}
