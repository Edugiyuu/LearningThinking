// Quiz ao vivo (ADR-0034, seção A): as mensagens entre a aba do professor e o aparelho do aluno.
// O PeerJS só apresenta os dois navegadores; depois as mensagens vão direto de um para o outro.
// O que chega do outro lado é conferido aqui antes de ser usado (pode vir qualquer coisa).

import type { Direcao, Resposta } from "./perguntas";

/** Do aluno para o professor. */
export type MsgAluno =
  | { tipo: "entrar"; id: string; apelido: string }
  | { tipo: "resposta"; indice: number; resposta: Resposta; segundos: number };

export type ResultadoDoAluno = {
  indice: number;
  perguntas: number;
  certo: boolean;
  ganhou: number;
  pontos: number;
  posicao: number;
  /** quantos outros têm os mesmos pontos */
  empatados: number;
};

export type FimDoAluno = { pontos: number; acertos: number; perguntas: number; posicao: number; empatadosCom: string[] };

/** Do professor para o aluno. */
export type MsgProfessor =
  | { tipo: "bem-vindo"; apelido: string; pontos: number; fase: "espera" | "no-meio" }
  | { tipo: "recusado"; motivo: string }
  | { tipo: "turma"; apelidos: string[] }
  | { tipo: "pergunta"; indice: number; perguntas: number; modelo: string; semente: number; tempo: number; restante: number }
  | { tipo: "tempo"; indice: number; restante: number }
  | { tipo: "recebida"; indice: number; resposta: Resposta }
  | { tipo: "progresso"; indice: number; responderam: number; de: number }
  | { tipo: "resultado"; resultado: ResultadoDoAluno }
  | { tipo: "fim"; fim: FimDoAluno }
  | { tipo: "fechada" };

export const APELIDO_MAX = 16;
export const ALUNOS_MAX = 60;

/** Tira espaços sobrando e corta no tamanho máximo. */
export const limparApelido = (texto: string) => texto.replace(/\s+/g, " ").trim().slice(0, APELIDO_MAX);

const ehObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const ehNumero = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const DIRECOES: Direcao[] = ["sobe", "desce", "nao-muda"];

function lerResposta(x: unknown): Resposta | null {
  if (!ehObjeto(x)) return null;
  if (x.tipo === "alternativa" && ehNumero(x.indice)) return { tipo: "alternativa", indice: Math.trunc(x.indice) };
  if (x.tipo === "numero" && ehNumero(x.valor)) return { tipo: "numero", valor: x.valor };
  if (x.tipo === "linha" && DIRECOES.includes(x.escolha as Direcao)) return { tipo: "linha", escolha: x.escolha as Direcao };
  return null;
}

/** Confere uma mensagem que chegou de um aluno. Devolve null se ela não tem o formato certo. */
export function lerMsgAluno(x: unknown): MsgAluno | null {
  if (!ehObjeto(x)) return null;
  if (x.tipo === "entrar" && typeof x.id === "string" && typeof x.apelido === "string" && x.id.length <= 64) {
    const apelido = limparApelido(x.apelido);
    return apelido ? { tipo: "entrar", id: x.id, apelido } : null;
  }
  if (x.tipo === "resposta" && ehNumero(x.indice) && ehNumero(x.segundos)) {
    const resposta = lerResposta(x.resposta);
    return resposta ? { tipo: "resposta", indice: Math.trunc(x.indice), resposta, segundos: Math.max(0, x.segundos) } : null;
  }
  return null;
}

/** Confere uma mensagem que chegou do professor (o aluno só confia no formato). */
export function lerMsgProfessor(x: unknown): MsgProfessor | null {
  if (!ehObjeto(x) || typeof x.tipo !== "string") return null;
  const tipos = ["bem-vindo", "recusado", "turma", "pergunta", "tempo", "recebida", "progresso", "resultado", "fim", "fechada"];
  return tipos.includes(x.tipo) ? (x as MsgProfessor) : null;
}
