"use client";

import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

const FECHADO = 24; // largura do trilho quando o painel está recolhido

/**
 * Painel de um lado do laboratório que recolhe pela setinha do meio da borda (ADR-0031).
 * O movimento é uma timeline do GSAP: a largura encolhe, o conteúdo some e a seta gira.
 */
export default function LadoRecolhivel({ lado, nome, children }: { lado: "esquerda" | "direita"; nome: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(true);
  const caixa = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const seta = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  function alternar() {
    const abrir = !aberto;
    const largura = conteudo.current?.offsetWidth ?? 0;
    tl.current?.kill();
    tl.current = gsap
      .timeline({ defaults: { duration: 0.35, ease: "power2.inOut" } })
      .to(conteudo.current, { autoAlpha: abrir ? 1 : 0, duration: 0.2 }, abrir ? 0.15 : 0)
      .to(caixa.current, { width: abrir ? largura : FECHADO }, 0)
      .to(seta.current, { rotation: abrir ? 0 : 180 }, 0);
    setAberto(abrir);
  }

  const id = `painel-${nome.toLowerCase()}`;
  return (
    <div ref={caixa} className={`lado lado-${lado}`}>
      <div ref={conteudo} id={id} className="lado-conteudo" inert={!aberto}>
        {children}
      </div>
      <button
        className="seta-painel"
        onClick={alternar}
        aria-label={`${aberto ? "Recolher" : "Abrir"} painel de ${nome.toLowerCase()}`}
        aria-expanded={aberto}
        aria-controls={id}
        title={`${aberto ? "Recolher" : "Abrir"} ${nome.toLowerCase()}`}
      >
        <span ref={seta} aria-hidden>
          {lado === "esquerda" ? "‹" : "›"}
        </span>
      </button>
    </div>
  );
}
