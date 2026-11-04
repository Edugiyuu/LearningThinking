"use client";

// A Aqua de corpo inteiro da aba "Perguntar à Aqua" (ADR-0028, seção B; Figma "Aqua · quadros da animação").
// O desenho muda quadro a quadro, como um sprite: o GSAP só é o relógio que troca o quadro visível,
// em passos inteiros. Grade 30 × 24 com o corpo de 16 × 10 e um tamanho de pixel só.
// A Aqua não sabe que a entrada é uma cor: quem chama passa a cor só para ela mostrar (ADR-0028, seção E).

import { useEffect, useState } from "react";
import gsap from "gsap";
import { AQUA, BOCHECHA, OLHO, PORTA, Pixels, type Celula } from "@/components/mascote";

const COLUNAS = 30;
const LINHAS = 24;
const OX = 5; // onde o corpo começa na grade
const OY = 10;
const CINZA = "#6E6E73";
const CLARO = "#C7C7CC";
const BRANCO = "#FFFFFF";
const AMARELO = "#F5B82E";

type Olhos = "normal" | "cima" | "lado" | "feliz" | "meio" | "duvida" | "fechado";

const pontos = (lista: [number, number][], cor: string): Celula[] => lista.map(([x, y]) => [x, y, 1, 1, cor]);

function olhos(tipo: Olhos, ox: number, oy: number): Celula[] {
  const e = ox + 6; // coluna do olho esquerdo
  const d = ox + 12; // e do direito
  const y = oy + 2;
  switch (tipo) {
    case "normal":
      return [[e, y, 2, 4, OLHO], [d, y, 2, 4, OLHO]];
    case "cima":
      return [[e, y - 1, 2, 3, OLHO], [d, y - 1, 2, 3, OLHO]];
    case "lado":
      return [[e + 1, y, 2, 4, OLHO], [d + 1, y, 2, 4, OLHO]];
    case "feliz": // ^ ^
      return pontos([[e - 1, y + 2], [e, y + 1], [e + 1, y + 1], [e + 2, y + 2], [d - 1, y + 2], [d, y + 1], [d + 1, y + 1], [d + 2, y + 2]], OLHO);
    case "meio":
      return [[e, y + 2, 2, 2, OLHO], [d, y + 2, 2, 2, OLHO], [e - 1, y + 1, 4, 1, OLHO], [d - 1, y + 1, 4, 1, OLHO]];
    case "duvida":
      return [[e, y, 2, 4, OLHO], [d, y + 2, 2, 2, OLHO], [d - 1, y, 3, 1, OLHO]];
    case "fechado":
      return [[e - 1, y + 3, 4, 1, OLHO], [d - 1, y + 3, 4, 1, OLHO]];
  }
}

type Corpo = {
  olho?: Olhos;
  /** Linha do bracinho (a porta 2 × 2) de cada lado; null = o bracinho está em outro lugar. */
  esq?: number | null;
  dir?: number | null;
  bochecha?: boolean;
  /** Amassar: o corpo fica um pixel mais baixo e mais largo. */
  amassa?: number;
  dx?: number;
  dy?: number;
};

function corpo({ olho = "normal", esq = 4, dir = 4, bochecha = false, amassa = 0, dx = 0, dy = 0 }: Corpo): Celula[] {
  const ox = OX + dx;
  const oy = OY + dy;
  const c: Celula[] = [[ox + 2 - amassa, oy + amassa, 16 + 2 * amassa, 10 - amassa, AQUA], ...olhos(olho, ox, oy)];
  if (bochecha) c.push([ox + 4, oy + 7, 2, 1, BOCHECHA], [ox + 14, oy + 7, 2, 1, BOCHECHA]);
  if (esq !== null) c.push([ox - amassa, oy + esq, 2, 2, PORTA]);
  if (dir !== null) c.push([ox + 18 + amassa, oy + dir, 2, 2, PORTA]);
  c.push([ox + 4, oy + 10, 2, 2, AQUA], [ox + 14, oy + 10, 2, 2, AQUA]); // perninhas
  return c;
}

function caixa(x: number, y: number, w: number, h: number, borda: string, dentro?: string): Celula[] {
  const c: Celula[] = [[x, y, w, 1, borda], [x, y + h - 1, w, 1, borda], [x, y, 1, h, borda], [x + w - 1, y, 1, h, borda]];
  return dentro ? [[x + 1, y + 1, w - 2, h - 2, dentro], ...c] : c;
}

const interrogacao = (x: number, y: number): Celula[] =>
  pontos([[x, y], [x + 1, y], [x + 2, y], [x + 3, y + 1], [x + 3, y + 2], [x + 2, y + 3], [x + 1, y + 4], [x + 1, y + 6]], CINZA);

function letraZ(x: number, y: number, s: number, cor: string): Celula[] {
  const diagonal: [number, number][] = [];
  for (let i = 1; i < s - 1; i++) diagonal.push([x + s - 1 - i, y + i]);
  return [[x, y, s, 1, cor], [x, y + s - 1, s, 1, cor], ...pontos(diagonal, cor)];
}

const balao: Celula[] = [...pontos([[OX + 21, OY + 1]], CLARO), [OX + 22, OY - 2, 2, 2, CLARO], ...caixa(OX + 18, OY - 9, 7, 5, CLARO, BRANCO)];
const estrelas = pontos([[OX + 1, OY - 5], [OX + 19, OY - 6], [OX + 21, OY - 3]], AMARELO);

/** Uma cor um pouco mais escura, para a borda do cartão que a Aqua mostra. */
function escurecer(cor: string): string {
  const v = [1, 3, 5].map((i) => Math.round(parseInt(cor.slice(i, i + 2), 16) * 0.75));
  return `#${v.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Um quadro do sprite. Os de olho aberto deixam o piscar trocar os olhos. */
type Quadro = { desenho: (olho?: Olhos) => Celula[]; tempo: number; pisca?: boolean };
/** A entrada toca uma vez; o ciclo repete até o momento mudar. */
type Animacao = { entrada: Quadro[]; ciclo: Quadro[] };

export type MomentoAqua = "esperando" | "pensando" | "certa" | "duvida" | "dormindo";

function animacao(momento: MomentoAqua, cor: string): Animacao {
  switch (momento) {
    case "esperando": {
      const acena = (dir: number, risquinhos: boolean): Quadro => ({
        desenho: () => [...corpo({ olho: "feliz", dir }), ...(risquinhos ? pontos([[OX + 22, OY - 3], [OX + 23, OY - 1], [OX + 22, OY + 1]], CLARO) : [])],
        tempo: 0.22,
      });
      return {
        entrada: [acena(-1, true), acena(1, false), acena(-1, true), acena(1, false), acena(-1, true)],
        // respirar: o corpo amassa e estica um pixel
        ciclo: [
          { desenho: (o) => corpo({ olho: o }), tempo: 1.2, pisca: true },
          { desenho: (o) => corpo({ olho: o, amassa: 1 }), tempo: 0.6, pisca: true },
        ],
      };
    }
    case "pensando": {
      // a mão bate no queixo e os olhos vão de um lado ao outro
      const pensa = (lado: number, mao: number): Quadro => ({
        desenho: () => [...corpo({ olho: "cima", dir: null }).filter((c) => c[4] !== OLHO), ...olhos("cima", OX + lado, OY), [OX + 11, OY + mao, 3, 2, PORTA], ...balao],
        tempo: mao === 8 ? 0.35 : 0.2,
      });
      return {
        // o bracinho passa pelo meio antes de chegar ao queixo
        entrada: [{ desenho: () => [...corpo({ olho: "meio", dir: null }), [OX + 16, OY + 7, 2, 2, PORTA]], tempo: 0.12 }],
        ciclo: [pensa(-1, 8), pensa(-1, 9), pensa(1, 8), pensa(1, 9)],
      };
    }
    case "certa": {
      // pulinho: prepara amassando, sobe, cai amassando; depois aponta para a cor
      const chao: Celula[] = [[OX + 4, OY + 11, 2, 1, CLARO], [OX + 14, OY + 11, 2, 1, CLARO]];
      const apontando: Quadro = {
        desenho: (o) => [...corpo({ olho: o ?? "lado", dx: -4, dir: null }), [OX + 14, OY + 4, 3, 2, PORTA], ...caixa(OX + 18, OY + 2, 6, 6, escurecer(cor), cor)],
        tempo: 2.4,
        pisca: true,
      };
      const pulinho: Quadro[] = [
        { desenho: () => corpo({ olho: "meio", amassa: 1 }), tempo: 0.1 },
        { desenho: () => [...corpo({ olho: "feliz", bochecha: true, dy: -2 }), ...chao, ...estrelas], tempo: 0.28 },
        { desenho: () => corpo({ olho: "feliz", bochecha: true, amassa: 1 }), tempo: 0.1 },
        { desenho: () => corpo({ olho: "feliz", bochecha: true }), tempo: 0.3 },
      ];
      return { entrada: pulinho, ciclo: [apontando, ...pulinho] };
    }
    case "duvida": {
      // o bracinho coça a cabeça, indo e voltando
      const coca = (x: number, y: number, tempo: number): Quadro => ({
        desenho: () => [...corpo({ olho: "duvida", dir: null }), [OX + x, OY + y, 2, 2, PORTA], ...interrogacao(OX + 8, OY - 9)],
        tempo,
      });
      return { entrada: [], ciclo: [coca(18, -1, 0.18), coca(16, -2, 0.18), coca(18, -1, 0.18), coca(16, -2, 0.18), coca(18, 1, 1.2)] };
    }
    case "dormindo":
      return {
        entrada: [],
        ciclo: [
          { desenho: () => [...corpo({ olho: "fechado", esq: 6, dir: 6, amassa: 1 }), ...letraZ(OX + 20, OY - 4, 4, CINZA)], tempo: 1.1 },
          { desenho: () => [...corpo({ olho: "fechado", esq: 6, dir: 6 }), ...letraZ(OX + 20, OY - 6, 4, CINZA), ...letraZ(OX + 22, OY - 10, 3, CLARO)], tempo: 1.1 },
        ],
      };
  }
}

const semMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A Aqua animada. Troque o `key` junto com o `momento` para a animação começar do primeiro quadro.
 * Com "reduzir movimento", fica parada no primeiro quadro do ciclo (ADR-0011).
 */
export function AquaAnimada({
  momento,
  cor = "#E8853A",
  unidade = 10,
  rotulo,
  className,
}: {
  momento: MomentoAqua;
  cor?: string;
  unidade?: number;
  rotulo?: string;
  className?: string;
}) {
  const { entrada, ciclo } = animacao(momento, cor);
  const quadros = [...entrada, ...ciclo];
  const [atual, setAtual] = useState(() => (semMovimento() ? entrada.length : 0));
  const [piscando, setPiscando] = useState<Olhos | null>(null);

  useEffect(() => {
    if (semMovimento()) return;
    const { entrada, ciclo } = animacao(momento, "#000000");
    // o relógio: cada quadro aparece inteiro no seu tempo, sem misturar com o próximo
    const tl = gsap.timeline();
    let t = 0;
    entrada.forEach((q, i) => {
      tl.call(() => setAtual(i), [], t);
      t += q.tempo;
    });
    const repete = gsap.timeline({ repeat: -1 });
    let r = 0;
    ciclo.forEach((q, i) => {
      repete.call(() => setAtual(entrada.length + i), [], r);
      r += q.tempo;
    });
    repete.set({}, {}, r); // o último quadro também fica o tempo dele antes de repetir
    tl.add(repete, t);

    // piscar: de tempos em tempos, aberto → meio → fechado → meio → aberto
    let piscada: gsap.core.Timeline | null = null;
    const agendar = () => {
      piscada = gsap
        .timeline({ delay: gsap.utils.random(3, 6), onComplete: agendar })
        .call(() => setPiscando("meio"))
        .call(() => setPiscando("fechado"), [], 0.06)
        .call(() => setPiscando("meio"), [], 0.14)
        .call(() => setPiscando(null), [], 0.2);
    };
    agendar();
    return () => {
      tl.kill();
      piscada?.kill();
    };
  }, [momento]);

  const quadro = quadros[Math.min(atual, quadros.length - 1)];
  return (
    <Pixels
      celulas={quadro.desenho(quadro.pisca && piscando ? piscando : undefined)}
      colunas={COLUNAS}
      linhas={LINHAS}
      unidade={unidade}
      rotulo={rotulo}
      className={className}
    />
  );
}

/** Onde fica a cabeça na grade (de 0 a 1), para o zoom do "ver como ela pensou" mirar nela. */
export const CABECA = { x: (OX + 10) / COLUNAS, y: (OY + 3) / LINHAS };
