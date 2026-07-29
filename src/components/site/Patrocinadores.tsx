import { SectionTitle } from "./SectionTitle";
import { patrocinadores } from "@/data/event";
import { fadeUp, stagger } from "@/lib/anim";
import { motion } from "framer-motion";

// Bloco G (PLANO_COBEO_mudancas_fabiano_29jul2026.md) — molduras uniformes,
// sem hierarquia entre patrocinadores (pedido explícito do Fabiano). Enquanto
// os arquivos de logo reais não chegam ao repo, `logo: null` cai no
// fallback de texto — a moldura já fica pronta pro logo entrar depois.
export function Patrocinadores() {
  return (
    <section id="patrocinadores" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle label="Apoio e Patrocínio" title="Patrocinadores" align="center" />

        <motion.div
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
        >
          {patrocinadores.map((p) => (
            <motion.div
              key={p.nome}
              variants={fadeUp}
              className="flex h-[100px] items-center justify-center rounded-xl border border-border bg-background p-4"
            >
              {p.logo ? (
                <img src={p.logo} alt={p.nome} className="h-full w-full object-contain" />
              ) : (
                <span className="text-center font-body text-[12px] font-medium leading-snug text-muted-foreground">
                  {p.nome}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
