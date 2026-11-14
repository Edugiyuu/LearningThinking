"use client";

import { useEffect, useState } from "react";
import { BOCHECHA, OLHO, PORTA, Pixels, type Celula } from "@/components/mascote";
import { nomeAssunto, type Assunto } from "@/lib/quiz/perguntas";

/** O relógio da tela: muda a cada `ms` para o cronômetro andar. */
export function useAgora(ms = 250) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return agora;
}

export const segundosAte = (prazo: number | null, agora: number) => (prazo === null ? 0 : Math.max(0, Math.ceil((prazo - agora) / 1000)));

export function ChipAssunto({ assunto }: { assunto: Assunto }) {
  return <span className="rounded-full bg-aqua/20 px-3 py-1 text-[13px] font-semibold whitespace-nowrap text-aqua-on">{nomeAssunto(assunto)}</span>;
}

/** O cronômetro redondo da tela projetada. */
export function CronometroRedondo({ restante, total, tamanho = 64 }: { restante: number; total: number; tamanho?: number }) {
  const r = tamanho / 2 - 5;
  const volta = 2 * Math.PI * r;
  const fracao = total > 0 ? Math.min(1, restante / total) : 0;
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }} role="timer" aria-label={`${restante} segundos`}>
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} className="size-full -rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="#FFFFFF" stroke="#E5E5EA" strokeWidth={5} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={restante <= 5 ? "#E5736F" : "#0E7C86"}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={volta}
          strokeDashoffset={volta * (1 - fracao)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl font-bold tabular-nums">{restante}</span>
    </div>
  );
}

/** A barra fina de tempo, no topo da tela do aluno. */
export function BarraDeTempo({ restante, total }: { restante: number; total: number }) {
  const fracao = total > 0 ? Math.min(1, restante / total) : 0;
  return (
    <div className="h-1.5 w-full bg-black/[.08]" aria-hidden>
      <div className={`h-full ${restante <= 5 ? "bg-[#E5736F]" : "bg-aqua-ink"}`} style={{ width: `${fracao * 100}%` }} />
    </div>
  );
}

export const LETRAS = ["A", "B", "C", "D", "E"];

/** As cores das Aquas do pódio: cada apelido tem sempre a mesma. */
const CORES_DAS_AQUAS = ["#5ED3DB", "#E8853A", "#8E7CF0", "#F2C94C", "#6FCF97", "#F28CB1", "#4F8EF7"];

export function corDoApelido(apelido: string): string {
  let h = 0;
  for (const c of apelido) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES_DAS_AQUAS[h % CORES_DAS_AQUAS.length];
}

/**
 * A Aqua de um aluno no pódio (grade 10 × 6, como a do mascote), na cor do apelido.
 * Os olhos mudam com o que aconteceu: contente (acertou), olhando para baixo (errou) ou dormindo.
 */
export function AquaDaCor({ apelido, como, unidade = 4 }: { apelido: string; como: "acertou" | "errou" | "sem-resposta"; unidade?: number }) {
  const cor = corDoApelido(apelido);
  const olhos: Celula[] =
    como === "acertou"
      ? [
          [3, 1, 1, 2, OLHO],
          [6, 1, 1, 2, OLHO],
          [2, 3, 1, 1, BOCHECHA],
          [7, 3, 1, 1, BOCHECHA],
        ]
      : como === "errou"
        ? [
            [3, 3, 1, 1, OLHO],
            [6, 3, 1, 1, OLHO],
          ]
        : [
            [2, 2, 2, 1, OLHO],
            [6, 2, 2, 1, OLHO],
          ];
  const celulas: Celula[] = [
    [1, 0, 8, 5, cor],
    ...olhos,
    [0, 2, 1, 1, PORTA],
    [9, 2, 1, 1, PORTA],
    [2, 5, 1, 1, cor],
    [7, 5, 1, 1, cor],
  ];
  return <Pixels celulas={celulas} colunas={10} linhas={6} unidade={unidade} style={como === "acertou" ? undefined : { opacity: 0.5 }} />;
}

/** O endereço da tela do aluno, com o código. */
export function linkDoAluno(codigo: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${base}/quiz/entrar/?codigo=${codigo}`;
}

/** "1º" */
export const ordinal = (n: number) => `${n}º`;
