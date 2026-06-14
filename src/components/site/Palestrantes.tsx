import { motion } from "framer-motion";
import { SectionTitle } from "./SectionTitle";
import { cardIn, stagger } from "@/lib/anim";
import { palestrantes } from "@/data/event";

export function Palestrantes() {
  return (
    <section id="palestrantes" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          label="Quem vai palestrar"
          title="Palestrantes"
          align="center"
        />

        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {palestrantes.map((p) => (
            <motion.article
              key={p.nome}
              variants={cardIn}
              className="group relative rounded-xl border border-border bg-surface px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_32px_rgba(115,17,17,0.12)]"
            >
              <div className="mx-auto h-[100px] w-[100px] rounded-full ring-[3px] ring-primary ring-offset-[3px] ring-offset-background transition-colors group-hover:ring-gold">
                <img
                  src={p.foto}
                  alt={p.nome}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <h3 className="mt-5 font-display text-[18px] font-bold text-foreground">
                {p.nome}
              </h3>
              <p className="mt-1 font-body text-[13px] text-primary">{p.especialidade}</p>
              <p className="font-body text-[12px] text-muted-foreground">{p.instituicao}</p>
              <div className="my-4 h-px bg-[#f0ebe8]" />
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
                {p.tag}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
