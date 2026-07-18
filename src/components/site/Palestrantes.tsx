import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { cardIn, stagger } from "@/lib/anim";
import { palestrantes } from "@/data/event";

type Palestrante = (typeof palestrantes)[number];

// Painel de certificações do card expandido (desktop) — id fixo referenciado
// por aria-controls nos botões do grid compacto, mesmo que o painel só
// exista no DOM quando algum card está expandido (padrão comum em
// disclosure widgets: o alvo pode não estar montado ainda).
const DESKTOP_PAINEL_ID = "palestrante-painel-desktop";

function iniciais(nome: string): string {
  return nome
    .replace(/^(Prof\.|Profa\.|Dr\.|Dra\.|Me\.|Esp\.)\s*/gi, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function Avatar({ p, size = 100 }: { p: Palestrante; size?: number }) {
  return (
    <div
      className="mx-auto shrink-0 rounded-full ring-[3px] ring-primary ring-offset-[3px] ring-offset-background transition-colors group-hover:ring-gold"
      style={{ width: size, height: size }}
    >
      {p.foto ? (
        <img
          src={p.foto}
          alt={p.nome}
          className="h-full w-full rounded-full object-cover"
          style={{ objectPosition: p.objectPosition ?? "center" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
          {iniciais(p.nome)}
        </div>
      )}
    </div>
  );
}

function CertificacoesList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-left font-body text-[13px] text-muted-foreground">
      {items.map((c, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
          <span>{c}</span>
        </li>
      ))}
    </ul>
  );
}

export function Palestrantes() {
  // Único estado controla os dois layouts (desktop expandido / mobile
  // accordion) — não usar useState por card (permitiria dois abertos ao
  // mesmo tempo) nem detectar viewport via JS (SSR: ler window na
  // renderização causa hydration mismatch). Tailwind `lg:` decide qual
  // marcação aparece; ambas ficam no DOM o tempo todo.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  const expandido = palestrantes.find((p) => p.id === expandedId) ?? null;

  return (
    <section id="palestrantes" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle label="Quem vai palestrar" title="Palestrantes" align="center" />

        {/* ── Desktop (>=1024px): card expandido à esquerda, grid compacto à direita ── */}
        <div className="mt-14 hidden lg:block">
          <div className="flex items-start gap-6">
            <AnimatePresence mode="popLayout">
              {expandido && (
                <motion.article
                  key={expandido.id}
                  id={DESKTOP_PAINEL_ID}
                  layoutId={`desktop-palestrante-${expandido.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-[360px] shrink-0 rounded-xl border border-primary bg-surface p-8 text-center shadow-[0_8px_32px_rgba(115,17,17,0.12)]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(null)}
                    aria-label="Fechar detalhes do palestrante"
                    className="float-right rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <Avatar p={expandido} size={110} />
                  <h3 className="mt-5 font-display text-[19px] font-bold text-foreground">
                    {expandido.nome}
                  </h3>
                  <p className="mt-1 font-body text-[13px] text-primary">{expandido.especialidade}</p>
                  {expandido.instituicao && (
                    <p className="font-body text-[12px] text-muted-foreground">{expandido.instituicao}</p>
                  )}
                  <div className="my-4 h-px bg-[#f0ebe8]" />
                  <CertificacoesList items={expandido.certificacoes} />
                </motion.article>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className={`grid flex-1 gap-4 ${expandido ? "grid-cols-3" : "grid-cols-4"}`}
            >
              {palestrantes
                .filter((p) => p.id !== expandedId)
                .map((p) => (
                  <motion.article
                    key={p.id}
                    layoutId={`desktop-palestrante-${p.id}`}
                    layout
                    className="group rounded-xl border border-border bg-surface px-6 py-8 text-center transition-colors hover:border-primary"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-expanded={false}
                      aria-controls={DESKTOP_PAINEL_ID}
                      className="w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Avatar p={p} size={expandido ? 72 : 100} />
                      <h3 className="mt-4 font-display text-[15px] font-bold text-foreground">{p.nome}</h3>
                      <p className="mt-1 font-body text-[12px] text-primary">{p.especialidade}</p>
                      {!expandido && p.instituicao && (
                        <p className="font-body text-[12px] text-muted-foreground">{p.instituicao}</p>
                      )}
                      <div className="my-3 h-px bg-[#f0ebe8]" />
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
                        {p.tag}
                      </p>
                    </button>
                  </motion.article>
                ))}
            </motion.div>
          </div>
        </div>

        {/* ── Mobile (<1024px): accordion, expande para baixo no lugar ── */}
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:hidden"
        >
          {palestrantes.map((p) => {
            const aberto = expandedId === p.id;
            const painelId = `palestrante-cert-mobile-${p.id}`;
            return (
              <motion.article
                key={p.id}
                variants={cardIn}
                layout
                className="rounded-xl border border-border bg-surface px-6 py-8 text-center transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-expanded={aberto}
                  aria-controls={painelId}
                  className="w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Avatar p={p} />
                  <h3 className="mt-5 font-display text-[18px] font-bold text-foreground">{p.nome}</h3>
                  <p className="mt-1 font-body text-[13px] text-primary">{p.especialidade}</p>
                  {p.instituicao && (
                    <p className="font-body text-[12px] text-muted-foreground">{p.instituicao}</p>
                  )}
                  <div className="my-4 h-px bg-[#f0ebe8]" />
                  <p className="flex items-center justify-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
                    {p.tag}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </p>
                </button>
                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div
                      id={painelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 border-t border-[#f0ebe8] pt-4">
                        <CertificacoesList items={p.certificacoes} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
