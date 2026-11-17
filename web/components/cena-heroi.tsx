"use client";

// Cena do hero da Home (ADR-0036, versão 2; Figma "Cena do hero v2 · neurônios espalhados").
// A Aqua começa de perto, no meio de neurônios apagados. Pulsos saem dos bracinhos dela e cada neurônio
// acende quando o pulso chega, enquanto a câmera afasta até mostrar o campo inteiro aceso.
// Toca sozinha uma vez (como um vídeo) e depois fica com pulsos lentos; tem botão de pausa.
// Sem quadro: o fundo é transparente e as bordas somem no branco da página (máscara com degradê).
// O mundo vem de scripts/gerar-cena-heroi.py; aqui só se move a câmera, os pulsos e as luzes.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AQUA, OLHO, PORTA } from "@/components/mascote";
import { CENA, MUNDO } from "@/components/cena-heroi-mundo";

const { largura: W, altura: H, cx: CX, cy: CY, zoomInicial: Z0, pixelAqua: P1 } = CENA;
const VERDE = "#2FA35B";
const VERMELHO = "#D64545";
const CINZA_LIGACAO = "#1D1D1F";
const CINZA_NEURONIO = "#C7C7CC";
const SVG_NS = "http://www.w3.org/2000/svg";

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
const raioDoPulso = (zoom: number) => Math.max(3.5, Math.min(10, 2.2 * zoom)); // em pixels da tela

// A cena começa no zoom 6: a câmera fica no centro da Aqua, então só a escala muda.
// Arredondado: o servidor e o navegador precisam escrever o mesmo número (senão o React reclama na hidratação).
const n4 = (v: number) => Math.round(v * 1e4) / 1e4;
const transformDaCamera = (zoom: number) => `translate(${n4(CX - CX * zoom)} ${n4(CY - CY * zoom)}) scale(${n4(zoom)})`;
const transformDaAqua = (zoom: number) => `translate(${CX} ${CY}) scale(${n4(P1 * zoom ** 0.6)})`;

// Camada apagada, desenhada uma vez no servidor: todas as ligações em cinza e os neurônios com anel cinza.
const N = MUNDO.neuronios;
const LIGACOES_CINZA = MUNDO.ligacoes
  .map(([a, b]) => `M${N[a][0]} ${N[a][1]}L${N[b][0]} ${N[b][1]}`)
  .join("");
const NEURONIOS_CINZA = N.map(([x, y]) => `M${x} ${y}h.01`);
// Cada neurônio é um ponto (linha de comprimento quase zero com ponta redonda): grupos por raio.
const PONTOS_POR_RAIO = (() => {
  const grupos = new Map<number, string[]>();
  N.forEach(([, , r], i) => {
    const k = Math.round(r * 4) / 4;
    grupos.set(k, [...(grupos.get(k) ?? []), NEURONIOS_CINZA[i]]);
  });
  return [...grupos].map(([r, ds]) => ({ r, d: ds.join("") }));
})();

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

function Pixels({ celulas }: { celulas: Celula[] }) {
  return celulas.map(([x, y, w, h, cor], i) => (
    <rect key={i} x={x - 10} y={y - 6} width={w} height={h} fill={cor} />
  ));
}

function criar<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, pai: Element) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  pai.appendChild(el);
  return el;
}

type Pulso = { g: SVGGElement; brilho: SVGCircleElement; nucleo: SVGCircleElement };

/** Monta as camadas animadas e devolve a linha do tempo principal e a função que liga os pulsos lentos do fim. */
function montarCena(svg: SVGSVGElement) {
  const q = <T extends Element>(s: string) => svg.querySelector<T>(s)!;
  const mundo = q<SVGGElement>("[data-mundo]");
  const cinza = q<SVGPathElement>("[data-ligacoes-cinza]");
  const camadaLigacoes = q<SVGGElement>("[data-ligacoes-acesas]");
  const camadaNeuronios = q<SVGGElement>("[data-neuronios-acesos]");
  const camadaPiscadas = q<SVGGElement>("[data-piscadas]");
  const camadaPulsos = q<SVGGElement>("[data-pulsos]");
  const aqua = q<SVGGElement>("[data-aqua]");
  // Começa do zero (no modo de desenvolvimento o React monta o efeito duas vezes).
  svg.querySelectorAll("[data-camada]").forEach((g) => g.replaceChildren());

  // Ligações acesas: um caminho por ligação (para acender uma a uma), em grupos por cor e espessura.
  // A espessura é em pixels da tela (vector-effect: non-scaling-stroke) e muda com o zoom no grupo.
  const grupos = new Map<string, { g: SVGGElement; base: number }>();
  const grupo = (sinal: number, w: number) => {
    const base = Math.max(0.25, Math.round(w * 4) / 4);
    const chave = `${sinal}:${base}`;
    if (!grupos.has(chave)) {
      const g = criar("g", { stroke: sinal > 0 ? VERDE : VERMELHO }, camadaLigacoes);
      grupos.set(chave, { g, base });
    }
    return grupos.get(chave)!.g;
  };
  const ligacoes = MUNDO.ligacoes.map(([a, b, sinal, w, op]) =>
    criar(
      "path",
      {
        d: `M${N[a][0]} ${N[a][1]}L${N[b][0]} ${N[b][1]}`,
        "stroke-opacity": (Math.round(op * 3) / 3) * 0.85,
        opacity: 0,
        "vector-effect": "non-scaling-stroke",
      },
      grupo(sinal, w),
    ),
  );
  const bracos = MUNDO.bracos.map(([, , w]) =>
    criar("path", { "stroke-opacity": 0.85, "vector-effect": "non-scaling-stroke" }, grupo(1, w)),
  );

  // Neurônios acesos (anel aqua por cima do cinza) e a piscada de quando o pulso chega.
  const acesos = N.map(([x, y, r]) =>
    criar("circle", { cx: x, cy: y, r: r * 0.83, fill: "#FFFFFF", stroke: AQUA, "stroke-width": r * 0.35, opacity: 0 }, camadaNeuronios),
  );
  const piscadas = N.map(([x, y, r]) => {
    const g = criar("g", { opacity: 0, fill: AQUA }, camadaPiscadas);
    criar("circle", { cx: x, cy: y, r: r * 2.5, "fill-opacity": 0.25 }, g);
    criar("circle", { cx: x, cy: y, r }, g);
    return g;
  });

  const novoPulso = (): Pulso => {
    const g = criar("g", { visibility: "hidden" }, camadaPulsos);
    return {
      g,
      brilho: criar("circle", { r: 1, "fill-opacity": 0.28 }, g),
      nucleo: criar("circle", { r: 1 }, g),
    };
  };
  const desenharPulso = (p: Pulso, x: number, y: number, zoom: number, visivel: boolean) => {
    p.g.setAttribute("visibility", visivel ? "visible" : "hidden");
    if (!visivel) return;
    const r = raioDoPulso(zoom) / zoom;
    p.g.setAttribute("transform", `translate(${x} ${y})`);
    p.brilho.setAttribute("r", String(r * 1.6));
    p.nucleo.setAttribute("r", String(r * 0.6));
  };

  // ---------- câmera ----------
  let zoomAtual = Z0;
  const camera = { lz: Math.log(Z0) };
  const aplicarCamera = () => {
    const z = Math.exp(camera.lz);
    zoomAtual = z;
    mundo.setAttribute("transform", transformDaCamera(z));
    aqua.setAttribute("transform", transformDaAqua(z));
    cinza.setAttribute("stroke-width", String(Math.max(0.6, 0.6 * z)));
    for (const { g, base } of grupos.values()) g.setAttribute("stroke-width", String(Math.max(0.8, base * z ** 0.75 * 1.25)));
    MUNDO.bracos.forEach(([lado, i], k) => {
      const [x, y] = bracinho(lado, z);
      bracos[k].setAttribute("d", `M${x} ${y}L${N[i][0]} ${N[i][1]}`);
    });
  };
  aplicarCamera();

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.to(camera, { lz: 0, duration: DURACAO_CAMERA, ease: "sine.inOut", onUpdate: aplicarCamera }, INICIO);

  // ---------- onda: cada neurônio acende quando o pulso chega ----------
  const quando = (i: number) => INICIO + MUNDO.acende[i];
  N.forEach((_, i) => {
    const t = quando(i);
    tl.to(acesos[i], { opacity: 1, duration: 0.25 }, t);
    tl.to(piscadas[i], { keyframes: [{ opacity: 1, duration: 0.1 }, { opacity: 0, duration: 0.6 }] }, t);
  });
  MUNDO.ligacoes.forEach(([a, b], k) => {
    tl.to(ligacoes[k], { opacity: 1, duration: 0.3 }, Math.max(quando(a), quando(b)));
  });

  // Pulsos: andam pela ligação que trouxe a onda até cada neurônio (de um bracinho ou de outro neurônio).
  MUNDO.origem.forEach((de, j) => {
    if (de === null) return;
    const saida = de >= 0 ? quando(de) : 0;
    const duracao = quando(j) - saida;
    if (duracao < 0.05) return;
    const pulso = novoPulso();
    const p = { u: 0 };
    tl.to(
      p,
      {
        u: 1,
        duration: duracao,
        onUpdate: () => {
          const [x0, y0] = de >= 0 ? [N[de][0], N[de][1]] : bracinho(MUNDO.bracos[-de - 1][0], zoomAtual);
          const [x1, y1] = N[j];
          desenharPulso(pulso, x0 + (x1 - x0) * p.u, y0 + (y1 - y0) * p.u, zoomAtual, p.u > 0 && p.u < 1);
        },
      },
      saida,
    );
  });

  // A Aqua troca de quadro (olho normal -> feliz); o GSAP só marca a hora.
  tl.set(q("[data-olho='normal']"), { attr: { visibility: "hidden" } }, OLHO_FELIZ);
  tl.set(q("[data-olho='feliz']"), { attr: { visibility: "visible" } }, OLHO_FELIZ);

  // Depois do fim: pulsos lentos por ligações sorteadas, em ciclo.
  const pulsosLentos = () => {
    const ciclo = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
    for (let k = 0; k < 18; k++) {
      const [a, b] = MUNDO.ligacoes[Math.floor(Math.random() * MUNDO.ligacoes.length)];
      const pulso = novoPulso();
      const p = { u: 0 };
      ciclo.to(
        p,
        {
          u: 1,
          duration: 1.8,
          onUpdate: () => {
            const [x0, y0] = N[a];
            const [x1, y1] = N[b];
            desenharPulso(pulso, x0 + (x1 - x0) * p.u, y0 + (y1 - y0) * p.u, 1, p.u > 0 && p.u < 1);
          },
        },
        k * 0.45,
      );
    }
    return ciclo;
  };

  return { tl, aplicarCamera, pulsosLentos };
}

export function CenaHeroi() {
  const svg = useRef<SVGSVGElement>(null);
  const tocando = useRef<gsap.core.Timeline[]>([]);
  const [pausada, setPausada] = useState(false);
  const [comMovimento, setComMovimento] = useState(true);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      { mover: "(prefers-reduced-motion: no-preference)", parar: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { tl, aplicarCamera, pulsosLentos } = montarCena(svg.current!);
        if (ctx.conditions?.parar) {
          // Quem pediu menos movimento vê só o último quadro, parado.
          tl.progress(1, true);
          aplicarCamera();
          setComMovimento(false);
          tocando.current = [];
          return;
        }
        setComMovimento(true);
        tocando.current = [tl];        tl.eventCallback("onComplete", () => {
          ctx.add(() => {
            tocando.current = [pulsosLentos()];
          });
        });
      },
      svg,
    );
    return () => mm.revert();
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
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          style={{
            maskImage: "radial-gradient(closest-side, #000 55%, transparent)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent)",
          }}
          role="img"
          aria-label="A Aqua no meio de muitos neurônios. Pulsos saem dos bracinhos dela e cada neurônio acende quando o pulso chega, enquanto a câmera se afasta até mostrar todos acesos."
        >
          <defs>
            <radialGradient id="cena-brilho">
              <stop offset="0" stopColor={AQUA} stopOpacity={0.22} />
              <stop offset="0.6" stopColor="#378ADD" stopOpacity={0.04} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={CX} cy={CY} rx={560} ry={300} fill="url(#cena-brilho)" />
          <g data-mundo transform={transformDaCamera(Z0)}>
            <path
              data-ligacoes-cinza
              d={LIGACOES_CINZA}
              stroke={CINZA_LIGACAO}
              strokeOpacity={0.1}
              strokeWidth={0.6 * Z0}
              vectorEffect="non-scaling-stroke"
            />
            <g data-ligacoes-acesas data-camada />
            <g strokeLinecap="round">
              {PONTOS_POR_RAIO.map(({ r, d }) => (
                <g key={r}>
                  <path d={d} stroke={CINZA_NEURONIO} strokeWidth={2 * r} />
                  <path d={d} stroke="#FFFFFF" strokeWidth={1.35 * r} />
                </g>
              ))}
            </g>
            <g data-neuronios-acesos data-camada />
            <g data-piscadas data-camada />
            <g data-pulsos data-camada fill={AQUA} />
          </g>
          <g data-aqua transform={transformDaAqua(Z0)}>
            <Pixels celulas={CORPO} />
            {/* visibility explícito: o GSAP guarda esse valor para poder desfazer a troca */}
            <g data-olho="normal" visibility="visible">
              <Pixels celulas={OLHOS_NORMAIS} />
            </g>
            <g data-olho="feliz" visibility="hidden">
              <Pixels celulas={OLHOS_FELIZES} />
            </g>
          </g>
        </svg>
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
