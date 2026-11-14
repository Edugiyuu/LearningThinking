// Quiz ao vivo (ADR-0034): a rede das perguntas. Tem sempre o formato da montagem básica do lab
// (3 entradas R G B → 2 neurônios com ReLU → 1 Saída com sigmoide) e é calculada com a mesma
// conta do lab (`rodar` e `retropropagar` de lib/treino.ts), para os números baterem.

import { retropropagar, rodar, type Rede } from "../treino";
import type { Pesos } from "../rede";
import { sortearEntrada, sortearPeso, type Aleatorio } from "./numeros";

export const CANAIS = ["R", "G", "B"] as const;
export type NeuronioId = "n1" | "n2" | "s";
export const MEIO = ["n1", "n2"] as const;

/** Os ids das linhas, iguais aos do lab: "e#0->n1" (R → neurônio 1) e "n1->s" (neurônio 1 → Saída). */
export const linhaEntrada = (canal: number, neuronio: "n1" | "n2") => `e#${canal}->${neuronio}`;
export const linhaSaida = (neuronio: "n1" | "n2") => `${neuronio}->s`;
export const LINHAS = [...MEIO.flatMap((n) => [0, 1, 2].map((c) => linhaEntrada(c, n))), ...MEIO.map(linhaSaida)];

/** A rede no formato que a conta do lab usa. */
export const REDE: Rede = {
  entrada: "e",
  neuronios: [
    ...MEIO.map((n) => ({ id: n, final: false, linhas: [0, 1, 2].map((c) => ({ id: linhaEntrada(c, n), de: `e#${c}` })) })),
    { id: "s", final: true, linhas: MEIO.map((n) => ({ id: linhaSaida(n), de: n })) },
  ],
};

export const nomeNeuronio = (n: NeuronioId) => (n === "s" ? "Saída" : n === "n1" ? "neurônio 1" : "neurônio 2");

/** Como a linha aparece no texto: "R → neurônio 1", "neurônio 2 → Saída". */
export function nomeLinha(id: string): string {
  const [de, para] = id.split("->");
  const origem = de.startsWith("e#") ? CANAIS[Number(de.slice(2))] : nomeNeuronio(de as NeuronioId);
  return `${origem} → ${nomeNeuronio(para as NeuronioId)}`;
}

/* ---------- Cores com nome ---------- */

export type CorNomeada = { nome: string; rgb: [number, number, number] };

/** Cores com R, G e B só de 0 · 0,2 · 0,5 · 0,8 · 1, para as contas darem de cabeça. */
export const CORES: CorNomeada[] = [
  { nome: "vermelho", rgb: [1, 0, 0] },
  { nome: "verde", rgb: [0, 1, 0] },
  { nome: "azul", rgb: [0, 0, 1] },
  { nome: "amarelo", rgb: [1, 0.8, 0] },
  { nome: "laranja", rgb: [1, 0.5, 0] },
  { nome: "roxo", rgb: [0.5, 0, 1] },
  { nome: "rosa", rgb: [1, 0.5, 0.8] },
  { nome: "ciano", rgb: [0, 0.8, 1] },
  { nome: "branco", rgb: [1, 1, 1] },
  { nome: "cinza", rgb: [0.5, 0.5, 0.5] },
  { nome: "marrom", rgb: [0.5, 0.2, 0] },
  { nome: "lilás", rgb: [0.8, 0.5, 1] },
  { nome: "verde-limão", rgb: [0.5, 1, 0] },
  { nome: "azul-claro", rgb: [0.5, 0.8, 1] },
  { nome: "vinho", rgb: [0.5, 0, 0.2] },
];

/** R, G e B de 0 a 1 viram a cor (#rrggbb). `corParaEntradas` do lab devolve os mesmos números. */
export function corDasEntradas(entradas: readonly number[]): string {
  return `#${entradas.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

/* ---------- A rede sorteada ---------- */

export type RedeQuiz = {
  entradas: [number, number, number];
  cor: string;
  /** o nome, quando a cor é uma das CORES */
  nome?: string;
  pesos: Pesos;
};

/**
 * Sorteia uma rede: entradas e pesos com 2 casas (0,36 · −0,61), para os números não serem
 * sempre redondos. Com `cor`, usa essa cor com nome (a dica do verde).
 */
export function sortearRede(r: Aleatorio, cor?: CorNomeada): RedeQuiz {
  const entradas = cor ? ([...cor.rgb] as [number, number, number]) : sortearEntradas(r);
  return {
    entradas,
    cor: corDasEntradas(entradas),
    nome: cor?.nome,
    pesos: Object.fromEntries(LINHAS.map((id) => [id, sortearPeso(r)])),
  };
}

/** Uma cor qualquer, sem nome: R, G e B com 2 casas. */
export function sortearEntradas(r: Aleatorio): [number, number, number] {
  return [sortearEntrada(r), sortearEntrada(r), sortearEntrada(r)];
}

export type Passada = {
  /** a soma de cada neurônio, antes da ReLU ou da sigmoide */
  somas: Record<NeuronioId, number>;
  /** o que cada neurônio passa adiante (depois da ReLU; na Saída, depois da sigmoide) */
  valores: Record<NeuronioId, number>;
  saida: number;
};

/** O forward pass, com a conta do lab. */
export function passar(rede: RedeQuiz): Passada {
  const p = rodar(REDE, rede.pesos, rede.entradas);
  const ids: NeuronioId[] = ["n1", "n2", "s"];
  return {
    somas: Object.fromEntries(ids.map((n) => [n, p.somas.get(n) ?? 0])) as Record<NeuronioId, number>,
    valores: Object.fromEntries(ids.map((n) => [n, p.valores.get(n) ?? 0])) as Record<NeuronioId, number>,
    saida: p.saida,
  };
}

/** O backward pass, com a conta do lab: a culpa (gradiente) de cada linha. */
export function culpas(rede: RedeQuiz, objetivo: 0 | 1): Record<string, number> {
  return retropropagar(REDE, rede.pesos, rede.entradas, objetivo).gradientes;
}
