import { cn } from "@/lib/utils";
import type { StatusPagamento } from "@/lib/api/adminTypes";
import { STATUS_LABELS } from "@/lib/api/adminTypes";

// Cores por status legível (mantém compatibilidade com strings antigas)
const MAP: Record<string, string> = {
  Confirmado: "bg-[#dcfce7] text-[#166534]",
  Pendente: "bg-[#fef9c3] text-[#854d0e]",
  Cancelado: "bg-[#fee2e2] text-[#991b1b]",
  Reembolsado: "bg-[#fae8ff] text-[#86198f]",
  Expirado: "bg-[#f3f4f6] text-[#6b7280]",
  "Arquivo Anexado": "bg-[#dbeafe] text-[#1e40af]",
  "Sem Arquivo": "bg-[#f3f4f6] text-[#6b7280]",
  Disponível: "bg-[#dcfce7] text-[#166534]",
  Utilizado: "bg-[#f3f4f6] text-[#6b7280]",
};

// Aceita tanto um status legível (string) quanto um StatusPagamento do banco.
export function StatusBadge({
  status,
  className,
}: {
  status: StatusPagamento | string;
  className?: string;
}) {
  // Se vier um status do banco (pago/pendente/...), converte para o rótulo
  const label =
    status in STATUS_LABELS
      ? STATUS_LABELS[status as StatusPagamento]
      : status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        MAP[label] ?? "bg-gray-100 text-gray-700",
        className,
      )}
    >
      {label}
    </span>
  );
}
