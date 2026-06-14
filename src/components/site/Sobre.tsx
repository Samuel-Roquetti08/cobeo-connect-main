import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Users, Clock, Award } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { fadeUp, stagger } from "@/lib/anim";
import { stats } from "@/data/event";

const icons = [Users, Clock, Award];

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);

  return (
    <span ref={ref} className="font-display text-4xl font-extrabold text-primary">
      <motion.span>{rounded}</motion.span>
    </span>
  );
}

export function Sobre() {
  return (
    <section id="sobre" className="bg-background py-16 md:py-[120px]">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 md:grid-cols-2 md:gap-20">
        <div>
          <SectionTitle
            label="Sobre o Evento"
            title="Um Congresso que Transforma a Odontologia"
          />
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-8 space-y-5 font-body text-[15px] leading-[1.8] text-muted-foreground"
          >
            <motion.p variants={fadeUp}>
              O II COBEO reúne estudantes, profissionais e pesquisadores da odontologia
              em três dias de imersão científica, com palestras de referências nacionais,
              workshops práticos e apresentações de trabalhos acadêmicos. Lorem ipsum dolor
              sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </motion.p>
            <motion.p variants={fadeUp}>
              Promovido pelo curso de Odontologia da UNIFAFIBE, o congresso aproxima
              academia e clínica, apresentando as mais recentes inovações em técnicas,
              materiais e gestão da prática odontológica. Ut enim ad minim veniam, quis
              nostrud exercitation ullamco laboris.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 pt-2 font-body text-sm font-medium text-foreground"
            >
              <span>24+ Palestrantes</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
              <span>32h de Conteúdo</span>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col gap-4"
        >
          {stats.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="group relative flex items-center gap-5 rounded-xl border border-l-4 border-border border-l-gold bg-surface px-7 py-6 shadow-sm transition-all duration-300 hover:translate-x-1 hover:border-l-primary hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <CountUp to={s.value} suffix={s.suffix} />
                  <div className="mt-1 font-body text-sm text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
