import { motion, type Variants } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { COBEO_ILLUSTRATION } from "./logos";
import { evento } from "@/data/event";

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function Hero() {
  return (
    <section
      id="top"
      aria-label="Apresentação do II COBEO"
      className="relative flex min-h-[100svh] items-center overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(ellipse at 30% 50%, #8B1515 0%, #731111 60%, #4a0a0a 100%)",
      }}
    >
      {/* Textura sutil — decorativa, sem significado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-24 sm:px-6 md:grid-cols-[55%_45%] md:py-28 lg:py-32">
        {/* Coluna de texto */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.18, delayChildren: 0.05 }}
        >
          {/* Badge edição */}
          <motion.span
            variants={item}
            className="inline-block rounded-full border border-[#C9A84C]/70 px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]"
          >
            {evento.edicao}
          </motion.span>

          {/* Título principal */}
          <motion.h1
            variants={item}
            className="mt-5 font-display font-extrabold leading-[0.9] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(56px, 9vw, 112px)" }}
          >
            II COBEO
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            variants={item}
            className="mt-4 font-display font-semibold text-[#b5736f]"
            style={{ fontSize: "clamp(17px, 2vw, 26px)" }}
          >
            Congresso de Odontologia de Bebedouro
          </motion.p>

          {/* Divisor dourado */}
          <motion.span
            variants={item}
            aria-hidden="true"
            className="my-6 block h-[2px] w-[60px] bg-[#C9A84C]"
          />

          {/* Data e local */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-[14px] text-white/80"
          >
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-[#C9A84C]" aria-hidden="true" />
              <span>{evento.data}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#C9A84C]" aria-hidden="true" />
              <span>{evento.local}</span>
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#inscricoes"
              className="rounded-md bg-[#C9A84C] px-8 py-[14px] font-body text-sm font-semibold text-[#731111] shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#731111]"
            >
              Inscrever-se Agora
            </a>
            <a
              href="#programacao"
              className="rounded-md border-[1.5px] border-white/40 px-8 py-[14px] font-body text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#731111]"
            >
              Ver Programação
            </a>
          </motion.div>

          {/* Vagas */}
          <motion.p
            variants={item}
            className="mt-5 font-body text-[13px] text-white/50"
          >
            Vagas Limitadas — Garanta sua inscrição
          </motion.p>
        </motion.div>

        {/* Ilustração desktop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative hidden md:flex md:items-center md:justify-center"
        >
          <motion.img
            src={COBEO_ILLUSTRATION}
            alt="Ilustração arquitetônica do prédio da UNIFAFIBE"
            className="w-full max-w-[500px] xl:max-w-[560px]"
            style={{ mixBlendMode: "luminosity", opacity: 0.82 }}
            animate={{ y: [-8, 0, -8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Ilustração mobile — fundo decorativo */}
        <img
          src={COBEO_ILLUSTRATION}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-full w-full object-contain opacity-[0.06] md:hidden"
        />
      </div>
    </section>
  );
}
