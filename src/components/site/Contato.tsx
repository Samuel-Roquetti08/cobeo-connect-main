import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { OdontoSeal, UnifafibeLogo } from "./logos";
import { contato } from "@/data/event";
import { fadeUp, stagger } from "@/lib/anim";

export function Contato() {
  return (
    <section id="contato" className="bg-background py-16 md:py-[120px]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-2">
        <div>
          <SectionTitle label="Fale conosco" title="Contato" />
          <motion.ul
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-8 space-y-5"
          >
            {[
              { icon: Mail, label: contato.email },
              { icon: Phone, label: contato.telefone },
              { icon: MapPin, label: contato.endereco },
            ].map(({ icon: Icon, label }) => (
              <motion.li
                variants={fadeUp}
                key={label}
                className="flex items-start gap-4 font-body text-[15px] text-foreground"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-2">{label}</span>
              </motion.li>
            ))}
          </motion.ul>

          <div className="mt-10 flex items-center gap-5">
            <OdontoSeal className="h-14" />
            <UnifafibeLogo className="h-12" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative flex h-[300px] w-full items-center justify-center rounded-xl bg-[#e5e2df] md:h-full md:min-h-[360px]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #e5e2df 0%, #d9d9d9 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <MapPin className="h-10 w-10 text-primary" />
            <p className="font-display text-lg font-bold text-foreground">
              UNIFAFIBE — Bebedouro/SP
            </p>
            <p className="max-w-[280px] font-body text-sm text-muted-foreground">
              {contato.endereco}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
