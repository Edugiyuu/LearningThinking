"use client";

import { createContext, useContext } from "react";
import type { EntradaData, SaidaData, Vista } from "@/lib/rede";
import type { Exemplo } from "@/lib/treino";
import type { VistaVolta } from "@/lib/backward";

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
  /** Passo cuja bolinha já entrou no neurônio (a parcela já conta na soma dele). */
  chegou: number | null;
  bolinhaChegou: (passo: number) => void;
  /** Cada linha conta onde estão as suas pontas, para o laboratório decidir onde vai o número. */
  informarLinha: (id: string, s: { sx: number; sy: number; tx: number; ty: number }) => void;
  /** Ponto da linha (0 a 1) onde o número do peso fica. */
  posicaoDoPeso: Map<string, number>;
  /** O que a Entrada manda agora (o Backward pass procura a cor dela nos Dados). */
  entrada: EntradaData | null;
  /** Os Dados do Treinar: cada cor com a resposta certa. O Backward pass lê e acrescenta (ADR-0025). */
  dados: Exemplo[];
  setDados: (d: Exemplo[]) => void;
  /** A volta (Backward pass, ADR-0025): null na ida ou quando o bloco não está ligado. */
  volta: VistaVolta | null;
  /** Mostrar (os pesos não mudam) ou Salvar, como estava quando o aluno clicou em Rodar. */
  modoVolta: "mostrar" | "salvar";
  /** O que 0 e 1 significam, da Saída da montagem. */
  rotulos: Pick<SaidaData, "rotulo0" | "cor0" | "rotulo1" | "cor1">;
};

export const LabContexto = createContext<Laboratorio | null>(null);

export function useLab(): Laboratorio {
  const lab = useContext(LabContexto);
  if (!lab) throw new Error("useLab fora do LabContexto");
  return lab;
}
