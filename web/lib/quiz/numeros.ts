// Quiz ao vivo (ADR-0034): os números sorteados e o jeito de escrever cada um.

/**
 * A resposta digitada vale se estiver a até 0,02 da certa. Os números têm 2 casas (0,36 × −0,61),
 * então a conta dá mais casas e o aluno arredonda: arredondar cada parte de uma soma de três
 * já pode dar 0,015 de diferença.
 */
export const TOLERANCIA = 0.02;

export type Aleatorio = () => number;

/** Um número com 2 casas entre `de` e `ate` (0,36 · 1,47). */
export const sortear2 = (r: Aleatorio, de: number, ate: number) => r2(de + r() * (ate - de));

/** Uma entrada (R, G ou B) com 2 casas, de 0 a 1. Às vezes o canal vem apagado (0). */
export const sortearEntrada = (r: Aleatorio) => (r() < 0.15 ? 0 : sortear2(r, 0.05, 1));

/** Um peso com 2 casas, entre −2 e 2, longe do 0 (pelo menos 0,10 de tamanho). */
export const sortearPeso = (r: Aleatorio) => sortear2(r, 0.1, 2) * (r() < 0.5 ? -1 : 1);

export const escolher = <T,>(r: Aleatorio, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

export function embaralhar<T>(r: Aleatorio, xs: readonly T[]): T[] {
  const copia = [...xs];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Arredonda em 2 casas, tirando o "ruído" das contas com vírgula (0,1 + 0,2 = 0,30000000000000004). */
export const r2 = (x: number) => Math.round(x * 100) / 100 + 0; // + 0 troca −0 por 0

/** Dá exato em 2 casas? (0,75 sim; 1,125 não) */
export const exato2 = (x: number) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;

export const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

const MENOS = "−"; // o sinal de menos de verdade, como nas telas do lab

/** 0,75 · −1,20 · 0,00 */
export function fmt(x: number, casas = 2): string {
  const v = Math.round(x * 10 ** casas) / 10 ** casas;
  const texto = Math.abs(v).toFixed(casas).replace(".", ",");
  return v < 0 ? MENOS + texto : texto;
}

/** Peso com sinal sempre: +1,50 · −0,50 */
export function fmtPeso(x: number): string {
  return x >= 0 ? `+${fmt(x)}` : fmt(x);
}

/** Curto, para o texto: 0,8 · 1 · 0,5 */
export function fmtCurto(x: number): string {
  const v = r2(x);
  const texto = String(Math.abs(v)).replace(".", ",");
  return v < 0 ? MENOS + texto : texto;
}

/** Lê o que o aluno digitou: aceita vírgula ou ponto, "−" ou "-". Devolve null se não é número. */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s+/g, "").replace(/[−–]/g, "-").replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(limpo)) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Uma semente a partir de um texto (FNV-1a), para cada pergunta e cada aluno terem a sua. */
export function semearTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
