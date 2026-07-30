import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PoliticaPrivacidadeConteudo } from "@/components/site/PoliticaPrivacidade";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — II COBEO" }] }),
  component: PoliticaDePrivacidadePage,
});

function PoliticaDePrivacidadePage() {
  return (
    <>
      <Navbar />
      <main className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Link to="/" className="font-body text-xs text-primary hover:underline">
            ← Voltar ao site
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            II COBEO — Congresso de Odontologia de Bebedouro
          </p>
          <div className="mt-8">
            <PoliticaPrivacidadeConteudo />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
