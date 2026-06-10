// Confetti del paso final. Import dinámico para no tocar `window` en SSR.

export async function celebrate(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    const fire = (ratio: number, opts: Record<string, unknown>) =>
      confetti({ origin: { y: 0.7 }, particleCount: Math.floor(220 * ratio), ...opts });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  } catch {
    // canvas-confetti es opcional: si falla, el flujo sigue sin festejo.
  }
}
