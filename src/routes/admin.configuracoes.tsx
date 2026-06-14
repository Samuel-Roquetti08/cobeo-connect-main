import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-8">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Configurações</h2>
          <p className="mt-2 text-[13px] text-[#6b6b6b]">
            Em breve: gerenciamento de organizadores, integrações de e-mail e
            configurações do evento.
          </p>
        </div>
      </div>
    </AdminShell>
  ),
});
