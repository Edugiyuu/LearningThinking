"use client";

import { createContext, useContext } from "react";
import type { Vista } from "@/lib/rede";

/** O que os blocos e linhas precisam do laboratório, sem passar por props do React Flow. */
type Laboratorio = {
  /** O que a rodada já mostrou; null quando ninguém clicou em Rodar. */
  vista: Vista | null;
  /** Blocos com erro na última vez que o aluno clicou em Rodar. */
  erros: Set<string>;
  /** Blocos com aviso (a rodada continua). */
  avisos: Set<string>;
  editarPeso: (id: string | null) => void;
  salvarPeso: (id: string, valor: number) => void;
};

export const LabContexto = createContext<Laboratorio | null>(null);

export function useLab(): Laboratorio {
  const lab = useContext(LabContexto);
  if (!lab) throw new Error("useLab fora do LabContexto");
  return lab;
}
