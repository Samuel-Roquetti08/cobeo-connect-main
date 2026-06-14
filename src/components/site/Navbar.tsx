import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { UnifafibeLogo, OdontoSeal } from "./logos";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#palestrantes", label: "Palestrantes" },
  { href: "#programacao", label: "Programação" },
  { href: "#inscricoes", label: "Inscrições" },
  { href: "#contato", label: "Contato" },
];

// Altura aproximada do hero (100vh). Após isso o navbar mostra o título.
const HERO_THRESHOLD = 80;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      setPastHero(window.scrollY > HERO_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 bg-primary text-primary-foreground transition-shadow ${
        scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.18)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* Logo + título animado */}
        <a
          href="#top"
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          aria-label="II COBEO — Voltar ao topo"
        >
          <OdontoSeal className="h-10 shrink-0" />
          <UnifafibeLogo className="h-9 shrink-0" />

          {/* Título que aparece ao scrollar — transição suave */}
          <div
            className={`hidden min-w-0 flex-col overflow-hidden transition-all duration-500 ease-out md:flex ${
              pastHero
                ? "max-w-xs opacity-100 translate-x-0"
                : "max-w-0 opacity-0 -translate-x-4"
            }`}
            aria-hidden={!pastHero}
          >
            <span
              className="truncate font-display text-[15px] font-extrabold leading-tight text-white"
              style={{ letterSpacing: "-0.01em" }}
            >
              II COBEO
            </span>
            <span className="truncate font-body text-[10px] font-medium text-white/60 uppercase tracking-wider">
              Congresso de Odontologia de Bebedouro
            </span>
          </div>
        </a>

        {/* Nav desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-underline font-body text-sm font-medium text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Hamburger mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="fixed inset-0 top-[72px] z-40 flex flex-col bg-primary px-6 py-10 md:hidden"
        >
          <nav aria-label="Navegação mobile" className="flex flex-col gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-2xl font-bold text-white transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
