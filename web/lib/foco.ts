// Modo Foco (ADR-0026): o que o quadro mostra em cada passo do Rodar e a conta armada do
// "ver conta". Só calcula; as telas ficam em components/laboratorio/QuadroFoco.tsx.

import { formatarCulpa, type PassoVolta } from "./backward";
import type { Rodada } from "./rede";

/* ---------- O quadro da ida ---------- */

/** Uma linha que chega no neurônio: o que passou × peso = a parte dela na soma. */
export type ParteDaSoma = { linha: string; nome: string; entrada: number; peso: number; parte: number; agora: boolean };

export type QuadroIda =
  /** Uma multiplicação (agora = a linha da vez) ou a ativação do neurônio (nenhuma linha acesa). */
  | { tipo: "neuronio"; neuronio: string; final: boolean; partes: ParteDaSoma[]; soma: number; valor: number; ativando: boolean }
  | { tipo: "saida"; saida: string; valor: number; resposta: 0 | 1 };

/** Mostra tudo: todas as linhas que chegam no neurônio e a soma inteira, com a linha da vez acesa. */
export function quadroDaIda(rodada: Rodada, atual: number): QuadroIda | null {
  const p = rodada.passos[atual];
  if (!p) return null;
  if (p.tipo === "saida") return { tipo: "saida", saida: p.saida, valor: p.valor, resposta: p.resposta };
  const partes: ParteDaSoma[] = [];
  let ativacao: Extract<Rodada["passos"][number], { tipo: "ativacao" }> | undefined;
  rodada.passos.forEach((q, i) => {
    if (q.tipo === "termo" && q.neuronio === p.neuronio) {
      partes.push({ linha: q.linha, nome: q.nome, entrada: q.entrada, peso: q.peso, parte: q.entrada * q.peso, agora: i === atual });
    }
    if (q.tipo === "ativacao" && q.neuronio === p.neuronio) ativacao = q;
  });
  if (!ativacao) return null;
  return { tipo: "neuronio", neuronio: p.neuronio, final: ativacao.final, partes, soma: ativacao.soma, valor: ativacao.valor, ativando: p.tipo === "ativacao" };
}

/* ---------- O quadro da volta ---------- */

/** Para onde a resposta vai se o peso andar: 1 sobe, −1 desce, 0 não muda. */
type Direcao = 1 | -1 | 0;

/** O teste "e se?": o peso subindo e descendo; a linha que deixa o erro menor fica acesa. */
export type EseLinha = { peso: number; resposta: Direcao; melhora: boolean };

export type QuadroVolta =
  | { tipo: "erro"; resposta: number; objetivo: number; erro: number }
  | { tipo: "neuronio"; neuronio: string; final: boolean; chegou: number; inclinacao: number; culpa: number; apagado: boolean }
  | {
      tipo: "linha";
      linha: string;
      de: string;
      neuronio: string;
      final: boolean;
      /** De onde vem a culpa do neurônio: no último, o erro com sinal; no meio, a culpa que chegou. */
      chegou: number;
      inclinacao: number;
      culpaNeuronio: number;
      passou: number;
      culpa: number;
      antes: number;
      salvo: number;
      /** O que a Saída respondeu e o certo, para o desenho da linha. */
      resposta: number;
      objetivo: number;
      /** null quando a culpa é zero: o peso fica igual. */
      eSe: { sobe: EseLinha; desce: EseLinha } | null;
    }
  | { tipo: "fim"; objetivo: number; respostaAntes: number; respostaDepois: number; erroAntes: number; erroDepois: number };

export function quadroDaVolta(passos: PassoVolta[], atual: number): QuadroVolta | null {
  const p = passos[atual];
  if (!p) return null;
  if (p.tipo === "erro") return { tipo: "erro", resposta: p.resposta, objetivo: p.objetivo, erro: p.erro };
  if (p.tipo === "fim") {
    const { objetivo, respostaAntes, respostaDepois, erroAntes, erroDepois } = p;
    return { tipo: "fim", objetivo, respostaAntes, respostaDepois, erroAntes, erroDepois };
  }
  if (p.tipo === "culpa-neuronio") {
    const { neuronio, final, chegou, inclinacao, culpa, apagado } = p;
    return { tipo: "neuronio", neuronio, final, chegou, inclinacao, culpa, apagado };
  }
  const n = passos.find((q): q is Extract<PassoVolta, { tipo: "culpa-neuronio" }> => q.tipo === "culpa-neuronio" && q.neuronio === p.neuronio);
  const erro = passos.find((q): q is Extract<PassoVolta, { tipo: "erro" }> => q.tipo === "erro");
  if (!n || !erro) return null;
  return {
    tipo: "linha",
    linha: p.linha,
    de: p.de,
    neuronio: p.neuronio,
    final: n.final,
    chegou: n.chegou,
    inclinacao: n.inclinacao,
    culpaNeuronio: p.culpaNeuronio,
    passou: p.passou,
    culpa: p.culpa,
    antes: p.antes,
    salvo: p.salvo,
    resposta: erro.resposta,
    objetivo: erro.objetivo,
    eSe: eSe(p.culpa, p.antes, p.salvo, erro.resposta - erro.objetivo),
  };
}

/**
 * Culpa + quer dizer "se o peso subir, o erro aumenta"; culpa −, "se subir, diminui".
 * Para onde a resposta vai junto com o peso: a culpa é (resposta − objetivo) × o quanto a resposta
 * muda com o peso, então o sinal da culpa vezes o lado do erro dá o lado da resposta.
 */
function eSe(culpa: number, antes: number, salvo: number, lado: number): { sobe: EseLinha; desce: EseLinha } | null {
  if (culpa === 0 || salvo === antes) return null;
  const anda = Math.abs(salvo - antes);
  const resposta = (Math.sign(culpa) * Math.sign(lado)) as Direcao;
  return {
    sobe: { peso: antes + anda, resposta, melhora: culpa < 0 },
    desce: { peso: antes - anda, resposta: -resposta as Direcao, melhora: culpa > 0 },
  };
}

/** A culpa com o sinal, que diz a direção (ADR-0026): +0,125 · −0,050 · "menos de 0,001 (+)". */
export function culpaComSinal(n: number): string {
  const sinal = n > 0 ? "+" : n < 0 ? "−" : "";
  const texto = formatarCulpa(n);
  return texto.startsWith("menos") ? `${texto} (${sinal})` : `${sinal}${texto}`;
}

/* ---------- Ver conta: a conta armada, número por número ---------- */

/** Uma linha da conta armada: algarismos alinhados à direita. Destaque e apagado contam da direita (0 = unidade). */
export type LinhaArmada = { op?: "×" | "+"; digitos: string; destaque?: number[]; apagados?: number[] };

export type TelaConta = { titulo: string; fala: string; corpo: CorpoConta };

export type CorpoConta =
  | { tipo: "sinal"; a: string; b: string }
  | { tipo: "tirar"; itens: { de: string; para: string; casas: number }[] }
  | { tipo: "armada"; linhas: LinhaArmada[]; barras: number[] }
  | { tipo: "virgula"; casas: number[]; resultado: string; /** Com as casas que o lab mostra (2,0 → 2,00). */ fica: string }
  | { tipo: "arredonda"; de: string; para: string }
  | { tipo: "sinalVolta"; regra: string; resultado: string }
  | { tipo: "zero"; resultado: string };

type Numero = { negativo: boolean; inteiro: string; casas: number; texto: string };

/** "−0,50" → 5 com 1 casa: o zero do fim depois da vírgula não muda o número. */
function lerNumero(texto: string): Numero {
  const negativo = texto.startsWith("−") || texto.startsWith("-");
  const sem = texto.replace(/^[−+-]/, "");
  const [ip, fp = ""] = sem.split(",");
  const frac = fp.replace(/0+$/, "");
  const inteiro = (ip + frac).replace(/^0+(?=\d)/, "");
  return { negativo, inteiro, casas: frac.length, texto: sem };
}

/** Escreve o inteiro com `casas` casas decimais, como no lab: 1250 e 4 casas → 0,1250. */
function comVirgula(inteiro: string, casas: number): string {
  if (casas === 0) return inteiro;
  const d = inteiro.padStart(casas + 1, "0");
  return `${d.slice(0, -casas)},${d.slice(-casas)}`;
}

/** Arredonda a conta para `casas` casas, sem passar pelo número do computador (0,1250 → 0,13 com 2). */
function arredondar(inteiro: string, casasDele: number, casas: number): string {
  if (casasDele <= casas) return comVirgula(inteiro + "0".repeat(casas - casasDele), casas);
  const corte = casasDele - casas;
  let base = BigInt(inteiro.slice(0, Math.max(0, inteiro.length - corte)) || "0");
  const resto = inteiro.slice(-corte).padStart(corte, "0");
  if (Number(resto[0]) >= 5) base += BigInt(1);
  return comVirgula(base.toString(), casas);
}

const nCasas = (n: number) => (n === 1 ? "1 casa" : `${n} casas`);

/**
 * A conta armada de `a × b` (os números como aparecem na tela, ex.: "4,00" e "−0,50"), do jeito da
 * escola (ADR-0026): o sinal fica de lado, tira a vírgula, multiplica algarismo por algarismo da
 * direita para a esquerda (com o "sobe"), soma as linhas, põe a vírgula de volta e, no fim, o sinal.
 * `casas` é com quantas casas o lab mostra o resultado (2 nos pesos, 3 na culpa).
 */
export function contaArmada(a: string, b: string, casas: number): TelaConta[] {
  const x = lerNumero(a);
  const y = lerNumero(b);
  const negativo = x.negativo !== y.negativo;
  const telas: TelaConta[] = [];
  const temSinal = x.negativo || y.negativo;

  if (temSinal) {
    telas.push({
      titulo: "O sinal fica de lado",
      fala: `Primeiro, a conta sem o sinal: ${x.texto} × ${y.texto}. O sinal volta no fim.`,
      corpo: { tipo: "sinal", a, b },
    });
  }

  if (x.inteiro === "0" || y.inteiro === "0") {
    const zero = comVirgula("0".repeat(casas + 1), casas);
    telas.push({ titulo: "Vezes zero", fala: `Qualquer número vezes 0 dá 0.`, corpo: { tipo: "zero", resultado: zero } });
    return telas;
  }

  telas.push({
    titulo: "Primeiro, sem a vírgula",
    fala: `A vírgula volta no fim. Por enquanto: ${x.inteiro} × ${y.inteiro}.`,
    corpo: {
      tipo: "tirar",
      itens: [x, y].map((n) => ({ de: n.texto, para: n.inteiro, casas: n.casas })),
    },
  });

  // multiplica: cada algarismo de baixo por todos os de cima, da direita para a esquerda
  const A = x.inteiro;
  const B = y.inteiro;
  const parciais: string[] = [];
  for (let j = 0; j < B.length; j++) {
    const db = Number(B[B.length - 1 - j]);
    let escrito = "";
    let sobe = 0;
    for (let i = 0; i < A.length; i++) {
      const da = Number(A[A.length - 1 - i]);
      const conta = da * db + sobe;
      const ultimo = i === A.length - 1;
      escrito = (ultimo ? String(conta) : String(conta % 10)) + escrito;
      const antes = sobe;
      sobe = Math.floor(conta / 10);
      const deslocada = escrito + "0".repeat(j);
      const escreveu = ultimo ? String(conta) : String(conta % 10);
      const fala =
        `${da} vezes ${db} dá ${da * db}` +
        (antes ? `, mais ${antes} que subiu: ${conta}` : "") +
        (ultimo ? `. Escreve ${escreveu}.` : conta >= 10 ? `. Escreve ${conta % 10} e sobe ${sobe}.` : `. Escreve ${conta}.`);
      const linhas: LinhaArmada[] = [
        { digitos: A, destaque: [i] },
        { op: "×", digitos: B, destaque: [j] },
        ...parciais.map((d) => ({ digitos: d, apagados: [...d].map((_, k) => k) })),
        {
          digitos: deslocada,
          destaque: [...escreveu].map((_, k) => j + i + k),
          apagados: Array.from({ length: j }, (_, k) => k),
        },
      ];
      telas.push({
        titulo: `${da} × ${db}` + (j > 0 && i === 0 ? `, uma casa para a esquerda` : ""),
        fala: j > 0 && i === 0 ? `O ${db} vale ${db}${"0".repeat(j)}: a linha anda ${j === 1 ? "uma casa" : `${j} casas`}. ${fala}` : fala,
        corpo: { tipo: "armada", linhas, barras: [1] },
      });
    }
    parciais.push(escrito + "0".repeat(j));
  }

  const total = (BigInt(A) * BigInt(B)).toString();
  if (parciais.length > 1) {
    telas.push({
      titulo: "Soma as linhas",
      fala: `${parciais.join(" + ")} = ${total}.`,
      corpo: {
        tipo: "armada",
        linhas: [
          ...parciais.map((d, k) => ({ digitos: d, op: k === parciais.length - 1 ? ("+" as const) : undefined })),
          { digitos: total, destaque: [...total].map((_, k) => k) },
        ],
        barras: [parciais.length - 1],
      },
    });
  }

  const casasDela = x.casas + y.casas;
  const comCasas = comVirgula(total, casasDela);
  const final = arredondar(total, casasDela, casas);
  const fica = casasDela < casas ? ` = ${final}` : "";
  telas.push({
    titulo: "Agora a vírgula volta",
    fala:
      casasDela === 0
        ? `Nenhum dos dois tinha casas depois da vírgula: fica ${comCasas}${fica}.`
        : `${x.texto} tem ${nCasas(x.casas)} · ${y.texto} tem ${nCasas(y.casas)}. Conta ${nCasas(casasDela)} da direita: ${comCasas}${fica}.`,
    corpo: { tipo: "virgula", casas: [x.casas, y.casas], resultado: comCasas, fica: final },
  });

  if (casasDela > casas) {
    telas.push({
      titulo: `Arredonda para ${casas} casas`,
      fala: `O lab mostra ${casas} casas: ${comCasas} fica ${final}.`,
      corpo: { tipo: "arredonda", de: comCasas, para: final },
    });
  }

  if (temSinal) {
    const regra = `${x.negativo ? "−" : "+"} × ${y.negativo ? "−" : "+"} = ${negativo ? "−" : "+"}`;
    const resultado = `${negativo ? "−" : ""}${final}`;
    telas.push({
      titulo: "O sinal volta",
      fala: `${negativo ? "Sinais diferentes dão −" : "Sinais iguais dão +"}: ${a} × ${b} = ${resultado}.`,
      corpo: { tipo: "sinalVolta", regra, resultado },
    });
  }
  return telas;
}
