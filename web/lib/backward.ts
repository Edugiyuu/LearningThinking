// Backward pass passo a passo (ADR-0025): a culpa volta da Saída até a Entrada, uma conta
// de cada vez, como o Rodar faz com a ida. Só calcula; a tela decide se mostra (Mostrar)
// ou se aplica os pesos do fim (Salvar).

import { PESO_LIMITE, limitarPeso, type Pesos } from "./rede";
import { PASSINHOS, rodar, type Rede } from "./treino";

/** O que acontece com a linha: + ajudou e fica mais forte, − atrapalhou e fica mais fraca, = não fez nada. */
export type Sinal = "+" | "-" | "=";

export type PassoVolta =
  /** A resposta comparada com o objetivo da Saída. */
  | { tipo: "erro"; resposta: number; objetivo: number; erro: number }
  /**
   * A culpa chega num neurônio. No último, ela passa pela sigmoide (× inclinação). Num do meio,
   * ela vem de cada linha que sai dele (culpa × peso), e para ali se ele passou 0 (ReLU).
   */
  | { tipo: "culpa-neuronio"; neuronio: string; final: boolean; chegou: number; inclinacao: number; culpa: number; apagado: boolean }
  /** A culpa de uma linha = culpa do neurônio × o que passou nela. O peso anda um passinho contra ela. */
  | {
      tipo: "culpa-linha";
      linha: string;
      de: string;
      neuronio: string;
      culpaNeuronio: number;
      passou: number;
      culpa: number;
      antes: number;
      /** Para onde o peso andaria, sem arredondar (a lupa mostra). */
      depois: number;
      /** O que o Salvar grava (pesoSalvo): 2 casas, e anda pelo menos 0,01 se a linha mudou. */
      salvo: number;
      sinal: Sinal;
    }
  /** Os pesos do Salvar e a resposta rodando de novo com eles. */
  | { tipo: "fim"; pesos: Pesos; objetivo: number; respostaAntes: number; respostaDepois: number; erroAntes: number; erroDepois: number };

export type OpcoesVolta = { rede: Rede; pesos: Pesos; entradas: number[]; objetivo: number; passinho?: number };

/**
 * O que o Salvar grava: 2 casas e dentro de ±5, como na edição à mão. Se a linha mudou
 * (+ ou −) mas o passinho é menor que 0,01, o peso anda 0,01 na direção da mudança, para
 * o aluno ver que ela mudou (0,50 → 0,505 grava 0,51; ADR-0025).
 */
export function pesoSalvo(antes: number, depois: number): number {
  const salvo = limitarPeso(depois);
  if (depois === antes || salvo !== limitarPeso(antes)) return salvo;
  return limitarPeso(limitarPeso(antes) + 0.01 * Math.sign(depois - antes));
}

/** + se o tamanho do peso cresce, − se diminui, = se a culpa é zero (ADR-0025). */
export function sinalDaMudanca(antes: number, depois: number, culpa: number): Sinal {
  if (culpa === 0 || antes === depois) return "=";
  return Math.abs(depois) > Math.abs(antes) ? "+" : "-";
}

/**
 * A ordem da volta: da camada mais perto da Saída para a mais perto da Entrada. Dentro da mesma
 * camada, a ordem do Rodar (de cima para baixo).
 */
function porCamadaDeTrasParaFrente(rede: Rede) {
  const profundidade = new Map<string, number>();
  for (const n of rede.neuronios) {
    const fontes = n.linhas.map((l) => profundidade.get(l.de) ?? 0);
    profundidade.set(n.id, 1 + Math.max(0, ...fontes));
  }
  return rede.neuronios
    .map((n, i) => ({ n, i, p: profundidade.get(n.id) ?? 0 }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map(({ n }) => n);
}

export function voltarCulpa({ rede, pesos, entradas, objetivo, passinho = PASSINHOS.medio }: OpcoesVolta): PassoVolta[] {
  const ida = rodar(rede, pesos, entradas);
  const passos: PassoVolta[] = [{ tipo: "erro", resposta: ida.saida, objetivo, erro: Math.abs(objetivo - ida.saida) }];
  const culpas = new Map<string, number>();
  const novos: Pesos = { ...pesos };

  for (const n of porCamadaDeTrasParaFrente(rede)) {
    const valor = ida.valores.get(n.id) ?? 0;
    let chegou: number;
    let inclinacao: number;
    if (n.final) {
      chegou = ida.saida - objetivo;
      inclinacao = valor * (1 - valor);
    } else {
      // a culpa vem de cada linha que sai deste neurônio: culpa de lá × peso da linha
      chegou = 0;
      for (const m of rede.neuronios) {
        for (const l of m.linhas) if (l.de === n.id) chegou += (culpas.get(m.id) ?? 0) * (pesos[l.id] ?? 0);
      }
      inclinacao = (ida.somas.get(n.id) ?? 0) > 0 ? 1 : 0;
    }
    const culpa = chegou * inclinacao;
    culpas.set(n.id, culpa);
    passos.push({ tipo: "culpa-neuronio", neuronio: n.id, final: n.final, chegou, inclinacao, culpa, apagado: !n.final && inclinacao === 0 });

    for (const l of n.linhas) {
      const passou = ida.valores.get(l.de) ?? 0;
      const culpaLinha = culpa * passou;
      const antes = pesos[l.id] ?? 0;
      const depois = Math.max(-PESO_LIMITE, Math.min(PESO_LIMITE, antes - passinho * culpaLinha));
      const salvo = pesoSalvo(antes, depois);
      novos[l.id] = salvo;
      passos.push({
        tipo: "culpa-linha",
        linha: l.id,
        de: l.de,
        neuronio: n.id,
        culpaNeuronio: culpa,
        passou,
        culpa: culpaLinha,
        antes,
        depois,
        salvo,
        sinal: sinalDaMudanca(antes, depois, culpaLinha),
      });
    }
  }

  const depois = rodar(rede, novos, entradas).saida;
  passos.push({
    tipo: "fim",
    pesos: novos,
    objetivo,
    respostaAntes: ida.saida,
    respostaDepois: depois,
    erroAntes: Math.abs(objetivo - ida.saida),
    erroDepois: Math.abs(objetivo - depois),
  });
  return passos;
}

/* ---------- O que a volta já mostrou na tela ---------- */

export type LinhaDaVolta = Extract<PassoVolta, { tipo: "culpa-linha" }>;

/** O que aparece no canvas quando a volta está no passo `atual` (como a vistaDaRodada da ida). */
export type VistaVolta = {
  /** A linha da vez, com o tamanho da bolinha de culpa (0 a 1, comparado com a maior culpa da volta). */
  linhaAgora: (LinhaDaVolta & { passo: number; tamanho: number }) | null;
  /** O sinal das linhas por onde a culpa já passou. */
  sinais: Map<string, Sinal>;
  /** Neurônios que passaram 0: a culpa para neles. */
  parados: Set<string>;
  neuronioAgora: string | null;
  erro: Extract<PassoVolta, { tipo: "erro" }> | null;
  fim: Extract<PassoVolta, { tipo: "fim" }> | null;
};

export function vistaDaVolta(passos: PassoVolta[], atual: number): VistaVolta {
  const maior = Math.max(0, ...passos.map((p) => (p.tipo === "culpa-linha" ? Math.abs(p.culpa) : 0)));
  const vista: VistaVolta = { linhaAgora: null, sinais: new Map(), parados: new Set(), neuronioAgora: null, erro: null, fim: null };
  passos.slice(0, atual + 1).forEach((p, i) => {
    if (p.tipo === "erro") vista.erro = p;
    if (p.tipo === "fim") vista.fim = p;
    if (p.tipo === "culpa-neuronio" && p.apagado) vista.parados.add(p.neuronio);
    if (p.tipo === "culpa-linha") {
      vista.sinais.set(p.linha, p.sinal);
      if (i === atual) vista.linhaAgora = { ...p, passo: i, tamanho: maior > 0 ? Math.abs(p.culpa) / maior : 0 };
    }
  });
  const agora = passos[atual];
  vista.neuronioAgora = agora?.tipo === "culpa-neuronio" || agora?.tipo === "culpa-linha" ? agora.neuronio : null;
  return vista;
}

/** A culpa é pequena: 3 casas (0,016), sem o sinal, porque quem diz o lado é o + − =. */
export function formatarCulpa(n: number): string {
  // como no formatar: 0,0155 vira 0,01549999… no computador e arredondaria para baixo
  const milesimos = Math.round(Number((Math.abs(n) * 1000).toPrecision(12)));
  // culpa existe mas some com 3 casas: dizer que é pequena, em vez de mostrar 0,000
  if (milesimos === 0 && n !== 0) return "menos de 0,001";
  return (milesimos / 1000).toFixed(3).replace(".", ",");
}
