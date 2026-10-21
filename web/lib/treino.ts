// Treinar (ADR-0024): a mesma rede do Rodar, aprendendo com uma lista de exemplos.
// Uma repetição = passar uma vez por todos os exemplos. Para cada um: rodar (forward),
// medir o erro, voltar a culpa (backward, a retropropagação) e mover cada peso um passinho.
// A conta inteira roda de uma vez e fica gravada; a tela só reproduz a gravação.

import { PESO_LIMITE, limitarPeso, prepararRodada, type EntradaNode, type Fio, type NoDaRede, type Pesos } from "./rede";

/** Uma cor de exemplo e o objetivo dela na Saída (0 ou 1). */
export type Exemplo = { cor: string; objetivo: 0 | 1 };

/** 6 laranjas (1) e 6 azuis (0): a lista que a montagem básica traz pronta. */
export const EXEMPLOS_PRONTOS: Exemplo[] = [
  ...["#FF8C00", "#FFA500", "#FF7F27", "#E8853A", "#F28C28", "#FF9933"].map((cor) => ({ cor, objetivo: 1 as const })),
  ...["#378ADD", "#1E90FF", "#4169E1", "#0077CC", "#5B9BD5", "#2A6FDB"].map((cor) => ({ cor, objetivo: 0 as const })),
];

/**
 * O tamanho do passinho (taxa de aprendizado). O grande é grande de propósito: os pesos dão saltos
 * longos, neurônios apagam de vez e a rede pode travar com o erro alto (em ~4 de 10 sorteios).
 */
export const PASSINHOS = { pequeno: 0.1, medio: 0.5, grande: 15 } as const;
export type Passinho = keyof typeof PASSINHOS;

/* ---------- A rede, do jeito que a conta precisa ---------- */

type Neuronio = { id: string; final: boolean; linhas: { id: string; de: string }[] };

/** A ordem das contas: cada neurônio com as linhas que chegam nele (de onde vem cada uma). */
export type Rede = { entrada: string; neuronios: Neuronio[] };

/** A rede e os pesos que ela usa agora (inclusive os padrão das linhas que o aluno não mexeu). */
export type RedeLida = { rede: Rede; pesos: Pesos };

/**
 * Lê a estrutura da rede a partir da mesma rodada que o Rodar usa, para as duas contas
 * nunca divergirem. Devolve null se a montagem tem erro (o Rodar mostra qual).
 */
export function lerRede(nodes: NoDaRede[], fios: Fio[], pesos: Pesos): RedeLida | null {
  const { rodada } = prepararRodada(nodes, fios, pesos);
  const entrada = nodes.find((n): n is EntradaNode => n.type === "entrada");
  if (!rodada || !entrada) return null;
  const neuronios: Neuronio[] = [];
  const atuais: Pesos = {};
  const porId = new Map<string, Neuronio>();
  for (const p of rodada.passos) {
    if (p.tipo === "termo") {
      let n = porId.get(p.neuronio);
      if (!n) {
        n = { id: p.neuronio, final: false, linhas: [] };
        porId.set(n.id, n);
        neuronios.push(n);
      }
      n.linhas.push({ id: p.linha, de: p.linha.slice(0, p.linha.lastIndexOf("->")) });
      atuais[p.linha] = p.peso;
    } else if (p.tipo === "ativacao") {
      const n = porId.get(p.neuronio);
      if (n) n.final = p.final;
    }
  }
  return { rede: { entrada: entrada.id, neuronios }, pesos: atuais };
}

/** Os ids de todas as linhas da rede, na ordem das contas. */
export function linhasDaRede(rede: Rede): string[] {
  return rede.neuronios.flatMap((n) => n.linhas.map((l) => l.id));
}

/** A cor vira R, G e B de 0 a 1, arredondados como no bloco Entrada. */
export function corParaEntradas(cor: string): number[] {
  return [1, 3, 5].map((i) => Math.round((parseInt(cor.slice(i, i + 2), 16) / 255) * 100) / 100);
}

/* ---------- Forward e backward de um exemplo ---------- */

const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

type Passada = { valores: Map<string, number>; somas: Map<string, number>; saida: number };

/** Forward: a entrada atravessa a rede. ReLU no meio, sigmoide no último neurônio. */
export function rodar(rede: Rede, pesos: Pesos, entradas: number[]): Passada {
  const valores = new Map<string, number>();
  entradas.forEach((v, i) => valores.set(`${rede.entrada}#${i}`, v));
  const somas = new Map<string, number>();
  let saida = 0;
  for (const n of rede.neuronios) {
    let soma = 0;
    for (const l of n.linhas) soma += (valores.get(l.de) ?? 0) * (pesos[l.id] ?? 0);
    const valor = n.final ? sigmoide(soma) : Math.max(0, soma);
    somas.set(n.id, soma);
    valores.set(n.id, valor);
    if (n.final) saida = valor;
  }
  return { valores, somas, saida };
}

/**
 * Backward de um exemplo: quanto cada peso tem de culpa no erro. O ajuste usa o erro ao
 * quadrado, ½·(resposta − objetivo)²; o "gradiente" de cada linha diz para que lado e quanto
 * ela empurrou a resposta errada. Fica separado para o modo debug (ADR-0016) poder mostrar.
 */
export function retropropagar(rede: Rede, pesos: Pesos, entradas: number[], objetivo: number) {
  const passada = rodar(rede, pesos, entradas);
  const culpa = new Map<string, number>(); // derivada do erro em relação à soma de cada neurônio
  const gradientes: Record<string, number> = {};
  for (let k = rede.neuronios.length - 1; k >= 0; k--) {
    const n = rede.neuronios[k];
    const valor = passada.valores.get(n.id) ?? 0;
    const chegou = n.final ? passada.saida - objetivo : (culpa.get(n.id) ?? 0);
    const derivada = n.final ? valor * (1 - valor) : (passada.somas.get(n.id) ?? 0) > 0 ? 1 : 0;
    const delta = chegou * derivada;
    for (const l of n.linhas) {
      gradientes[l.id] = (gradientes[l.id] ?? 0) + delta * (passada.valores.get(l.de) ?? 0);
      // a culpa volta para o neurônio de onde a linha veio (as entradas não guardam culpa)
      if (!l.de.includes("#")) culpa.set(l.de, (culpa.get(l.de) ?? 0) + delta * (pesos[l.id] ?? 0));
    }
  }
  return { saida: passada.saida, erro: Math.abs(objetivo - passada.saida), gradientes };
}

/* ---------- Sorteio com semente ---------- */

/** Números "aleatórios" que se repetem com a mesma semente (mulberry32). */
export function sorteador(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Do zero: pesos sorteados entre −1 e 1, mas não qualquer sorteio. Sem *bias*, se nenhum
 * neurônio do meio acende para uma cor, a soma do último é 0 e a resposta fica presa em 0,50.
 * Então a rede precisa começar com um neurônio "puxando" para cada objetivo (acende mais para
 * os exemplos daquele lado), e as linhas até o último neurônio começam em 0. Com um sorteio
 * qualquer, o treino da montagem básica falhava em ~60% das vezes.
 */
export function sortearPesos(rede: Rede, exemplos: Exemplo[], semente: number): Pesos {
  const entradas = exemplos.map((e) => corParaEntradas(e.cor));
  const final = rede.neuronios.find((n) => n.final);
  const antesDoFinal = new Set(final?.linhas.map((l) => l.de));
  const meio = rede.neuronios.filter((n) => antesDoFinal.has(n.id));
  const lados = [0, 1].filter((c) => exemplos.some((e) => e.objetivo === c));
  // para cada neurônio do meio: quantos exemplos de cada lado o acendem
  const contagem = (pesos: Pesos) => {
    const somas = entradas.map((x) => rodar(rede, pesos, x).somas);
    return meio.map((n) => {
      const acesos = [0, 0];
      exemplos.forEach((e, i) => {
        if ((somas[i].get(n.id) ?? 0) > 0) acesos[e.objetivo]++;
      });
      return acesos;
    });
  };
  let pesos: Pesos = {};
  for (let tentativa = 0; tentativa < 500; tentativa++) {
    const aleatorio = sorteador(semente + tentativa * 7919);
    pesos = Object.fromEntries(linhasDaRede(rede).map((id) => [id, Math.round((aleatorio() * 2 - 1) * 100) / 100]));
    if (meio.length === 0 || lados.length < 2) return pesos;
    const acesos = contagem(pesos);
    if (lados.every((c) => acesos.some((a) => a[c] > a[1 - c]))) break;
  }
  // as linhas até o último neurônio começam em 0: a rede começa chutando 0,50 para tudo, e o
  // primeiro ajuste já dá a cada linha o sinal do lado que o neurônio puxa
  for (const l of final?.linhas ?? []) pesos[l.id] = 0;
  return pesos;
}

/* ---------- Treinar: calcular tudo e gravar ---------- */

export type Quadro = { repeticao: number; erro: number; pesos: Pesos; respostas: number[] };

export type Gravacao = {
  antes: { erro: number; respostas: number[]; pesos: Pesos };
  quadros: Quadro[];
  depois: { erro: number; respostas: number[]; pesos: Pesos };
};

export type OpcoesTreino = {
  rede: Rede;
  pesos: Pesos;
  exemplos: Exemplo[];
  repeticoes: number;
  passinho: Passinho;
  semente?: number;
};

function medir(rede: Rede, pesos: Pesos, entradas: number[][], exemplos: Exemplo[]) {
  const respostas = entradas.map((x) => rodar(rede, pesos, x).saida);
  const erro = respostas.reduce((s, r, i) => s + Math.abs(exemplos[i].objetivo - r), 0) / Math.max(1, respostas.length);
  return { erro, respostas };
}

/** Roda todas as repetições e grava, a cada uma, o erro médio, os pesos e as respostas. */
export function treinar({ rede, pesos: iniciais, exemplos, repeticoes, passinho, semente = 42 }: OpcoesTreino): Gravacao {
  const entradas = exemplos.map((e) => corParaEntradas(e.cor));
  const taxa = PASSINHOS[passinho];
  const aleatorio = sorteador(semente);
  const pesos: Pesos = Object.fromEntries(linhasDaRede(rede).map((id) => [id, iniciais[id] ?? 0]));
  const antes = { ...medir(rede, pesos, entradas, exemplos), pesos: { ...pesos } };
  const quadros: Quadro[] = [];
  const ordem = exemplos.map((_, i) => i);

  for (let r = 1; r <= repeticoes; r++) {
    // a ordem dos exemplos muda a cada repetição, sempre igual para a mesma semente
    for (let i = ordem.length - 1; i > 0; i--) {
      const j = Math.floor(aleatorio() * (i + 1));
      [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    }
    for (const i of ordem) {
      const { gradientes } = retropropagar(rede, pesos, entradas[i], exemplos[i].objetivo);
      for (const [id, g] of Object.entries(gradientes)) {
        pesos[id] = Math.max(-PESO_LIMITE, Math.min(PESO_LIMITE, pesos[id] - taxa * g));
      }
    }
    quadros.push({ repeticao: r, ...medir(rede, pesos, entradas, exemplos), pesos: { ...pesos } });
  }

  const final = Object.fromEntries(Object.entries(pesos).map(([id, w]) => [id, limitarPeso(w)]));
  return { antes, quadros, depois: { ...medir(rede, final, entradas, exemplos), pesos: final } };
}
