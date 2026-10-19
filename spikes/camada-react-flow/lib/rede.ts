import type { Connection, Edge, Node } from "@xyflow/react";

// Medidas do bloco Camada (em pixels do canvas)
export const CAMADA_LARGURA = 120;
export const NEURONIO_TAMANHO = 28;
const TOPO = 64; // espaço do cabeçalho (título + campo de quantidade)
const PASSO = 44; // distância vertical entre neurônios
const BASE = 12;
export const MAX_NEURONIOS = 20;
export const MAX_NUMEROS = 6;
export const PESO_LIMITE = 5;

export type CamadaData = { titulo: string; quantidade: number };
export type SaidaData = { rotulo0: string; cor0: string; rotulo1: string; cor1: string };
export type EntradaData = { tipo: "cor" | "numeros"; cor: string; numeros: { nome: string; valor: number }[] };
export type CamadaNode = Node<CamadaData, "camada">;
export type NeuronioNode = Node<Record<string, never>, "neuronio">;
export type SaidaNode = Node<SaidaData, "saida">;
export type EntradaNode = Node<EntradaData, "entrada">;
export type NoDaRede = CamadaNode | NeuronioNode | SaidaNode | EntradaNode;

/** Fio que o aluno liga: entrada → camada, camada → camada, ou camada → saída. */
export type Fio = Edge;
/** Pesos que o aluno mudou à mão, pelo id da linha. */
export type Pesos = Record<string, number>;

// ids determinísticos: o mesmo valor no servidor e no navegador
let contador = 0;
const novoId = (prefixo: string) => `${prefixo}-${contador++}`;

export function criarCamada(titulo: string, x: number, y: number): CamadaNode {
  return {
    id: novoId("camada"),
    type: "camada",
    position: { x, y },
    data: { titulo, quantidade: 0 },
    style: { width: CAMADA_LARGURA, height: TOPO + BASE },
  };
}

export function criarNeuronio(camadaId: string, yRelativo = Number.MAX_SAFE_INTEGER): NeuronioNode {
  return {
    id: novoId("neuronio"),
    type: "neuronio",
    parentId: camadaId,
    extent: "parent",
    // o y só serve para decidir a ordem; reorganizar() define a posição final
    position: { x: 0, y: yRelativo },
    data: {},
  };
}

export function criarSaida(x: number, y: number): SaidaNode {
  return {
    id: novoId("saida"),
    type: "saida",
    position: { x, y },
    data: { rotulo0: "azul", cor0: "#378ADD", rotulo1: "laranja", cor1: "#E8853A" },
  };
}

export function criarEntrada(x: number, y: number): EntradaNode {
  return {
    id: novoId("entrada"),
    type: "entrada",
    position: { x, y },
    data: {
      tipo: "cor",
      cor: "#ff8c00",
      numeros: [
        { nome: "x1", valor: 1 },
        { nome: "x2", valor: 0 },
      ],
    },
  };
}

export function criarFio(source: string, target: string): Fio {
  return {
    id: `fio:${source}->${target}`,
    source,
    target,
    sourceHandle: "saida",
    targetHandle: "entrada",
    zIndex: 0,
    style: { stroke: "#8E8E93", strokeWidth: 2, strokeDasharray: "6 4" },
  };
}

/** Os números que a Entrada manda para a rede. Cor vira R, G, B de 0 a 1. */
export function valoresDaEntrada(d: EntradaData): { nome: string; valor: number }[] {
  if (d.tipo === "numeros") return d.numeros;
  return (
    [
      ["R", 1],
      ["G", 3],
      ["B", 5],
    ] as const
  ).map(([nome, i]) => ({ nome, valor: Math.round((parseInt(d.cor.slice(i, i + 2), 16) / 255) * 100) / 100 }));
}

/**
 * Empilha os neurônios de cada camada numa coluna, ajusta a altura da camada
 * e garante que cada camada venha antes dos filhos (exigência do React Flow).
 */
export function reorganizar(nodes: NoDaRede[]): NoDaRede[] {
  // só percorre camadas: neurônios cuja camada foi apagada somem junto
  const camadas = nodes.filter((n): n is CamadaNode => n.type === "camada");
  const resultado: NoDaRede[] = nodes.filter((n) => n.type === "saida" || n.type === "entrada");

  for (const camada of camadas) {
    const filhos = neuroniosDe(nodes, camada.id);

    resultado.push({
      ...camada,
      data: { ...camada.data, quantidade: filhos.length },
      style: { ...camada.style, width: CAMADA_LARGURA, height: TOPO + filhos.length * PASSO + BASE },
    });
    filhos.forEach((filho, i) => {
      resultado.push({
        ...filho,
        position: {
          x: (CAMADA_LARGURA - NEURONIO_TAMANHO) / 2,
          y: TOPO + i * PASSO + (PASSO - NEURONIO_TAMANHO) / 2,
        },
      });
    });
  }

  return resultado;
}

/** Neurônios de uma camada, de cima para baixo. */
function neuroniosDe(nodes: NoDaRede[], camadaId: string): NeuronioNode[] {
  return nodes
    .filter((n): n is NeuronioNode => n.type === "neuronio" && n.parentId === camadaId)
    .sort((a, b) => a.position.y - b.position.y);
}

/** Ajusta a camada para ter exatamente `quantidade` neurônios. */
export function definirQuantidade(nodes: NoDaRede[], camadaId: string, quantidade: number): NoDaRede[] {
  const alvo = Math.max(0, Math.min(MAX_NEURONIOS, Math.floor(quantidade)));
  const filhos = neuroniosDe(nodes, camadaId);

  if (filhos.length < alvo) {
    const novos = Array.from({ length: alvo - filhos.length }, () => criarNeuronio(camadaId));
    return reorganizar([...nodes, ...novos]);
  }
  const remover = new Set(filhos.slice(alvo).map((n) => n.id));
  return reorganizar(nodes.filter((n) => !remover.has(n.id)));
}

/* ---------- Fios ---------- */

/** Só os fios cujas duas pontas ainda existem. */
export function fiosValidos(nodes: NoDaRede[], fios: Fio[]): Fio[] {
  const ids = new Set(nodes.map((n) => n.id));
  return fios.filter((f) => ids.has(f.source) && ids.has(f.target));
}

/** Um fio sai da Entrada ou de uma camada e chega numa camada ou na Saída, sem voltar para trás. */
export function fioPermitido(nodes: NoDaRede[], fios: Fio[], c: Connection | Edge): boolean {
  const origem = nodes.find((n) => n.id === c.source);
  const destino = nodes.find((n) => n.id === c.target);
  if (!origem || !destino || c.source === c.target) return false;
  if (origem.type !== "camada" && origem.type !== "entrada") return false;
  if (destino.type !== "camada" && destino.type !== "saida") return false;
  if (origem.type === "entrada" && destino.type === "saida") return false;

  // não pode fechar um ciclo: o destino não pode já levar até a origem
  const proximo = new Map(fios.map((f) => [f.source, f.target]));
  let atual: string | undefined = c.target;
  while (atual) {
    if (atual === c.source) return false;
    atual = proximo.get(atual);
  }
  return true;
}

/** Liga o fio. Cada bloco tem um fio de saída e recebe um fio só: o novo substitui o antigo. */
export function ligarFio(fios: Fio[], c: Connection): Fio[] {
  const resto = fios.filter((f) => f.source !== c.source && f.target !== c.target);
  return [...resto, criarFio(c.source, c.target)];
}

/* ---------- Pesos ---------- */

/** De onde sai cada linha: um número da Entrada ou um neurônio. */
type Origem = { no: string; handle?: string; chave: string; nome: string };

function origensDe(nodes: NoDaRede[], id: string): Origem[] {
  const no = nodes.find((n) => n.id === id);
  if (no?.type === "entrada") {
    return valoresDaEntrada(no.data).map((v, i) => ({ no: id, handle: `v${i}`, chave: `${id}#${i}`, nome: `Entrada ${v.nome}` }));
  }
  const titulo = no?.type === "camada" ? no.data.titulo : "Camada";
  return neuroniosDe(nodes, id).map((n, i) => ({ no: n.id, chave: n.id, nome: `${titulo} · neurônio ${i + 1}` }));
}

/** Peso inicial "aleatório" mas sempre igual para o mesmo par, entre -1 e 1. */
function pesoInicial(chave: string): number {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.round((((h >>> 0) / 4294967295) * 2 - 1) * 100) / 100;
}

const linhaId = (o: Origem, b: string) => `${o.chave}->${b}`;
const pesoDe = (pesos: Pesos, o: Origem, b: string) => pesos[linhaId(o, b)] ?? pesoInicial(o.chave + b);

export function limitarPeso(w: number): number {
  return Math.max(-PESO_LIMITE, Math.min(PESO_LIMITE, Math.round(w * 100) / 100));
}

/* ---------- Rodar: as contas, uma por vez ---------- */

/** Erro impede a rodada; aviso só avisa e a rodada continua. */
export type Erro = { no: string | null; mensagem: string; tipo?: "erro" | "aviso" };

export type Passo =
  | { tipo: "termo"; neuronio: string; linha: string; nome: string; entrada: number; peso: number }
  | { tipo: "ativacao"; neuronio: string; soma: number; valor: number; final: boolean }
  | { tipo: "saida"; saida: string; valor: number; resposta: 0 | 1 };

export type Rodada = { passos: Passo[]; nomes: Map<string, string> };

const relu = (x: number) => Math.max(0, x);
const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Confere a montagem e lista todas as contas na ordem em que acontecem:
 * para cada neurônio, uma multiplicação por linha e depois a ativação.
 * Camadas do meio usam ReLU (negativo vira 0); a ligada à Saída espreme
 * a soma entre 0 e 1 (sigmoide).
 */
export function prepararRodada(nodes: NoDaRede[], fios: Fio[], pesos: Pesos): { rodada: Rodada | null; erros: Erro[] } {
  const erros: Erro[] = [];
  const entradas = nodes.filter((n): n is EntradaNode => n.type === "entrada");
  if (entradas.length === 0) return { rodada: null, erros: [{ no: null, mensagem: "Coloque um bloco Entrada e ligue-o a uma Camada." }] };
  entradas.slice(1).forEach((e) => erros.push({ no: e.id, mensagem: "Use só um bloco Entrada por montagem." }));

  const entrada = entradas[0];
  if (valoresDaEntrada(entrada.data).length === 0) erros.push({ no: entrada.id, mensagem: "A Entrada não tem nenhum número." });

  // segue os fios a partir da Entrada
  const tipo = new Map(nodes.map((n) => [n.id, n.type]));
  const proximo = new Map(fios.map((f) => [f.source, f.target]));
  const caminho: string[] = [];
  let atual = proximo.get(entrada.id);
  if (!atual) erros.push({ no: entrada.id, mensagem: "Ligue a Entrada a uma Camada." });
  while (atual && tipo.get(atual) === "camada") {
    caminho.push(atual);
    atual = proximo.get(atual);
  }
  const saidaId = atual && tipo.get(atual) === "saida" ? atual : null;
  const titulo = (id: string) => (nodes.find((n) => n.id === id) as CamadaNode).data.titulo;

  for (const c of nodes.filter((n): n is CamadaNode => n.type === "camada")) {
    // camada solta não trava a rodada: fica de fora das contas, com um aviso
    if (!caminho.includes(c.id)) {
      erros.push({ no: c.id, tipo: "aviso", mensagem: `${c.data.titulo} não recebe nada da Entrada e ficou de fora das contas.` });
    }
  }
  for (const id of caminho) {
    if (neuroniosDe(nodes, id).length === 0) erros.push({ no: id, mensagem: `${titulo(id)} está vazia.` });
  }
  const ultima = caminho.at(-1);
  if (ultima && !saidaId) erros.push({ no: ultima, mensagem: `Ligue ${titulo(ultima)} a uma Saída.` });
  if (ultima && saidaId && neuroniosDe(nodes, ultima).length !== 1) {
    erros.push({ no: ultima, mensagem: "A camada ligada à Saída precisa ter 1 neurônio." });
  }
  for (const s of nodes.filter((n) => n.type === "saida")) {
    if (s.id !== saidaId) erros.push({ no: s.id, mensagem: "Esta Saída não está ligada a nenhuma camada." });
  }
  if (erros.some((e) => e.tipo !== "aviso") || !ultima || !saidaId) return { rodada: null, erros };

  const valores = new Map<string, number>();
  valoresDaEntrada(entrada.data).forEach((v, i) => valores.set(`${entrada.id}#${i}`, v.valor));
  const passos: Passo[] = [];
  const nomes = new Map<string, string>();
  let anterior = entrada.id;

  caminho.forEach((camadaId, k) => {
    const final = k === caminho.length - 1;
    const origens = origensDe(nodes, anterior);
    neuroniosDe(nodes, camadaId).forEach((n, i) => {
      nomes.set(n.id, `${titulo(camadaId)} · neurônio ${i + 1}`);
      let soma = 0;
      for (const o of origens) {
        const e = valores.get(o.chave) ?? 0;
        const peso = pesoDe(pesos, o, n.id);
        soma += e * peso;
        passos.push({ tipo: "termo", neuronio: n.id, linha: linhaId(o, n.id), nome: o.nome, entrada: e, peso });
      }
      const valor = final ? sigmoide(soma) : relu(soma);
      valores.set(n.id, valor);
      passos.push({ tipo: "ativacao", neuronio: n.id, soma, valor, final });
    });
    anterior = camadaId;
  });

  const valorFinal = valores.get(neuroniosDe(nodes, ultima)[0].id) ?? 0;
  passos.push({ tipo: "saida", saida: saidaId, valor: valorFinal, resposta: valorFinal >= 0.5 ? 1 : 0 });
  return { rodada: { passos, nomes }, erros };
}

/** O que já aparece na tela quando a rodada está no passo `atual`. */
export type Vista = {
  valores: Map<string, number>;
  saidas: Map<string, { valor: number; resposta: 0 | 1 }>;
  linhaAgora: string | null;
  linhasFeitas: Set<string>;
  neuronioAgora: string | null;
};

export function vistaDaRodada(r: Rodada, atual: number): Vista {
  const vista: Vista = { valores: new Map(), saidas: new Map(), linhaAgora: null, linhasFeitas: new Set(), neuronioAgora: null };
  r.passos.slice(0, atual + 1).forEach((p, i) => {
    if (p.tipo === "termo") {
      if (i === atual) vista.linhaAgora = p.linha;
      else vista.linhasFeitas.add(p.linha);
    }
    if (p.tipo === "ativacao") vista.valores.set(p.neuronio, p.valor);
    if (p.tipo === "saida") vista.saidas.set(p.saida, { valor: p.valor, resposta: p.resposta });
  });
  const agora = r.passos[atual];
  vista.neuronioAgora = agora && agora.tipo !== "saida" ? agora.neuronio : null;
  return vista;
}

/* ---------- Linhas desenhadas ---------- */

export type EstadoLinha = "normal" | "agora" | "feita" | "apagada";

/**
 * Cada fio que chega numa camada vira as linhas de todos os números/neurônios
 * de um lado com todos os neurônios do outro. Cada linha leva o seu peso.
 */
export function linhas(nodes: NoDaRede[], fios: Fio[], pesos: Pesos, editando: string | null, vista: Vista | null): Edge[] {
  const edges: Edge[] = [];
  for (const fio of fios) {
    const destino = nodes.find((n) => n.id === fio.target);
    if (destino?.type !== "camada") continue;
    const origens = origensDe(nodes, fio.source);
    const para = neuroniosDe(nodes, fio.target);
    origens.forEach((o, i) => {
      for (const b of para) {
        const id = linhaId(o, b.id);
        const estado: EstadoLinha = !vista
          ? "normal"
          : vista.linhaAgora === id
            ? "agora"
            : vista.linhasFeitas.has(id)
              ? "feita"
              : "apagada";
        edges.push({
          id,
          source: o.no,
          sourceHandle: o.handle,
          target: b.id,
          type: "peso",
          selectable: false,
          zIndex: estado === "agora" ? 2 : 1,
          // a posição do número na linha varia por origem, para os números não se encavalarem
          data: { peso: pesoDe(pesos, o, b.id), editando: editando === id, posicao: 0.22 + (0.5 * i) / Math.max(1, origens.length - 1), estado },
        });
      }
    });
  }
  return edges;
}

/** Encontra a camada que contém um ponto do canvas. */
export function camadaNoPonto(nodes: NoDaRede[], x: number, y: number): CamadaNode | undefined {
  return nodes.find((n): n is CamadaNode => {
    if (n.type !== "camada") return false;
    const w = Number(n.style?.width ?? CAMADA_LARGURA);
    const h = Number(n.style?.height ?? 0);
    return x >= n.position.x && x <= n.position.x + w && y >= n.position.y && y <= n.position.y + h;
  });
}

/** 2.28 → "2,28"; -2 → "−2,00" */
export function formatar(n: number): string {
  return (n < 0 ? "−" : "") + Math.abs(n).toFixed(2).replace(".", ",");
}
