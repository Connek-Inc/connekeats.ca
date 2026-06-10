"use client";
// Los 4 pasos del wizard. Presentacionales: reciben {state, dispatch}.

import { Button, Card, Input } from "@heroui/react";
import { Eye, PartyPopper, Sparkles } from "lucide-react";

import { Toggle } from "@/components/Toggle";
import { API_URL } from "@/lib/config";
import { MODE_PRESETS, presetFor, type ModeKey } from "@/lib/modePresets";
import {
  includedCount,
  type Action,
  type WizardState,
} from "./state";

type StepProps = { state: WizardState; dispatch: React.Dispatch<Action> };

// ── Paso 1: Concepto (modo + nombre) ─────────────────────────────────
export function StepConcepto({ state, dispatch }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">¿Qué vas a montar?</h2>
        <p className="text-foreground/55">Elige el concepto. Cada uno arranca con su carta y sus accesos.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["restaurant", "bar"] as ModeKey[]).map((m) => {
          const p = MODE_PRESETS[m];
          const active = state.mode === m;
          const itemCount = p.menuTemplate.reduce((n, c) => n + c.items.length, 0);
          return (
            <button key={m} type="button" onClick={() => dispatch({ t: "mode", mode: m })} className="text-left">
              <Card
                className={`flex h-full flex-col gap-2 rounded-3xl p-5 transition ${
                  active ? "border-foreground/40 bg-foreground/10" : "glass"
                }`}
              >
                <p.Icon className="size-8 text-foreground" />
                <span className={`text-lg font-semibold ${active ? "text-foreground" : "text-foreground/70"}`}>{p.label}</span>
                <span className="text-xs leading-snug text-foreground/50">{p.tagline}</span>
                <span className="mt-1 text-[11px] text-foreground/70">
                  {itemCount} ítems · {p.quickActions.length} accesos rápidos
                </span>
              </Card>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-2 block text-sm text-foreground/70">
          Nombre del {state.mode === "bar" ? "bar" : "restaurante"}
        </label>
        <Input
          fullWidth
          value={state.name}
          onChange={(e) => dispatch({ t: "name", name: e.target.value })}
          placeholder="Ej: La Esquina"
        />
      </div>
    </div>
  );
}

// ── Paso 2: Carta (editar la plantilla) ──────────────────────────────
export function StepMenu({ state, dispatch }: StepProps) {
  const preset = presetFor(state.mode);
  const n = includedCount(state.menu);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          Tu {preset.terms.menu} <Sparkles className="size-5 text-foreground/70" />
        </h2>
        <p className="text-foreground/55">
          Ya te armamos una base. Apaga lo que no vendas y ajusta precios ·{" "}
          <span className="font-semibold text-foreground/70">{n} ítems activos</span>
        </p>
      </div>

      {state.menu.map((c, ci) => (
        <div key={c.category} className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-foreground/50">{c.category}</p>
          {c.items.map((it, ii) => (
            <Card
              key={ii}
              className={`flex flex-row items-center gap-3 rounded-2xl p-3 transition ${
                it.included ? "glass" : "glass opacity-45"
              }`}
            >
              <Toggle
                on={it.included}
                onToggle={() => dispatch({ t: "toggleItem", ci, ii })}
                label={`Incluir ${it.name}`}
              />
              <input
                value={it.name}
                onChange={(e) => dispatch({ t: "itemName", ci, ii, name: e.target.value })}
                placeholder="Nombre del ítem"
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/30"
              />
              <div className="flex items-center gap-1 text-foreground/60">
                <span>$</span>
                <input
                  type="number"
                  min={0}
                  value={it.price}
                  onChange={(e) => dispatch({ t: "price", ci, ii, price: Number(e.target.value) })}
                  className="w-16 bg-transparent text-right text-foreground outline-none"
                />
              </div>
            </Card>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ t: "addItem", ci })}
            className="self-start text-sm text-foreground/70 hover:underline"
          >
            + añadir ítem
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Paso 3: Mesas (cuántas) ──────────────────────────────────────────
export function StepMesas({ state, dispatch }: StepProps) {
  const preset = presetFor(state.mode);
  const { labelPrefix } = preset.tableDefaults;
  const labels = Array.from({ length: state.tableCount }, (_, i) => `${labelPrefix} ${i + 1}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">¿Cuántos {preset.terms.tables}?</h2>
        <p className="text-foreground/55">Cada {preset.terms.table} tendrá su propio QR. Podrás añadir más después.</p>
      </div>

      <Card className="glass flex flex-col items-center gap-4 rounded-3xl p-6">
        <span className="text-5xl font-bold text-foreground">{state.tableCount}</span>
        <input
          type="range"
          min={1}
          max={30}
          value={state.tableCount}
          onChange={(e) => dispatch({ t: "tableCount", n: Number(e.target.value) })}
          className="w-full accent-white"
        />
        <div className="flex gap-2">
          {[4, 8, 12, 20].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={state.tableCount === n ? "primary" : "secondary"}
              className="rounded-full"
              onPress={() => dispatch({ t: "tableCount", n })}
            >
              {n}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {labels.slice(0, 30).map((l) => (
          <span key={l} className="rounded-full border border-foreground/10 bg-foreground/[0.06] px-3 py-1.5 text-xs text-foreground/75">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Paso 4: ¡Listo! (resumen + links + CTA) ──────────────────────────
export function StepListo({ state, onPanel }: { state: WizardState; onPanel: () => void }) {
  const preset = presetFor(state.mode);
  const tables = state.created?.tables ?? [];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const firstLink = tables[0] ? `${origin}/t/${tables[0].qr_token}` : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <PartyPopper className="mx-auto mb-2 size-12 text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">¡{state.name || preset.label} está listo!</h2>
        <p className="text-foreground/55">
          {preset.label} · {tables.length} {preset.terms.tables} con QR. Cada cliente escanea y pide.
        </p>
      </div>

      {firstLink && (
        <a href={firstLink} target="_blank" rel="noreferrer">
          <Button variant="primary" size="lg" fullWidth>
            <span className="flex items-center justify-center gap-2">
              <Eye className="size-5" /> Ver la experiencia del comensal
            </span>
          </Button>
        </a>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Tus {preset.terms.tables}</p>
        <div className="flex flex-col gap-2">
          {tables.map((t) => (
            <Card key={t.id} className="glass flex flex-row items-center justify-between rounded-2xl p-3">
              <span className="font-medium text-foreground">{t.label}</span>
              <div className="flex gap-4 text-sm">
                <a className="text-foreground/70" href={`${origin}/t/${t.qr_token}`} target="_blank" rel="noreferrer">
                  Abrir web
                </a>
                <a
                  className="text-foreground/50 hover:text-foreground/80"
                  href={`${API_URL}/businesses/${state.created?.businessId}/tables/${t.id}/qr.png`}
                  target="_blank"
                  rel="noreferrer"
                >
                  QR
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="secondary" size="lg" fullWidth onPress={onPanel}>
        Ir al panel
      </Button>
    </div>
  );
}
