"use client";

import { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
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

/** O QR code que leva direto à tela de apelido, com o código preenchido (decisão 7). */
export function QrCode({ texto, tamanho = 260, className = "" }: { texto: string; tamanho?: number; className?: string }) {
  const { n, escuros } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    const escuros: [number, number][] = [];
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (qr.isDark(l, c)) escuros.push([c, l]);
    return { n, escuros };
  }, [texto]);
  const margem = 2;
  return (
    <svg
      viewBox={`${-margem} ${-margem} ${n + margem * 2} ${n + margem * 2}`}
      width={tamanho}
      height={tamanho}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code para ${texto}`}
      className={className}
    >
      <rect x={-margem} y={-margem} width={n + margem * 2} height={n + margem * 2} fill="#FFFFFF" />
      <path d={escuros.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join("")} fill="#1D1D1F" />
    </svg>
  );
}

/** O endereço da tela do aluno, com o código. */
export function linkDoAluno(codigo: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${base}/quiz/entrar/?codigo=${codigo}`;
}

/** "1º" */
export const ordinal = (n: number) => `${n}º`;
