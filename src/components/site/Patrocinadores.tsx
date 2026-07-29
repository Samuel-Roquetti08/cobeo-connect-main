import { useEffect, useRef, useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { patrocinadores } from "@/data/event";

// Bloco G (PLANO_COBEO_mudancas_fabiano_29jul2026.md) + pedido do Samuel de
// 29/07: carrossel em vez de grid estático — molduras fixas na tela, cada
// uma trocando de patrocinador com crossfade, uma de cada vez, em rodízio.
// Sem hierarquia entre eles (pedido explícito do Fabiano) — todas as
// molduras são idênticas e a ordem de rotação é só a ordem do array.
//
// Nota técnica: a primeira versão usava AnimatePresence (framer-motion) pra
// crossfade, mas a animação de saída nunca completava — elementos antigos
// ficavam acumulando no DOM em vez de sumir (bug verificado ao vivo no
// browser). Troquei por opacidade via CSS puro (fade-out → troca de
// conteúdo → fade-in), sem depender do ciclo de exit/unmount do framer.
const SLOTS = 6;
const TICK_MS = 2200;
const FADE_MS = 350;

interface SlotState {
  index: number;
  visible: boolean;
}

export function Patrocinadores() {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    Array.from({ length: SLOTS }, (_, i) => ({ index: i % patrocinadores.length, visible: true })),
  );
  const tickRef = useRef(0);

  useEffect(() => {
    if (patrocinadores.length <= SLOTS) return; // nada pra rodar se cabe tudo na tela
    const id = setInterval(() => {
      const slotToAdvance = tickRef.current % SLOTS;
      tickRef.current += 1;

      // 1) fade-out da moldura da vez
      setSlots((cur) => cur.map((s, i) => (i === slotToAdvance ? { ...s, visible: false } : s)));

      // 2) depois do fade-out, troca o conteúdo e faz fade-in
      setTimeout(() => {
        setSlots((cur) =>
          cur.map((s, i) =>
            i === slotToAdvance
              ? { index: (s.index + SLOTS) % patrocinadores.length, visible: true }
              : s,
          ),
        );
      }, FADE_MS);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="patrocinadores" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle label="Apoio e Patrocínio" title="Patrocinadores" align="center" />

        <div
          className="mt-14 grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
        >
          {slots.map((slot, i) => {
            const p = patrocinadores[slot.index];
            return (
              <div
                key={i}
                className={`flex h-[100px] items-center justify-center rounded-xl border border-border p-4 ${
                  p.fundoEscuro ? "bg-[#4a4a4a]" : "bg-background"
                }`}
              >
                <div
                  className="flex h-full w-full items-center justify-center transition-opacity ease-in-out"
                  style={{ opacity: slot.visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
                >
                  {p.logo ? (
                    <img src={p.logo} alt={p.nome} className="h-full w-full object-contain" />
                  ) : (
                    <span
                      className={`text-center font-body text-[12px] font-medium leading-snug ${
                        p.fundoEscuro ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      {p.nome}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
