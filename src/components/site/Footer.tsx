import { Link } from "@tanstack/react-router";
import { OdontoSeal, UnifafibeLogo } from "./logos";

const navLinks = [
  { href: "#sobre", label: "Sobre" },
  { href: "#palestrantes", label: "Palestrantes" },
  { href: "#programacao", label: "Programação" },
  { href: "#inscricoes", label: "Inscrições" },
  { href: "#contato", label: "Contato" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          <OdontoSeal className="h-12" />
          <UnifafibeLogo className="h-10" />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-underline font-body text-sm text-white/85"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          to="/admin"
          className="font-body text-sm font-semibold text-gold hover:underline"
        >
          Área Admin
        </Link>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center font-body text-xs text-white/65 sm:px-6 md:flex-row md:text-left">
          <div>
            <p>
              © {new Date().getFullYear()} II COBEO — UNIFAFIBE Odontologia · Todos os
              direitos reservados.
            </p>
            <p className="mt-1 text-white/50">
              Desenvolvido por SamuelDEV
            </p>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-gold">Política de Privacidade</a>
            <a href="#" className="hover:text-gold">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
