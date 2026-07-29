import { motion } from "framer-motion";
import { useState } from "react";
import { Split } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { programacao } from "@/data/event";
import { slideInRight, stagger } from "@/lib/anim";

// Classes literais (não geradas dinamicamente) para o Tailwind JIT conseguir
// detectar em build — empilhado (grid-cols-1) abaixo de md, N colunas lado a
// lado a partir de md.
const GRID_COLS_MD: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export function Programacao() {
  const [tab, setTab] = useState(0);
  const dia = programacao[tab];

  return (
    <section id="programacao" className="bg-background py-16 md:py-[120px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle label="Três dias de imersão" title="Programação" align="center" />

        {/* Tabs dos dias */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {programacao.map((d, i) => (
            <button
              key={d.dia}
              onClick={() => setTab(i)}
              aria-pressed={tab === i}
              className={`rounded-full px-5 py-2 font-body text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                tab === i
                  ? "bg-primary text-white"
                  : "border border-primary/40 text-primary hover:bg-primary/5"
              }`}
            >
              {d.dia}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <motion.div
          key={dia.dia}
          variants={stagger(0.08)}
          initial="hidden"
          animate="visible"
          className="mt-14"
        >
          {dia.itens.map((it) => {
            const isBreak = it.tipo === "break";
            const simultaneas = "sessoes" in it && it.sessoes && it.sessoes.length > 1;
            return (
              <motion.div
                key={it.hora + it.titulo}
                variants={slideInRight}
                className="mb-4 flex items-start gap-0"
              >
                {/* Coluna do horário — largura fixa */}
                <div className="hidden w-[72px] shrink-0 pt-[15px] text-right font-display text-[14px] font-bold text-primary md:block">
                  {it.hora}
                </div>

                {/* Coluna da linha + dot — largura fixa, sem overlap */}
                <div className="hidden md:flex md:w-[40px] md:shrink-0 md:flex-col md:items-center md:pt-[14px]">
                  {/* Dot */}
                  <div className="h-3 w-3 rounded-full bg-gold ring-2 ring-background" />
                  {/* Linha vertical abaixo do dot */}
                  <div className="mt-1 w-[2px] flex-1 bg-border" style={{ minHeight: 32 }} />
                </div>

                {/* Dot mobile */}
                <div className="flex w-[28px] shrink-0 flex-col items-center pt-[14px] md:hidden">
                  <div className="h-3 w-3 rounded-full bg-gold ring-2 ring-background" />
                  <div className="mt-1 w-[2px] flex-1 bg-border" style={{ minHeight: 32 }} />
                </div>

                {simultaneas ? (
                  <div className="mb-1 flex-1">
                    {/* Horário mobile — dentro do bloco */}
                    <div className="mb-0.5 font-body text-[11px] font-semibold text-primary md:hidden">
                      {it.hora}
                    </div>
                    <h4 className="font-body text-[14px] font-semibold leading-snug text-foreground">
                      {it.titulo}
                    </h4>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#f3ead9] px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-[#8a6a1f]">
                      <Split className="h-3 w-3" aria-hidden="true" />
                      Sessões simultâneas
                    </span>
                    <div className={`mt-2 grid grid-cols-1 gap-3 ${GRID_COLS_MD[it.sessoes!.length] ?? "md:grid-cols-2"}`}>
                      {it.sessoes!.map((s, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface px-3 py-2.5">
                          <div className="font-body text-[10px] font-bold uppercase tracking-wider text-gold">
                            Hands-on {i + 1}
                          </div>
                          <h5 className="mt-1 font-body text-[13px] font-semibold leading-snug text-foreground">
                            {s.titulo}
                          </h5>
                          {s.speaker && (
                            <p className="mt-0.5 font-body text-[11px] text-primary">{s.speaker}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mb-1 flex-1 rounded-lg border px-4 py-3 ${
                      isBreak
                        ? "border-dashed border-border bg-background italic text-muted-foreground"
                        : "border-border bg-surface"
                    }`}
                  >
                    {/* Horário mobile — dentro do card */}
                    <div className="mb-0.5 font-body text-[11px] font-semibold text-primary md:hidden">
                      {it.hora}
                    </div>
                    <h4 className="font-body text-[14px] font-semibold leading-snug text-foreground">
                      {it.titulo}
                    </h4>
                    {it.speaker && (
                      <p className="mt-0.5 font-body text-[12px] text-primary">{it.speaker}</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
