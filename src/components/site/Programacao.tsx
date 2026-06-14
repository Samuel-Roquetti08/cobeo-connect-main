import { motion } from "framer-motion";
import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { programacao } from "@/data/event";
import { slideInRight, stagger } from "@/lib/anim";

export function Programacao() {
  const [tab, setTab] = useState(0);
  const dia = programacao[tab];

  return (
    <section id="programacao" className="bg-background py-16 md:py-[120px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle label="Três dias de imersão" title="Programação" align="center" />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {programacao.map((d, i) => (
            <button
              key={d.dia}
              onClick={() => setTab(i)}
              className={`rounded-full px-5 py-2 font-body text-sm font-medium transition-colors ${
                tab === i
                  ? "bg-primary text-white"
                  : "border border-primary/40 text-primary hover:bg-primary/5"
              }`}
            >
              {d.dia}
            </button>
          ))}
        </div>

        <motion.div
          key={dia.dia}
          variants={stagger(0.08)}
          initial="hidden"
          animate="visible"
          className="relative mt-14 pl-6 md:pl-32"
        >
          <div className="absolute bottom-0 left-[88px] top-2 hidden w-[2px] bg-border md:block" />
          <div className="absolute bottom-0 left-[10px] top-2 w-[2px] bg-border md:hidden" />

          {dia.itens.map((it) => {
            const isBreak = it.tipo === "break";
            return (
              <motion.div
                key={it.hora + it.titulo}
                variants={slideInRight}
                className="relative mb-5 flex items-start gap-4 md:gap-8"
              >
                <div className="hidden w-[80px] -ml-32 shrink-0 pt-3 text-right font-display text-base font-bold text-primary md:block">
                  {it.hora}
                </div>
                <div className="absolute left-0 top-4 z-10 h-3 w-3 -translate-x-[5px] rounded-full bg-gold ring-2 ring-background md:left-[88px] md:-translate-x-[5px]" />
                <div
                  className={`ml-6 flex-1 rounded-lg border px-5 py-4 md:ml-0 ${
                    isBreak
                      ? "border-dashed border-border bg-background italic text-muted-foreground"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="font-body text-xs font-semibold text-primary md:hidden">
                    {it.hora}
                  </div>
                  <h4 className="font-body text-[15px] font-semibold text-foreground">
                    {it.titulo}
                  </h4>
                  {it.speaker && (
                    <p className="mt-0.5 font-body text-[13px] text-primary">{it.speaker}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
