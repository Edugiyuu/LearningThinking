"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { fmt, fmtPeso } from "@/lib/quiz/numeros";
import type { Desenho } from "@/lib/quiz/perguntas";
import { CANAIS, LINHAS, nomeNeuronio, type NeuronioId } from "@/lib/quiz/rede-quiz";

// Quiz ao vivo (ADR-0034): a rede desenhada, versão simples do canvas do lab (só desenho, sem
// React Flow e sem arrastar nada). Verde = peso positivo, vermelho = negativo, mais grossa = peso maior.
// A rede com os números fica só no projetor (RedeDesenho). O computador do aluno mostra a MiniRede:
// só o formato, com o lugar da resposta em destaque.

type Ponto = { x: number; y: number };

const L = 900;
const A = 400;
const POS: Record<string, Ponto> = {
  "e#0": { x: 190, y: 110 },
  "e#1": { x: 190, y: 210 },
  "e#2": { x: 190, y: 310 },
  n1: { x: 480, y: 150 },
  n2: { x: 480, y: 270 },
  s: { x: 770, y: 210 },
};
const TITULOS = [
  { texto: "Entrada", x: 190, y: 34 },
  { texto: "Camada 1", sub: "ReLU", x: 480, y: 34 },
  { texto: "Saída", sub: "sigmoide", x: 770, y: 34 },
];

const ao = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const pontas = (id: string) => {
  const [de, para] = id.split("->");
  return { a: POS[de], b: POS[para] };
};
/** onde fica a etiqueta do peso de cada linha (sem encavalar uma na outra) */
const ondePeso = (id: string) => {
  const { a, b } = pontas(id);
  return ao(a, b, id.startsWith("e#") ? 0.3 : 0.5);
};

const VERDE = "#3FAE79";
const VERMELHO = "#E5736F";
const TEAL = "#0E7C86";
const CINZA = "#C7C7CC";

function Titulos() {
  return (
    <g fontFamily="var(--font-inter)" textAnchor="middle">
      {TITULOS.map((t) => (
        <g key={t.texto}>
          <text x={t.x} y={t.y} fontSize={17} fontWeight={700} fill="#1D1D1F">{t.texto}</text>
          {t.sub && <text x={t.x} y={t.y + 20} fontSize={13} fill="#86868B">{t.sub}</text>}
        </g>
      ))}
    </g>
  );
}

/** Pisca o que está em destaque quando a pergunta aparece (GSAP, como no lab). */
function usePiscar(raiz: React.RefObject<HTMLDivElement | null>, chave: unknown) {
  useEffect(() => {
    if (!raiz.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (raiz.current.querySelectorAll("[data-destaque='sim']").length === 0) return;
    // context + revert: ao limpar, o GSAP devolve o estilo original
    const ctx = gsap.context(() => {
      // repeat par com yoyo: a última volta termina em 1 (com repeat ímpar ela terminava apagada, em 0,2)
      gsap.timeline().fromTo("[data-destaque='sim']", { opacity: 0.2 }, { opacity: 1, duration: 0.35, repeat: 4, yoyo: true, ease: "power1.inOut" });
    }, raiz);
    return () => ctx.revert();
  }, [raiz, chave]);
}

/** A rede com todos os números, no projetor. */
export function RedeDesenho({ desenho: d, linhaDaPergunta, className = "" }: { desenho: Desenho; linhaDaPergunta?: string; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const temDestaque = d.destaque.length > 0 || !!linhaDaPergunta;
  const destacado = (id: string) => d.destaque.includes(id) || id === linhaDaPergunta;
  usePiscar(raiz, d);

  const texto = (n: NeuronioId) => d.textos[n] ?? "";
  const apagado = (n: NeuronioId) => d.apagados.includes(n);

  return (
    <div ref={raiz} className={`relative w-full ${className}`}>
      <svg viewBox={`0 0 ${L} ${A}`} className="block h-auto w-full select-none" role="img" aria-label="A rede: Entrada com R, G e B, Camada 1 com 2 neurônios (ReLU) e a Saída (sigmoide).">
        <Titulos />

        {/* as linhas */}
        <g fill="none" strokeLinecap="round">
          {LINHAS.map((id) => {
            const { a, b } = pontas(id);
            const w = d.pesos[id] ?? 0;
            const forte = destacado(id);
            const largura = 1.5 + Math.abs(w) * 1.3;
            return (
              <g key={id}>
                {/* a linha da pergunta ganha uma faixa teal por trás: a cor dela continua dizendo o sinal do peso */}
                {forte && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={TEAL} strokeOpacity={0.22} strokeWidth={largura + 14} />}
                <line
                  data-destaque={forte ? "sim" : undefined}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={w >= 0 ? VERDE : VERMELHO}
                  strokeWidth={forte ? largura + 2 : largura}
                  strokeOpacity={temDestaque && !forte ? 0.25 : 1}
                />
              </g>
            );
          })}
        </g>

        {/* os pesos */}
        <g fontFamily="var(--font-inter)" fontSize={14} fontWeight={700} textAnchor="middle">
          {LINHAS.map((id) => {
            const w = d.pesos[id] ?? 0;
            const p = ondePeso(id);
            const forte = destacado(id);
            if (temDestaque && !forte && !id.endsWith("->s")) return null; // só os da pergunta, para não poluir
            return (
              <g key={id} opacity={temDestaque && !forte ? 0.55 : 1}>
                <rect x={p.x - 33} y={p.y - 13} width={66} height={26} rx={13} fill={forte ? "#E6F8FA" : "#FFFFFF"} stroke={forte ? TEAL : w >= 0 ? VERDE : VERMELHO} />
                <text x={p.x} y={p.y + 5} fill={forte ? "#06363A" : "#1D1D1F"}>{fmtPeso(w)}</text>
              </g>
            );
          })}
        </g>

        {/* a cor que entra */}
        <rect x={62} y={192} width={40} height={40} rx={10} fill={d.cor} stroke="#00000014" />
        <text x={82} y={256} fontFamily="var(--font-inter)" fontSize={12} fill="#86868B" textAnchor="middle">a cor</text>

        {/* os neurônios */}
        <g fontFamily="var(--font-inter)" textAnchor="middle">
          {[0, 1, 2].map((c) => {
            const p = POS[`e#${c}`];
            return (
              <g key={c}>
                <text x={144} y={p.y + 5} fontSize={14} fontWeight={700} fill="#6E6E73">{CANAIS[c]}</text>
                <circle cx={p.x} cy={p.y} r={28} fill="#FFFFFF" stroke="#1D1D1F" strokeWidth={2} />
                <text x={p.x} y={p.y + 6} fontSize={16} fontWeight={700} fill="#1D1D1F">{fmt(d.entradas[c])}</text>
              </g>
            );
          })}
          {(["n1", "n2"] as const).map((n) => {
            const p = POS[n];
            const off = apagado(n);
            const alvo = texto(n) === "?";
            return (
              <g key={n} data-destaque={destacado(n) ? "sim" : undefined}>
                <circle cx={p.x} cy={p.y} r={32} fill={alvo ? "#E6F8FA" : off ? "#F2F2F4" : "#FFFFFF"} stroke={alvo ? TEAL : off ? "#AEAEB2" : "#1D1D1F"} strokeWidth={alvo ? 3 : 2} strokeDasharray={alvo ? "6 5" : undefined} />
                <text x={p.x} y={p.y + 6} fontSize={alvo ? 22 : 16} fontWeight={700} fill={alvo ? TEAL : off ? "#8E8E93" : "#1D1D1F"}>{texto(n)}</text>
                <text x={p.x} y={p.y + 52} fontSize={12} fill="#86868B">{nomeNeuronio(n)}</text>
              </g>
            );
          })}
          {(() => {
            const p = POS.s;
            const alvo = texto("s") === "?";
            return (
              <g data-destaque={destacado("s") ? "sim" : undefined}>
                <circle cx={p.x} cy={p.y} r={44} fill="#E6F8FA" stroke={TEAL} strokeWidth={alvo ? 3 : 2} strokeDasharray={alvo ? "6 5" : undefined} />
                <text x={p.x} y={p.y + 7} fontSize={alvo ? 26 : 20} fontWeight={700} fill={TEAL}>{texto("s")}</text>
                {d.objetivo !== undefined && (
                  <text x={770} y={280} fontSize={13} fontWeight={600} fill="#6E6E73">
                    certo: {d.objetivo} ({d.objetivo === 1 ? "laranja" : "azul"})
                  </text>
                )}
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}

/**
 * A mini-rede da tela do aluno: só o formato, sem números (eles estão no projetor). Mostra onde
 * a resposta entra: o neurônio da resposta (digitar) ou a linha da pergunta (subir, descer, não mudar).
 */
export function MiniRede({ neuronio, linha, className = "" }: { neuronio?: NeuronioId; linha?: string; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  usePiscar(raiz, neuronio ?? linha);
  const etiquetaDaLinha = linha ? ondePeso(linha) : null;

  return (
    <div ref={raiz} className={`relative w-full ${className}`}>
      <svg viewBox={`0 0 ${L} ${A}`} className="block h-auto w-full select-none" role="img" aria-label={neuronio ? `A rede, com o ${nomeNeuronio(neuronio)} em destaque: a sua resposta entra aqui.` : "A rede, com a linha da pergunta em destaque."}>
        <Titulos />
        <g fill="none" strokeLinecap="round">
          {LINHAS.map((id) => {
            const { a, b } = pontas(id);
            const forte = id === linha;
            return (
              <g key={id}>
                {forte && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={TEAL} strokeOpacity={0.22} strokeWidth={20} />}
                <line data-destaque={forte ? "sim" : undefined} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={forte ? TEAL : CINZA} strokeWidth={forte ? 6 : 2.5} />
              </g>
            );
          })}
        </g>
        {etiquetaDaLinha && (
          <g fontFamily="var(--font-inter)" textAnchor="middle">
            <rect x={etiquetaDaLinha.x - 54} y={etiquetaDaLinha.y - 16} width={108} height={32} rx={16} fill={TEAL} />
            <text x={etiquetaDaLinha.x} y={etiquetaDaLinha.y + 6} fontSize={16} fontWeight={700} fill="#FFFFFF">esta linha</text>
          </g>
        )}
        <g fontFamily="var(--font-inter)" textAnchor="middle">
          {[0, 1, 2].map((c) => {
            const p = POS[`e#${c}`];
            return (
              <g key={c}>
                <circle cx={p.x} cy={p.y} r={28} fill="#FFFFFF" stroke={CINZA} strokeWidth={2} />
                <text x={p.x} y={p.y + 6} fontSize={16} fontWeight={700} fill="#8E8E93">{CANAIS[c]}</text>
              </g>
            );
          })}
          {(["n1", "n2", "s"] as const).map((n) => {
            const p = POS[n];
            const r = n === "s" ? 44 : 32;
            const alvo = n === neuronio;
            return (
              <g key={n}>
                <circle
                  data-destaque={alvo ? "sim" : undefined}
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={alvo ? "#E6F8FA" : "#FFFFFF"}
                  stroke={alvo ? TEAL : CINZA}
                  strokeWidth={alvo ? 4 : 2}
                  strokeDasharray={alvo ? "8 6" : undefined}
                />
                {alvo && <text x={p.x} y={p.y + 9} fontSize={28} fontWeight={700} fill={TEAL}>?</text>}
                {n !== "s" && <text x={p.x} y={p.y + r + 20} fontSize={13} fill="#86868B">{nomeNeuronio(n)}</text>}
                {alvo && (
                  <text x={p.x} y={p.y + r + (n === "s" ? 30 : 42)} fontSize={16} fontWeight={700} fill={TEAL}>
                    a sua resposta entra aqui
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** A barra de 0 (azul) a 1 (laranja) com a resposta marcada: o "termômetro" das perguntas de Saída e Erro. */
export function Termometro({ saida, objetivo }: { saida: number; objetivo?: 0 | 1 }) {
  return (
    <div className="w-full">
      {/* o certo, em destaque com a cor: só a ponta da barra escrita "o certo" passava despercebida */}
      {objetivo !== undefined && (
        <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2">
          <span className="size-8 rounded-lg" style={{ background: objetivo === 1 ? "#E8853A" : "#378ADD" }} aria-hidden />
          <span className="text-base">
            O certo é <b>{objetivo === 1 ? "laranja (1)" : "azul (0)"}</b>
          </span>
        </div>
      )}
      <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg, #378ADD, #D9D9DE, #E8853A)" }}>
        <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text bg-white" style={{ left: `${saida * 100}%` }} aria-hidden />
      </div>
      <div className="mt-2 flex justify-between text-xs text-text-muted">
        <span>0 = azul{objetivo === 0 ? " · o certo" : ""}</span>
        <span className="font-semibold text-text">resposta: {fmt(saida)}</span>
        <span>{objetivo === 1 ? "o certo · " : ""}1 = laranja</span>
      </div>
    </div>
  );
}
