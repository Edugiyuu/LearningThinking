"use client";

// Aba "Perguntar à Aqua" (ADR-0028): a tela é toda dela. O aluno escolhe uma cor, a Aqua "pensa"
// e responde com o forward pass da rede do projeto. "Ver como ela pensou" dá zoom na cabeça dela
// e abre o laboratório no passo a passo com essa cor.

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { AquaAnimada, CABECA, type MomentoAqua } from "@/components/aqua-animada";
import { formatar, type SaidaData } from "@/lib/rede";
import type { RespostaAqua } from "@/lib/aqua";

const TEMPO_PENSANDO = 1; // s: a conta leva milissegundos; o tempo é para o aluno ver que ela está fazendo algo
const ZOOM = 14;

export type ConversaAqua = { cor: string; resposta: RespostaAqua | null };

const semMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AbaAqua({
  conversa,
  setConversa,
  perguntar,
  rotulos,
  chegandoDoLab,
  onVerComoPensou,
}: {
  conversa: ConversaAqua;
  setConversa: (c: ConversaAqua) => void;
  perguntar: (cor: string) => RespostaAqua | null;
  rotulos: SaidaData;
  /** Voltando do "ver como ela pensou": o zoom acontece ao contrário. */
  chegandoDoLab: boolean;
  onVerComoPensou: () => void;
}) {
  const { cor, resposta } = conversa;
  const [pensando, setPensando] = useState(false);
  const aba = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const branco = useRef<HTMLDivElement>(null);
  const espera = useRef<gsap.core.Tween | null>(null);

  useEffect(() => () => void espera.current?.kill(), []);

  // volta do laboratório: o branco some e a cabeça encolhe até a Aqua inteira aparecer
  useLayoutEffect(() => {
    if (!chegandoDoLab || semMovimento()) return;
    const tl = gsap.timeline();
    tl.call(() => aba.current?.classList.add("zoom"))
      .set(palco.current, { scale: ZOOM, transformOrigin: origem })
      .set(branco.current, { autoAlpha: 1 })
      .to(branco.current, { autoAlpha: 0, duration: 0.25 })
      .to(palco.current, { scale: 1, duration: 0.6, ease: "power2.out", clearProps: "transform" }, 0.1)
      .call(() => aba.current?.classList.remove("zoom"));
    return () => void tl.kill();
  }, [chegandoDoLab]);

  const momento: MomentoAqua = pensando ? "pensando" : !resposta ? "esperando" : resposta.certeza === "confiante" ? "certa" : "duvida";
  const nome = (r: 0 | 1) => (r === 1 ? rotulos.rotulo1 : rotulos.rotulo0);

  const clicarPerguntar = () => {
    setPensando(true);
    setConversa({ cor, resposta: null });
    espera.current = gsap.delayedCall(semMovimento() ? 0.3 : TEMPO_PENSANDO, () => {
      setPensando(false);
      setConversa({ cor, resposta: perguntar(cor) });
    });
  };

  // aproxima até a cabeça cobrir tudo, fica branco e o laboratório aparece (o Lab tira o branco):
  // é entrar nos neurônios dela. Só o "ver como ela pensou" faz isso; o "Voltar ao laboratório" é direto.
  const verComoPensou = () => {
    if (semMovimento()) return onVerComoPensou();
    gsap
      .timeline({ onComplete: onVerComoPensou })
      .call(() => aba.current?.classList.add("zoom")) // a Aqua passa na frente de tudo e a tela não ganha rolagem
      .to(palco.current, { scale: ZOOM, transformOrigin: origem, duration: 0.8, ease: "power2.in" })
      .to(branco.current, { autoAlpha: 1, duration: 0.2 }, 0.6);
  };

  return (
    <div ref={aba} className="aqua-aba">
      <h1>Perguntar à Aqua</h1>
      <p className="aqua-sub">Ela usa a rede que você treinou neste projeto. Escolha uma cor e veja o que ela acha.</p>

      <div className="aqua-cena">
        <div ref={palco} className="aqua-palco">
          <AquaAnimada key={momento} momento={momento} cor={cor} unidade={10} rotulo={rotuloDaAqua(momento)} />
        </div>
        <div className="aqua-balao" aria-live="polite">
          {pensando ? (
            <Pensando />
          ) : !resposta ? (
            <p>Oi! Escolha uma cor e me pergunte o que ela é.</p>
          ) : (
            <>
              {resposta.certeza === "confiante" ? (
                <p className="aqua-frase">É {nome(resposta.resposta)}!</p>
              ) : (
                <p className="aqua-frase">
                  Hmm… não tenho certeza. Acho que é <b>{nome(resposta.resposta)}</b>.
                </p>
              )}
              <RespostaDaRede saida={resposta.saida} rotulos={rotulos} />
              <button className="aqua-ver" onClick={verComoPensou}>
                ver como ela pensou →
              </button>
            </>
          )}
        </div>
      </div>

      <div className="aqua-cartao">
        <RodaDeCores cor={cor} setCor={(c) => setConversa({ cor: c, resposta })} />
        <div className="aqua-escolha">
          <div className="aqua-amostra-linha">
            <span className="aqua-amostra" style={{ background: cor }} />
            <span>
              <span className="aqua-rotulo">Cor escolhida</span>
              <b>{cor.toUpperCase()}</b>
            </span>
          </div>
          <CamposRGB cor={cor} setCor={(c) => setConversa({ cor: c, resposta })} />
          <button className="botao escuro aqua-perguntar" onClick={clicarPerguntar} disabled={pensando}>
            {resposta ? "Perguntar de novo" : "Perguntar"}
          </button>
        </div>
      </div>

      <div ref={branco} className="aqua-branco" />
    </div>
  );
}

const origem = `${CABECA.x * 100}% ${CABECA.y * 100}%`;

function rotuloDaAqua(m: MomentoAqua) {
  return { esperando: "A Aqua acenando", pensando: "A Aqua pensando, com a mão no queixo", certa: "A Aqua pulando de alegria", duvida: "A Aqua coçando a cabeça", dormindo: "A Aqua dormindo" }[m];
}

/**
 * A resposta da rede em destaque: o número grande e uma barra de 0 a 1 com um marcador onde a
 * Saída caiu. As pontas usam as etiquetas e as cores do bloco Saída.
 */
function RespostaDaRede({ saida, rotulos }: { saida: number; rotulos: SaidaData }) {
  const pos = Math.min(1, Math.max(0, saida)) * 100;
  return (
    <div className="aqua-resposta">
      <span className="aqua-resposta-rotulo">resposta da rede</span>
      <b className="aqua-resposta-numero">{formatar(saida)}</b>
      <div
        className="aqua-barra"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={saida}
        aria-label={`Resposta da rede, de 0 (${rotulos.rotulo0}) a 1 (${rotulos.rotulo1})`}
        style={{ background: `linear-gradient(to right, ${rotulos.cor0}, #d9d9de, ${rotulos.cor1})` }}
      >
        <span className="aqua-barra-marca" style={{ left: `${pos}%` }} />
      </div>
      <div className="aqua-barra-pontas">
        <span style={{ color: rotulos.cor0 }}>0 = {rotulos.rotulo0}</span>
        <span style={{ color: rotulos.cor1 }}>1 = {rotulos.rotulo1}</span>
      </div>
    </div>
  );
}

/** "Pensando…" com os três pontinhos aparecendo um de cada vez. */
function Pensando() {
  const [pontos, setPontos] = useState(1);
  useEffect(() => {
    if (semMovimento()) return;
    const tl = gsap.timeline({ repeat: -1 });
    [2, 3, 1].forEach((n, i) => tl.call(() => setPontos(n), [], (i + 1) * 0.3));
    return () => void tl.kill();
  }, []);
  return (
    <>
      <p className="aqua-frase">Pensando{".".repeat(pontos)}</p>
      <p className="aqua-numero">rodando a rede neural</p>
    </>
  );
}

/* ---------- O seletor: a única parte que sabe que a entrada é uma cor (ADR-0028, seção E) ---------- */

const paraHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
const deHex = (cor: string) => [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16) / 255);

/** Matiz (0 a 360) de uma cor, para pôr o marcador na roda. */
function matiz(cor: string) {
  const [r, g, b] = deHex(cor);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** A cor pura de uma matiz (saturação e brilho no máximo). */
function corDaMatiz(h: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return 1 - Math.max(0, Math.min(k, 4 - k, 1));
  };
  return paraHex([f(5), f(3), f(1)]);
}

function RodaDeCores({ cor, setCor }: { cor: string; setCor: (c: string) => void }) {
  const h = matiz(cor);
  const escolher = (e: PointerEvent<HTMLDivElement>) => {
    const caixa = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (caixa.left + caixa.width / 2);
    const dy = e.clientY - (caixa.top + caixa.height / 2);
    // 0° em cima, girando no sentido do relógio, igual ao conic-gradient
    setCor(corDaMatiz(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360));
  };
  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const passo = e.key === "ArrowRight" || e.key === "ArrowUp" ? 10 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -10 : 0;
    if (!passo) return;
    e.preventDefault();
    setCor(corDaMatiz((h + passo + 360) % 360));
  };
  const rad = (h * Math.PI) / 180;
  return (
    <div
      className="aqua-roda"
      role="slider"
      tabIndex={0}
      aria-label="Roda de cores"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(h)}
      aria-valuetext={cor.toUpperCase()}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        escolher(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && escolher(e)}
      onKeyDown={teclado}
    >
      <span className="aqua-roda-marca" style={{ left: `${50 + 42 * Math.sin(rad)}%`, top: `${50 - 42 * Math.cos(rad)}%`, background: corDaMatiz(h) }} />
    </div>
  );
}

/** R, G e B de 0 a 1: os mesmos números que a Entrada do lab manda para a rede. */
function CamposRGB({ cor, setCor }: { cor: string; setCor: (c: string) => void }) {
  const valores = deHex(cor).map((v) => Math.round(v * 100) / 100);
  const [rascunho, setRascunho] = useState<{ i: number; texto: string } | null>(null);
  const confirmar = () => {
    if (!rascunho) return;
    const n = Number(rascunho.texto.replace(",", "."));
    if (Number.isFinite(n)) setCor(paraHex(valores.map((v, j) => (j === rascunho.i ? Math.min(1, Math.max(0, n)) : v))));
    setRascunho(null);
  };
  return (
    <div className="aqua-rgb">
      {["R", "G", "B"].map((nome, i) => (
        <label key={nome}>
          <span>{nome}</span>
          <input
            inputMode="decimal"
            value={rascunho?.i === i ? rascunho.texto : formatar(valores[i])}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setRascunho({ i, texto: e.target.value })}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === "Enter" && confirmar()}
            aria-label={`${nome}, de 0 a 1`}
          />
        </label>
      ))}
    </div>
  );
}
