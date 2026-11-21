"use client";

// Cena do hero da Home (ADR-0036, versão 2; Figma "Cena do hero v2 · neurônios espalhados").
// A Aqua começa de perto, no meio de neurônios apagados. Pulsos saem dos bracinhos dela e cada neurônio
// acende quando o pulso chega, enquanto a câmera afasta até mostrar o campo inteiro aceso.
// Toca sozinha uma vez (como um vídeo) e depois fica com pulsos lentos; tem botão de pausa.
// Sem quadro: o fundo é transparente e as bordas somem no branco da página (máscara com degradê).
// O mundo vem de scripts/gerar-cena-heroi.py; aqui só se move a câmera, os pulsos e as luzes.
//
// Desenho em <canvas> (ADR-0035, fluidez): em SVG eram ~2.000 elementos, e cada quadro da câmera
// fazia o navegador redesenhar todos (30-40 quadros por segundo). Aqui o GSAP continua sendo o relógio:
// ele anima números (zoom, brilho de cada neurônio, posição de cada pulso) e um único desenho por quadro
// lê esses números e pinta a cena.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AQUA, OLHO, PORTA } from "@/components/mascote";
import { CENA, MUNDO } from "@/components/cena-heroi-mundo";

const { largura: W, altura: H, cx: CX, cy: CY, zoomInicial: Z0, pixelAqua: P1 } = CENA;
const VERDE = "#2FA35B";
const VERMELHO = "#D64545";
const CINZA_LIGACAO = "#1D1D1F";
const CINZA_NEURONIO = "#C7C7CC";

// Linha do tempo: 0,6 s com a Aqua parada soltando os primeiros pulsos, depois 10 s de câmera afastando.
const INICIO = 0.6;
const DURACAO_CAMERA = 10;
const OLHO_FELIZ = INICIO + 9.5;

// A Aqua encolhe menos que o mundo (pixel = P1 * zoom^-0.4), para continuar visível no fim.
const pixelDaAqua = (zoom: number) => P1 * zoom ** -0.4;
const bracinho = (lado: number, zoom: number): [number, number] => {
  const p = pixelDaAqua(zoom);
  return [CX + (lado === 0 ? -9 : 9) * p, CY - p];
};
const raioDoPulso = (zoom: number) => Math.max(3.5, Math.min(10, 2.2 * zoom)); // em unidades do quadro

// Aqua: grade oficial 20 x 12 (corpo 16 x 10), centrada em (0, 0).
type Celula = [number, number, number, number, string];
const CORPO: Celula[] = [
  [2, 0, 16, 10, AQUA],
  [0, 4, 2, 2, PORTA],
  [18, 4, 2, 2, PORTA],
  [4, 10, 2, 2, AQUA],
  [14, 10, 2, 2, AQUA],
];
const OLHOS_NORMAIS: Celula[] = [
  [6, 2, 2, 4, OLHO],
  [12, 2, 2, 4, OLHO],
];
const OLHOS_FELIZES: Celula[] = (
  [[5, 4], [6, 3], [7, 3], [8, 4], [11, 4], [12, 3], [13, 3], [14, 4]] as const
).map(([x, y]) => [x, y, 1, 1, OLHO]);

const N = MUNDO.neuronios;
// Neurônios agrupados pelo raio (arredondado a 0,25), para pintar os anéis com um traço por grupo.
const POR_RAIO: [number, number[]][] = (() => {
  const m = new Map<number, number[]>();
  N.forEach(([, , r], i) => {
    const k = Math.round(r * 4) / 4;
    m.set(k, [...(m.get(k) ?? []), i]);
  });
  return [...m];
})();
const comAlfa = (hex: string, a: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
// Espessura das ligações acesas, em pixels da tela, por grupo (como o vector-effect: non-scaling-stroke do SVG).
const baseDaLigacao = (w: number) => Math.max(0.25, Math.round(w * 4) / 4);
const espessuraAcesa = (base: number, zoom: number) => Math.max(0.8, base * zoom ** 0.75 * 1.25);

type Valor = { v: number };
type Pulso = { u: number; de: number; ate: number };

/** Monta o estado animado e a linha do tempo; devolve também a função que desenha um quadro. */
function montarCena(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const camera = { lz: Math.log(Z0) };
  const olho = { feliz: 0 };
  const acesos: Valor[] = N.map(() => ({ v: 0 }));
  const piscadas: Valor[] = N.map(() => ({ v: 0 }));
  const ligacoes: Valor[] = MUNDO.ligacoes.map(() => ({ v: 0 }));
  const pulsos: Pulso[] = []; // os da onda (de < 0: sai do bracinho -de - 1)
  let lentos: Pulso[] = []; // os do ciclo do fim
  let sujo = true;
  const marcar = () => {
    sujo = true;
  };

  function desenhar() {
    sujo = false;
    const k = canvas.width / W; // unidades do quadro -> pixels do canvas
    const px = canvas.width / (canvas.clientWidth || W); // pixels da tela -> pixels do canvas
    const z = Math.exp(camera.lz);
    const X = (x: number) => (CX + (x - CX) * z) * k;
    const Y = (y: number) => (CY + (y - CY) * z) * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";

    // brilho do fundo (elipse 560 x 300 no centro)
    ctx.save();
    ctx.setTransform(k, 0, 0, (k * 300) / 560, CX * k, CY * k);
    const brilho = ctx.createRadialGradient(0, 0, 0, 0, 0, 560);
    brilho.addColorStop(0, comAlfa(AQUA, 0.22));
    brilho.addColorStop(0.6, comAlfa("#378ADD", 0.04));
    brilho.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(-560, -560, 1120, 1120);
    ctx.restore();

    // ligações apagadas
    ctx.beginPath();
    for (const [a, b] of MUNDO.ligacoes) {
      ctx.moveTo(X(N[a][0]), Y(N[a][1]));
      ctx.lineTo(X(N[b][0]), Y(N[b][1]));
    }
    ctx.strokeStyle = comAlfa(CINZA_LIGACAO, 0.1);
    ctx.lineWidth = Math.max(0.6, 0.6 * z) * px;
    ctx.stroke();

    // ligações acesas, juntas por cor, espessura e transparência (um traço por grupo)
    const grupos = new Map<string, number[][]>();
    const juntar = (sinal: number, w: number, alfa: number, linha: number[]) => {
      const a = Math.round(alfa * 20) / 20;
      if (a <= 0) return;
      const chave = `${sinal}|${baseDaLigacao(w)}|${a}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(linha);
    };
    MUNDO.ligacoes.forEach(([a, b, sinal, w, op], i) => {
      const v = ligacoes[i].v;
      if (v > 0) juntar(sinal, w, (Math.round(op * 3) / 3) * 0.85 * v, [X(N[a][0]), Y(N[a][1]), X(N[b][0]), Y(N[b][1])]);
    });
    for (const [lado, i, w] of MUNDO.bracos) {
      const [bx, by] = bracinho(lado, z);
      juntar(1, w, 0.85, [X(bx), Y(by), X(N[i][0]), Y(N[i][1])]);
    }
    for (const [chave, linhas] of grupos) {
      const [sinal, base, alfa] = chave.split("|").map(Number);
      ctx.beginPath();
      for (const [x0, y0, x1, y1] of linhas) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
      }
      ctx.strokeStyle = comAlfa(sinal > 0 ? VERDE : VERMELHO, alfa);
      ctx.lineWidth = espessuraAcesa(base, z) * px;
      ctx.stroke();
    }

    // neurônios apagados: anel cinza com miolo branco
    const circulos = (fator: number, filtro?: (i: number) => boolean) => {
      ctx.beginPath();
      N.forEach(([x, y, r], i) => {
        if (filtro && !filtro(i)) return;
        const cx = X(x);
        const cy = Y(y);
        ctx.moveTo(cx + r * fator * z * k, cy);
        ctx.arc(cx, cy, r * fator * z * k, 0, Math.PI * 2);
      });
    };
    circulos(1);
    ctx.fillStyle = CINZA_NEURONIO;
    ctx.fill();
    circulos(0.675);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // neurônios acesos (anel aqua) e a piscada de quando o pulso chega, agrupados pela transparência
    const porAlfa = (valores: Valor[]) => {
      const m = new Map<number, Set<number>>();
      valores.forEach(({ v }, i) => {
        const a = Math.round(v * 20) / 20;
        if (a <= 0) return;
        if (!m.has(a)) m.set(a, new Set());
        m.get(a)!.add(i);
      });
      return m;
    };
    ctx.strokeStyle = AQUA;
    for (const [a, idx] of porAlfa(acesos)) {
      ctx.globalAlpha = a;
      circulos(0.83, (i) => idx.has(i));
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      // o anel tem a espessura do raio: um traço por grupo de raio (como os pontos cinza)
      for (const [r, doRaio] of POR_RAIO) {
        ctx.beginPath();
        for (const i of doRaio) {
          if (!idx.has(i)) continue;
          const raio = N[i][2] * 0.83 * z * k;
          ctx.moveTo(X(N[i][0]) + raio, Y(N[i][1]));
          ctx.arc(X(N[i][0]), Y(N[i][1]), raio, 0, Math.PI * 2);
        }
        ctx.lineWidth = r * 0.35 * z * k;
        ctx.stroke();
      }
    }
    ctx.fillStyle = AQUA;
    for (const [a, idx] of porAlfa(piscadas)) {
      ctx.globalAlpha = a * 0.25;
      circulos(2.5, (i) => idx.has(i));
      ctx.fill();
      ctx.globalAlpha = a;
      circulos(1, (i) => idx.has(i));
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // pulsos: andam pela ligação; o tamanho acompanha o zoom da onda (no ciclo do fim, zoom 1)
    const pintarPulsos = (lista: Pulso[], zoom: number) => {
      const r = raioDoPulso(zoom) * k;
      for (const fator of [1.6, 0.6]) {
        ctx.beginPath();
        for (const { u, de, ate } of lista) {
          if (u <= 0 || u >= 1) continue;
          const [x0, y0] = de >= 0 ? N[de] : bracinho(MUNDO.bracos[-de - 1][0], z);
          const [x1, y1] = N[ate];
          const cx = X(x0 + (x1 - x0) * u);
          const cy = Y(y0 + (y1 - y0) * u);
          ctx.moveTo(cx + r * fator, cy);
          ctx.arc(cx, cy, r * fator, 0, Math.PI * 2);
        }
        ctx.fillStyle = fator > 1 ? comAlfa(AQUA, 0.28) : AQUA;
        ctx.fill();
      }
    };
    pintarPulsos(pulsos, z);
    pintarPulsos(lentos, 1);

    // a Aqua, por cima de tudo, em pixels inteiros da grade
    const escala = P1 * z ** 0.6 * k;
    ctx.setTransform(escala, 0, 0, escala, CX * k, CY * k);
    for (const [x, y, w, h, cor] of [...CORPO, ...(olho.feliz ? OLHOS_FELIZES : OLHOS_NORMAIS)]) {
      ctx.fillStyle = cor;
      ctx.fillRect(x - 10, y - 6, w, h);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: marcar });
  tl.to(camera, { lz: 0, duration: DURACAO_CAMERA, ease: "sine.inOut" }, INICIO);

  // ---------- onda: cada neurônio acende quando o pulso chega ----------
  const quando = (i: number) => INICIO + MUNDO.acende[i];
  N.forEach((_, i) => {
    const t = quando(i);
    tl.to(acesos[i], { v: 1, duration: 0.25 }, t);
    tl.to(piscadas[i], { keyframes: [{ v: 1, duration: 0.1 }, { v: 0, duration: 0.6 }] }, t);
  });
  MUNDO.ligacoes.forEach(([a, b], k) => {
    tl.to(ligacoes[k], { v: 1, duration: 0.3 }, Math.max(quando(a), quando(b)));
  });

  // Pulsos: andam pela ligação que trouxe a onda até cada neurônio (de um bracinho ou de outro neurônio).
  MUNDO.origem.forEach((de, j) => {
    if (de === null) return;
    const saida = de >= 0 ? quando(de) : 0;
    const duracao = quando(j) - saida;
    if (duracao < 0.05) return;
    const pulso: Pulso = { u: 0, de, ate: j };
    pulsos.push(pulso);
    tl.to(pulso, { u: 1, duration: duracao }, saida);
  });

  // A Aqua troca de quadro (olho normal -> feliz); o GSAP só marca a hora.
  tl.set(olho, { feliz: 1 }, OLHO_FELIZ);

  // Depois do fim: pulsos lentos por ligações sorteadas, em ciclo.
  const pulsosLentos = () => {
    lentos = Array.from({ length: 18 }, () => {
      const [a, b] = MUNDO.ligacoes[Math.floor(Math.random() * MUNDO.ligacoes.length)];
      return { u: 0, de: a, ate: b };
    });
    const ciclo = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" }, onUpdate: marcar });
    lentos.forEach((p, k) => ciclo.to(p, { u: 1, duration: 1.8 }, k * 0.45));
    return ciclo;
  };

  // Um desenho por quadro, só quando algum número mudou (pausado, não gasta nada).
  const quadro = () => {
    if (sujo) desenhar();
  };
  return { tl, pulsosLentos, quadro, desenhar: () => desenhar() };
}

export function CenaHeroi() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tocando = useRef<gsap.core.Timeline[]>([]);
  const [pausada, setPausada] = useState(false);
  const [comMovimento, setComMovimento] = useState(true);

  useEffect(() => {
    const el = canvas.current!;
    const cena = montarCena(el);
    // O canvas acompanha a largura da página, na resolução da tela (nítido em telas retina).
    const ajustar = () => {
      const largura = Math.round(el.clientWidth * Math.min(2, window.devicePixelRatio || 1));
      if (!largura || el.width === largura) return;
      el.width = largura;
      el.height = Math.round((largura * H) / W);
      cena.desenhar();
    };
    const observador = new ResizeObserver(ajustar);
    observador.observe(el);
    ajustar();

    const mm = gsap.matchMedia();
    mm.add(
      { mover: "(prefers-reduced-motion: no-preference)", parar: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        if (ctx.conditions?.parar) {
          // Quem pediu menos movimento vê só o último quadro, parado.
          cena.tl.progress(1, true).pause();
          cena.desenhar();
          setComMovimento(false);
          tocando.current = [];
          return;
        }
        setComMovimento(true);
        cena.tl.restart();
        tocando.current = [cena.tl];
        gsap.ticker.add(cena.quadro);
        cena.tl.eventCallback("onComplete", () => {
          ctx.add(() => {
            tocando.current = [cena.pulsosLentos()];
          });
        });
        return () => gsap.ticker.remove(cena.quadro);
      },
    );
    return () => {
      mm.revert();
      cena.tl.kill();
      observador.disconnect();
    };
  }, []);

  const alternarPausa = () => {
    const pausar = !pausada;
    tocando.current.forEach((t) => t.paused(pausar));
    setPausada(pausar);
  };

  return (
    // Sem quadro: a máscara apaga as bordas no branco da página.
    <div className="relative">
      <div className="mx-auto w-full max-w-[1280px]">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          className="block h-auto w-full"
          style={{
            aspectRatio: `${W} / ${H}`,
            maskImage: "radial-gradient(closest-side, #000 55%, transparent)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent)",
          }}
          role="img"
          aria-label="A Aqua no meio de muitos neurônios. Pulsos saem dos bracinhos dela e cada neurônio acende quando o pulso chega, enquanto a câmera se afasta até mostrar todos acesos."
        />
      </div>
      <div className="mx-auto flex max-w-[1120px] items-center justify-center gap-3">
        <p className="text-center text-[13px] font-medium text-text-subtle">
          Cada neurônio acende quando o sinal chega até ele. Monte a sua rede no laboratório.
        </p>
        {comMovimento && (
          <button
            type="button"
            onClick={alternarPausa}
            aria-label={pausada ? "Continuar a animação" : "Pausar a animação"}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-text-muted transition-colors hover:bg-black/[.03]"
          >
            {pausada ? (
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                <path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" fill="currentColor" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
