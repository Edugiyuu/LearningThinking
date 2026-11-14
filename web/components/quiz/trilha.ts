"use client";

import { useEffect, useRef } from "react";

// Som do quiz ao vivo (só na aba do professor, que está no projetor):
// - quiz.mp3 toca em loop, baixinho, durante as perguntas e os resultados de cada pergunta;
// - results.mp3 toca uma vez quando o quiz acaba (pódio).
// Na sala de espera não toca nada. O "Começar" é um clique do professor, então o navegador deixa o som tocar.

type Fase = "espera" | "pergunta" | "resultado" | "fim";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const VOLUME_FUNDO = 0.35;

export function useTrilhaDoQuiz(fase: Fase, mudo: boolean) {
  const fundo = useRef<HTMLAudioElement | null>(null);
  const fim = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fundo.current = new Audio(`${base}/sons/quiz.mp3`);
    fundo.current.loop = true;
    fundo.current.volume = VOLUME_FUNDO;
    fim.current = new Audio(`${base}/sons/results.mp3`);
    return () => {
      fundo.current?.pause();
      fim.current?.pause();
    };
  }, []);

  useEffect(() => {
    const a = fundo.current;
    const b = fim.current;
    if (!a || !b) return;
    const tocando = fase === "pergunta" || fase === "resultado";
    if (tocando && !mudo) {
      if (a.paused) a.play().catch(() => {});
    } else {
      a.pause();
    }
    if (fase === "fim" && !mudo) {
      if (b.paused && !b.ended) b.play().catch(() => {}); // toca uma vez só: depois de acabar, não repete
    } else {
      b.pause();
    }
  }, [fase, mudo]);
}
