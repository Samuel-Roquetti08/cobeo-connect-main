import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, stagger } from "@/lib/anim";

export function SectionTitle({
  label,
  title,
  align = "left",
  children,
}: {
  label: string;
  title: ReactNode;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  return (
    <motion.div
      variants={stagger(0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className={align === "center" ? "text-center" : ""}
    >
      <motion.div
        variants={fadeUp}
        className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"
      >
        {label}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.span
        variants={fadeUp}
        className={`mt-5 block h-[2px] w-[60px] bg-gold ${align === "center" ? "mx-auto" : ""}`}
      />
      {children && (
        <motion.div variants={fadeUp} className="mt-5 text-muted-foreground">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
