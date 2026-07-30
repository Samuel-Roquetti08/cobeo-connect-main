import { motion } from "framer-motion";
import { SectionTitle } from "./SectionTitle";
import { patrocinadores } from "@/data/event";
import { fadeUp, stagger } from "@/lib/anim";

// Bloco G, leva 3: decisão final (testada em protótipo) — silhuetas
// monocromáticas no vinho da marca, ESTÁTICAS (sem hover colorido, sem
// carrossel), sem moldura/caixa, flutuando direto sobre o fundo. Técnica:
// cada logo é um PNG com canal alpha real (fundo transparente) usado como
// CSS mask sobre um bloco `background-color: var(--primary)` — a cor da
// silhueta fica exata e não depende da cor original do arquivo.
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
              role="img"
              aria-label={p.nome}
              title={p.nome}
              className="h-14 w-full max-w-[160px] bg-primary"
              style={{
                WebkitMaskImage: `url(${p.logo})`,
                maskImage: `url(${p.logo})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
