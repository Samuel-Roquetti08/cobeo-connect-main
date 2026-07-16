// ============================================================================
// COBEO CONNECT — Hooks de dados do admin (TanStack Query)
// ============================================================================
// Cada página consome um hook daqui. O TanStack Query cuida de cache, estados
// de loading/erro e revalidação. As mutations invalidam as queries afetadas
// para a UI refletir a mudança sem reload manual.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInscritos, getTrabalhos, getCupons, createCupom, deleteCupom,
  getConfiguracoes, updateConfiguracoes,
  getElegiveisCertificado, marcarCertificadosEnviados,
} from "./adminData";
import type { CupomCategoria } from "./adminTypes";

// Chaves de cache centralizadas (evita typos e facilita invalidação)
export const adminKeys = {
  inscritos: ["admin", "inscritos"] as const,
  trabalhos: ["admin", "trabalhos"] as const,
  cupons: ["admin", "cupons"] as const,
  config: ["admin", "config"] as const,
  certificados: ["admin", "certificados"] as const,
};

export function useInscritos() {
  return useQuery({ queryKey: adminKeys.inscritos, queryFn: getInscritos });
}

export function useTrabalhos() {
  return useQuery({ queryKey: adminKeys.trabalhos, queryFn: getTrabalhos });
}

export function useCupons() {
  return useQuery({ queryKey: adminKeys.cupons, queryFn: getCupons });
}

export function useConfiguracoes() {
  return useQuery({ queryKey: adminKeys.config, queryFn: getConfiguracoes });
}

export function useCreateCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      codigo: string; titular: string; categoria: CupomCategoria;
      tipo: "fixo" | "percentual"; valor: number;
    }) => createCupom(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.cupons }),
  });
}

export function useDeleteCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCupom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.cupons }),
  });
}

export function useUpdateConfiguracoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<{ inscricoesBloqueadas: boolean; jantarBloqueado: boolean }>) =>
      updateConfiguracoes(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.config }),
  });
}

// ─── Certificados ────────────────────────────────────────────────────────────
export function useElegiveisCertificado() {
  return useQuery({ queryKey: adminKeys.certificados, queryFn: getElegiveisCertificado });
}

export function useMarcarCertificadosEnviados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marcarCertificadosEnviados(),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.config }),
  });
}

// ─── Check-in e Crachás ──────────────────────────────────────────────────────
import { getInscritosParaCracha } from "./adminData";

export const crachaKeys = { lista: ["admin", "crachas"] as const };

export function useInscritosCracha() {
  return useQuery({ queryKey: crachaKeys.lista, queryFn: getInscritosParaCracha });
}
