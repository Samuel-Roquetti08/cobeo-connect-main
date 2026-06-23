import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { OdontoSeal, UnifafibeLogo } from "./logos";
import { contato } from "@/data/event";
import { fadeUp, stagger } from "@/lib/anim";

export function Contato() {
  const itensContato = [
    { icon: Mail, label: contato.email, href: `mailto:${contato.email}` },
    ...(contato.telefone ? [{ icon: Phone, label: contato.telefone, href: `tel:${contato.telefone}` }] : []),
    { icon: MapPin, label: contato.endereco, href: contato.maps },
  ];

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
            {itensContato.map(({ icon: Icon, label, href }) => (
              <motion.li
                variants={fadeUp}
                key={label}
                className="flex items-start gap-4 font-body text-[15px] text-foreground"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="pt-2 hover:text-primary transition-colors"
                >
                  {label}
                </a>
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
          style={{ backgroundImage: "linear-gradient(135deg, #e5e2df 0%, #d9d9d9 100%)" }}
        >
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <MapPin className="h-10 w-10 text-primary" />
            <p className="font-display text-lg font-bold text-foreground">
              Anfiteatro 1 — UNIFAFIBE
            </p>
            <p className="max-w-[280px] font-body text-sm text-muted-foreground">
              {contato.endereco}
            </p>
            <a
              href={contato.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Ver no Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
