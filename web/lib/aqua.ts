// Aba "Perguntar à Aqua" (ADR-0028): a Aqua responde com o forward pass da rede do projeto,
// a mesma conta do Rodar. Não existe regra à parte para decidir se ela "conhece" a cor.
// Só esta parte e o seletor sabem que a entrada é uma cor (ADR-0028, seção E).

import { corParaEntradas, lerRede, rodar } from "./treino";
import type { Fio, NoDaRede, Pesos } from "./rede";

/** Abaixo de 0,30 ou acima de 0,70 a Aqua responde com certeza; entre os dois, fica em dúvida. */
export const FAIXA_DUVIDA = { de: 0.3, ate: 0.7 } as const;

export type Certeza = "confiante" | "duvida";
export type RespostaAqua = { saida: number; resposta: 0 | 1; certeza: Certeza };

/** Por que a aba não abre (ou null se abre). Basta a rede já ter rodado sem erro uma vez. */
export function motivoParaNaoPerguntar(nodes: NoDaRede[], fios: Fio[], pesos: Pesos, rodou: boolean): string | null {
  if (!rodou) return "Rode a rede primeiro. Clique em Rodar e a Aqua passa a responder com ela.";
  const entrada = nodes.find((n) => n.type === "entrada");
  if (entrada?.type === "entrada" && entrada.data.tipo !== "cor") return "A Aqua só entende a Entrada de cor. Troque a Entrada para Cor.";
  if (!lerRede(nodes, fios, pesos)) return "A montagem tem um problema. Clique em Rodar para ver o que falta.";
  return null;
}

/** Como o Rodar lê a Saída: perto de 1 é a resposta 1, perto de 0 é a resposta 0. */
export function lerSaida(saida: number): RespostaAqua {
  return {
    saida,
    resposta: saida >= 0.5 ? 1 : 0,
    certeza: saida > FAIXA_DUVIDA.de && saida < FAIXA_DUVIDA.ate ? "duvida" : "confiante",
  };
}

/** A cor atravessa a rede do projeto (forward pass) e vira a resposta da Aqua. */
export function perguntarCor(nodes: NoDaRede[], fios: Fio[], pesos: Pesos, cor: string): RespostaAqua | null {
  const lida = lerRede(nodes, fios, pesos);
  if (!lida) return null;
  return lerSaida(rodar(lida.rede, lida.pesos, corParaEntradas(cor)).saida);
}

/** A Entrada do lab com a cor perguntada, só para mostrar a conta: a montagem salva não muda. */
export function comCorPerguntada(nodes: NoDaRede[], cor: string): NoDaRede[] {
  return nodes.map((n) => (n.type === "entrada" ? { ...n, data: { ...n.data, tipo: "cor" as const, cor } } : n));
}
