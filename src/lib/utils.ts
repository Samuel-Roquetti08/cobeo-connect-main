import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Item 4 da auditoria pré-lançamento: busca no admin já era case-insensitive
// (.toLowerCase()) mas não ignorava acento — "José" não batia com "jose".
// NFD separa a letra do diacrítico; o regex (faixa Unicode dos diacríticos
// combinantes, ̀-ͯ) remove só o diacrítico, mantendo a letra base.
export function normalizarBusca(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
