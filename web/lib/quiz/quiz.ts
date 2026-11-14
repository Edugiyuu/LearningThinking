// Quiz ao vivo (ADR-0034): o plano do quiz (quais perguntas, em que ordem, com que semente),
// o código da sala e o placar (posições com empate e quem subiu ou desceu).

import { sorteador } from "../treino";
import { embaralhar, escolher, semearTexto } from "./numeros";
import { ASSUNTOS, ehConta, gerarPergunta, modelosDoAssunto, type Assunto } from "./perguntas";

/* ---------- Configuração da sala ---------- */

export type Sorteio = "por-aluno" | "por-turma";

export type Config = {
  tema: "geral" | "forward" | "escolher";
  assuntos: Assunto[];
  quantidade: number; // de 3 a 20 (decisão 9)
  sorteio: Sorteio;
  tempoAlternativas: number; // segundos
  tempoContas: number;
};

export const QUANTIDADE = { min: 3, max: 20 } as const;
export const PONTOS_POR_ACERTO = 1000;
export const TEMPOS_ALTERNATIVAS = [10, 20, 30, 45] as const;
export const TEMPOS_CONTAS = [30, 45, 60, 90, 120] as const;

/* ---------- O plano ---------- */

export type ItemDoPlano = { modelo: string; assunto: Assunto };

/**
 * Escolhe as perguntas: os assuntos marcados se revezam (cada um com um modelo sorteado, sem
 * repetir modelo enquanto der) e a lista fica na ordem em que o lab ensina, do Entrada ao Treino.
 */
export function montarPlano(assuntos: Assunto[], quantidade: number, semente: number): ItemDoPlano[] {
  const r = sorteador(semente);
  const ordem = ASSUNTOS.map((a) => a.id).filter((a) => assuntos.includes(a));
  if (ordem.length === 0) return [];
  // se há mais assuntos do que perguntas, sorteia quais entram
  const escolhidos = quantidade < ordem.length ? embaralhar(r, ordem).slice(0, quantidade) : ordem;
  const vezes = new Map<Assunto, number>();
  for (let i = 0; i < quantidade; i++) {
    const a = escolhidos[i % escolhidos.length];
    vezes.set(a, (vezes.get(a) ?? 0) + 1);
  }
  const plano: ItemDoPlano[] = [];
  for (const a of ordem) {
    const n = vezes.get(a) ?? 0;
    let monte: string[] = [];
    for (let i = 0; i < n; i++) {
      if (monte.length === 0) monte = embaralhar(r, modelosDoAssunto(a));
      plano.push({ modelo: monte.pop() ?? escolher(r, modelosDoAssunto(a)), assunto: a });
    }
  }
  return plano;
}

/** A semente de uma pergunta: a mesma para a turma toda, ou uma para cada aluno. */
export function sementeDaPergunta(sementeDaSala: number, indice: number, sorteio: Sorteio, alunoId?: string): number {
  return semearTexto(sorteio === "por-aluno" && alunoId ? `${sementeDaSala}:${indice}:${alunoId}` : `${sementeDaSala}:${indice}`);
}

/** Cerca de quanto tempo o quiz leva, para o resumo do Criar sala. */
export function minutosEstimados(plano: ItemDoPlano[], config: Pick<Config, "tempoAlternativas" | "tempoContas">): number {
  // o tempo de cada pergunta (quase todos respondem antes do fim) + o resultado projetado
  const segundos = plano.reduce((s, p) => s + tempoDoModelo(p.modelo, config) * 0.8 + 25, 0);
  return Math.max(1, Math.round(segundos / 60));
}

/** Contas levam o tempo de contas; alternativas e clique na linha, o de alternativas. */
export function tempoDoModelo(modelo: string, config: Pick<Config, "tempoAlternativas" | "tempoContas">): number {
  return ehConta(gerarPergunta(modelo, 1)) ? config.tempoContas : config.tempoAlternativas;
}

/* ---------- O código da sala ---------- */

/** Sem as letras e números que confundem (O/0, I/1). */
export const ALFABETO_DO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const TAMANHO_DO_CODIGO = 6;

export function gerarCodigo(aleatorio: () => number = Math.random): string {
  let codigo = "";
  for (let i = 0; i < TAMANHO_DO_CODIGO; i++) codigo += ALFABETO_DO_CODIGO[Math.floor(aleatorio() * ALFABETO_DO_CODIGO.length)];
  return codigo;
}

/** Arruma o que o aluno digitou: maiúsculas, sem espaço nem traço, no máximo 6. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, TAMANHO_DO_CODIGO);
}

export const codigoValido = (codigo: string) =>
  codigo.length === TAMANHO_DO_CODIGO && [...codigo].every((c) => ALFABETO_DO_CODIGO.includes(c));

/* ---------- O placar ---------- */

export type Pontuado = { id: string; apelido: string; pontos: number };

/**
 * A posição de cada um. Empate divide a posição (decisão 8): 3000, 3000, 2000 → 1º, 1º, 3º.
 * A lista volta em ordem de pontos e, no empate, de apelido.
 */
export function classificar<T extends Pontuado>(lista: T[]): (T & { posicao: number })[] {
  const ordenada = [...lista].sort((a, b) => b.pontos - a.pontos || a.apelido.localeCompare(b.apelido, "pt-BR"));
  return ordenada.map((x) => ({ ...x, posicao: 1 + ordenada.filter((o) => o.pontos > x.pontos).length }));
}

export type Movimento = { id: string; apelido: string; antes: number; depois: number; pontos: number; ganhou: number };

/**
 * Quem se mexeu (decisão 13): quem subiu ou desceu de posição, os que mais mudaram primeiro.
 * Quem entrou agora (sem posição antes) não conta.
 */
export function quemSeMexeu(antes: Pontuado[], depois: Pontuado[], maximo = 3): Movimento[] {
  const posAntes = new Map(classificar(antes).map((x) => [x.id, x]));
  return classificar(depois)
    .filter((x) => posAntes.has(x.id) && posAntes.get(x.id)!.posicao !== x.posicao)
    .map((x) => ({
      id: x.id,
      apelido: x.apelido,
      antes: posAntes.get(x.id)!.posicao,
      depois: x.posicao,
      pontos: x.pontos,
      ganhou: x.pontos - posAntes.get(x.id)!.pontos,
    }))
    .sort((a, b) => Math.abs(b.antes - b.depois) - Math.abs(a.antes - a.depois) || a.depois - b.depois)
    .slice(0, maximo);
}

/** "empatada com Pedrão e Kaká" */
export function empatadosCom(lista: Pontuado[], id: string): string[] {
  const eu = lista.find((x) => x.id === id);
  if (!eu) return [];
  return lista.filter((x) => x.id !== id && x.pontos === eu.pontos).map((x) => x.apelido);
}

/** "Pedrão e Kaká" · "Bia, Lu e Mari" */
export function juntarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
