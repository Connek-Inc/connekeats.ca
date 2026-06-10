"use client";
// Orquestador del onboarding: estado + pasos + preview en vivo + crear/seed.

import { Button, Spinner } from "@heroui/react";
import { Eye, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";

import { useBusiness } from "@/lib/business";
import { useCreateBusiness, useSeedBusiness } from "@/lib/hooks";
import { presetFor } from "@/lib/modePresets";
import { useToast } from "@/lib/toast";

import { celebrate } from "./confetti";
import { PhonePreview } from "./PhonePreview";
import { StepConcepto, StepListo, StepMenu, StepMesas } from "./Steps";
import { buildSeedPayload, initialState, reducer, STEP_TITLES } from "./state";

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / STEP_TITLES.length) * 100;
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground/80">
          Paso {step + 1} de {STEP_TITLES.length} · {STEP_TITLES[step]}
        </span>
        <span className="text-foreground/40">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Wizard() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const { show } = useToast();
  const { setBusinessId } = useBusiness();
  const createBusiness = useCreateBusiness();
  const seed = useSeedBusiness();

  const preset = presetFor(state.mode);
  const canNext = state.step === 0 ? state.name.trim().length > 0 : true;

  async function finish() {
    if (!state.name.trim()) {
      dispatch({ t: "step", step: 0 });
      show("Ponle nombre a tu negocio", "error");
      return;
    }
    dispatch({ t: "finishing", v: true });
    try {
      const business = await createBusiness.mutateAsync({ name: state.name.trim(), mode: state.mode });
      const result = await seed.mutateAsync({ businessId: business.id, payload: buildSeedPayload(state) });
      setBusinessId(business.id);
      dispatch({ t: "created", businessId: business.id, tables: result.tables ?? [] });
      void celebrate();
    } catch (e) {
      dispatch({ t: "error", error: e instanceof Error ? e.message : "No se pudo crear el negocio" });
    }
  }

  const step = state.step;
  const content =
    step === 0 ? (
      <StepConcepto state={state} dispatch={dispatch} />
    ) : step === 1 ? (
      <StepMenu state={state} dispatch={dispatch} />
    ) : step === 2 ? (
      <StepMesas state={state} dispatch={dispatch} />
    ) : (
      <StepListo state={state} onPanel={() => router.replace("/home")} />
    );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <ProgressBar step={step} />

      <div className={step < 3 ? "grid gap-8 lg:grid-cols-[1fr_320px]" : "mx-auto max-w-xl"}>
        <div>
          {content}

          {state.error && <p className="mt-4 text-sm text-foreground/70">{state.error}</p>}

          {step < 3 && (
            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <Button variant="ghost" onPress={() => dispatch({ t: "step", step: step - 1 })}>
                  Atrás
                </Button>
              )}
              {step < 2 && (
                <Button
                  variant="primary"
                  className="flex-1"
                  isDisabled={!canNext}
                  onPress={() => dispatch({ t: "step", step: step + 1 })}
                >
                  Continuar
                </Button>
              )}
              {step === 2 && (
                <Button variant="primary" className="flex-1" isDisabled={state.finishing} onPress={finish}>
                  {state.finishing ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Crear {preset.label} <PartyPopper className="size-5" />
                    </span>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Preview en móvil: toggle inline */}
          {step < 3 && (
            <div className="mt-6 lg:hidden">
              <Button variant="secondary" fullWidth onPress={() => setShowPreview((v) => !v)}>
                {showPreview ? (
                  "Ocultar vista del cliente"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Eye className="size-4" /> Ver vista del cliente
                  </span>
                )}
              </Button>
              {showPreview && (
                <div className="mt-4 flex justify-center">
                  <PhonePreview mode={state.mode} menu={state.menu} tableLabel={`${preset.tableDefaults.labelPrefix} 1`} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview en desktop: sticky a la derecha */}
        {step < 3 && (
          <div className="hidden lg:block">
            <div className="sticky top-8 flex justify-center">
              <PhonePreview mode={state.mode} menu={state.menu} tableLabel={`${preset.tableDefaults.labelPrefix} 1`} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
