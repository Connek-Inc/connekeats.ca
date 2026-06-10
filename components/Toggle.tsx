"use client";
// Toggle pill propio (evita depender de la composición de HeroUI Switch).
// Usado por el wizard de onboarding y el panel /owner.

export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? "bg-foreground" : "bg-foreground/20"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${
          on ? "left-[18px] bg-background" : "left-0.5 bg-foreground/70"
        }`}
      />
    </button>
  );
}
