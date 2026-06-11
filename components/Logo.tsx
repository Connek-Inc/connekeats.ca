// Logo de Connek Eats adaptado al tema: wordmark azul-marino en claro y blanco en
// oscuro. El intercambio se hace por CSS (clases .light/.dark que next-themes pone
// en <html>), NO por JS → sin parpadeo en SSR y sigue el toggle real del tema.
// Las reglas .brand-logo--light / --dark viven en app/globals.css.

export function Logo({ className = "h-7" }: { className?: string }) {
  const cls = `w-auto ${className}`;
  return (
    <span className="inline-flex shrink-0 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Connek Eats" className={`brand-logo brand-logo--light ${cls}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="Connek Eats" className={`brand-logo brand-logo--dark ${cls}`} />
    </span>
  );
}
