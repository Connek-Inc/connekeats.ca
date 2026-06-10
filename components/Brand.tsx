// Marca visible (logo + nombre). Si el negocio tiene logo_url, lo muestra;
// si no, cae al icono genérico + el nombre (o "Connek").
import { UtensilsCrossed } from "lucide-react";

export function Brand({
  logoUrl,
  name,
  size = 32,
}: {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background"
        style={{ width: size, height: size }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="size-1/2" />
        )}
      </div>
      <span className="truncate text-[15px] font-bold tracking-tight text-foreground">{name || "Connek"}</span>
    </div>
  );
}
