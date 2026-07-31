import { motion } from "framer-motion";
import { SectionTitle } from "./SectionTitle";
import { patrocinadores } from "@/data/event";
import { fadeUp, stagger } from "@/lib/anim";

// Logos originais coloridas, cada uma numa caixa de mesmo tamanho
// (object-contain preserva a proporção de cada arquivo sem distorcer).
export function Patrocinadores() {
  return (
    <section id="patrocinadores" className="bg-background py-16 md:py-[120px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle label="Apoio e Patrocínio" title="Patrocinadores" align="center" />

        <motion.div
          variants={stagger(0.04)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid items-center justify-items-center gap-x-10 gap-y-12"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
        >
          {patrocinadores.map((p) => (
            <motion.div
              key={p.nome}
              variants={fadeUp}
              className={`flex h-20 w-full max-w-[160px] items-center justify-center ${
                p.fundoEscuro ? "rounded-lg bg-foreground px-4 py-3" : ""
              }`}
            >
              <img src={p.logo} alt={p.nome} title={p.nome} className="max-h-full max-w-full object-contain" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
