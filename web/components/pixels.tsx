"use client";

import { useSyncExternalStore } from "react";
import type { Celula } from "./mascote";

// Pixel art só fica certa quando cada célula ocupa um número INTEIRO de pixels da tela.
// Com a escala do Windows (125%, 150%…) e o zoom do navegador, "unidade 3" pode virar 4,5 pixels
// de tela: aí umas células arredondam para 5 e outras para 4 (um olho mais largo que o outro).
// Por isso a célula é arredondada para pixels inteiros da tela, levando em conta o devicePixelRatio.

function assinarEscala(avisar: () => void) {
  let consulta: MediaQueryList | null = null;
  const mudou = () => {
    ligar();
    avisar();
  };
  const ligar = () => {
    consulta?.removeEventListener("change", mudou);
    consulta = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    consulta.addEventListener("change", mudou);
  };
  ligar();
  return () => consulta?.removeEventListener("change", mudou);
}

const escalaDaTela = () => window.devicePixelRatio || 1;

/** Quantos pixels da tela cabem em 1 pixel do CSS (muda com o zoom e a escala do sistema). */
export function useEscalaDaTela() {
  return useSyncExternalStore(assinarEscala, escalaDaTela, () => 1);
}

export function Pixels({
  celulas,
  colunas,
  linhas,
  unidade,
  rotulo,
  className,
  style,
}: {
  celulas: Celula[];
  colunas: number;
  linhas: number;
  unidade: number;
  rotulo?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const escala = useEscalaDaTela();
  const passo = Math.max(1, Math.round(unidade * escala)) / escala; // célula em px do CSS, inteira na tela
  const w = colunas * passo;
  const h = linhas * passo;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${colunas} ${linhas}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      {celulas.map(([x, y, cw, ch, cor], i) => (
        <rect key={i} x={x} y={y} width={cw} height={ch} fill={cor} />
      ))}
    </svg>
  );
}
