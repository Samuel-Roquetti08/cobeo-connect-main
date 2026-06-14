import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Sobre } from "@/components/site/Sobre";
import { Palestrantes } from "@/components/site/Palestrantes";
import { Programacao } from "@/components/site/Programacao";
import { Inscricoes } from "@/components/site/Inscricoes";
import { Contato } from "@/components/site/Contato";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "II COBEO — Congresso de Odontologia de Bebedouro | UNIFAFIBE" },
      {
        name: "description",
        content:
          "II COBEO: Congresso de Odontologia de Bebedouro, promovido pela UNIFAFIBE. Palestras, workshops e inscrições abertas.",
      },
      { property: "og:title", content: "II COBEO — Congresso de Odontologia de Bebedouro" },
      {
        property: "og:description",
        content: "Três dias de imersão científica em odontologia. Inscreva-se.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Sobre />
        <Palestrantes />
        <Programacao />
        <Inscricoes />
        <Contato />
      </main>
      <Footer />
    </>
  );
}
