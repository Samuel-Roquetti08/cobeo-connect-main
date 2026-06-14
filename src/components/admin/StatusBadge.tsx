import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  Confirmado: "bg-[#dcfce7] text-[#166534]",
  Pendente: "bg-[#fef9c3] text-[#854d0e]",
  Cancelado: "bg-[#fee2e2] text-[#991b1b]",
  "Arquivo Anexado": "bg-[#dbeafe] text-[#1e40af]",
  "Sem Arquivo": "bg-[#f3f4f6] text-[#6b7280]",
  Disponível: "bg-[#dcfce7] text-[#166534]",
  Utilizado: "bg-[#f3f4f6] text-[#6b7280]",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        MAP[status] ?? "bg-gray-100 text-gray-700",
        className,
      )}
    >
      {status}
    </span>
  );
}
