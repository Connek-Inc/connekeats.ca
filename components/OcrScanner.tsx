"use client";
// Escanear facturas (proveedor) con OCR on-prem (Tesseract). Sube/toma foto →
// extrae texto y montos. Herramienta del dueño/gerente.
import { Button, Card, Spinner } from "@heroui/react";
import { ScanText } from "lucide-react";
import { useRef, useState } from "react";

import { useOcr } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import type { OcrResult } from "@/lib/types";

export function OcrScanner({ businessId }: { businessId: number }) {
  const ocr = useOcr(businessId);
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<OcrResult | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setResult(await ocr.mutateAsync(file));
      } catch (err) {
        show(err instanceof Error ? err.message : "No se pudo leer la imagen", "error");
      }
    }
    e.target.value = "";
  }

  return (
    <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
        <ScanText className="size-3.5" /> Escanear factura (OCR)
      </p>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      <Button variant="secondary" isDisabled={ocr.isPending} onPress={() => fileRef.current?.click()}>
        {ocr.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner color="current" size="sm" /> Leyendo…
          </span>
        ) : (
          "Subir / tomar foto de una factura"
        )}
      </Button>
      {result && (
        <div className="flex flex-col gap-2 text-sm">
          {result.total != null && (
            <p>
              Total detectado: <span className="font-bold text-foreground">${result.total.toFixed(2)}</span>
            </p>
          )}
          {result.amounts.length > 0 && (
            <p className="text-foreground/60">Montos: {result.amounts.map((a) => `$${a.toFixed(2)}`).join(" · ")}</p>
          )}
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-foreground/[0.05] p-3 text-xs text-foreground/70">
            {result.text || "(sin texto reconocido)"}
          </pre>
        </div>
      )}
    </Card>
  );
}
