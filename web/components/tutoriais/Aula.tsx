"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Aqua, AquaReacao } from "@/components/mascote";
import { salvarProgresso } from "@/lib/progresso-tutoriais";
import { formatar } from "@/lib/rede";
import { totalDePassos, type Conta, type Passo, type Teste, type Tutorial } from "@/lib/tutoriais";
import { AquaLampada, Palco, sigmoide, valorInicial } from "./visuais";

// Uma aula, igual aos frames "Tutorial · O neurônio · Desktop" e "Tutorial · fim com teste rápido".
// Palco à esquerda (muda uma coisa por passo), texto à direita, Anterior/Próximo embaixo.
// As setas do teclado também avançam. O passo fica na URL (?passo=3) e o progresso, no navegador.

const BOTAO_SECUNDARIO =
  "whitespace-nowrap rounded-full border border-black/15 bg-white px-6 py-3 text-[15px] font-medium transition-colors hover:bg-black/[.03] disabled:pointer-events-none disabled:opacity-40";
const BOTAO_ESCURO = "whitespace-nowrap rounded-full bg-text px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90";

export default function Aula({ tutorial, passoInicial }: { tutorial: Tutorial; passoInicial: number }) {
  const total = totalDePassos(tutorial);
  const [passo, setPasso] = useState(() => Math.min(Math.max(1, passoInicial), total));
  const atual: Passo | undefined = tutorial.passos[passo - 1]; // undefined = uma pergunta do teste rápido
  const nTeste = passo - tutorial.passos.length - 1; // índice da pergunta, quando é o teste
  const teste = atual ? undefined : tutorial.testes[nTeste];
  const ultimaPergunta = nTeste === tutorial.testes.length - 1;
  const [valor, setValor] = useState(() => (atual ? valorInicial(atual.visual) : 0));
  const [escolha, setEscolha] = useState<number | null>(null);
  const acertou = escolha !== null && Boolean(teste?.opcoes[escolha]?.certa);

  function irPara(n: number) {
    const proximo = Math.min(Math.max(1, n), total);
    if (proximo === passo) return;
    setPasso(proximo);
    const p = tutorial.passos[proximo - 1];
    setValor(p ? valorInicial(p.visual) : 0);
    setEscolha(null);
  }

  // Guarda onde o aluno parou e deixa o passo na URL, para recarregar sem perder o lugar
  useEffect(() => {
    salvarProgresso(tutorial.slug, { passo, concluido: false });
    window.history.replaceState(null, "", `?passo=${passo}`);
  }, [tutorial.slug, passo]);

  useEffect(() => {
    if (acertou && ultimaPergunta) salvarProgresso(tutorial.slug, { passo, concluido: true });
  }, [acertou, ultimaPergunta, tutorial.slug, passo]);

  const palcoRef = useRef<HTMLElement>(null);
  const textoRef = useRef<HTMLDivElement>(null);
  useEntradaDoPasso(palcoRef, textoRef, passo);
  usePulo(palcoRef, textoRef, escolha);

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select, [contenteditable]")) return; // o slider usa as setas
      if (e.key === "ArrowRight") irPara(passo + 1);
      if (e.key === "ArrowLeft") irPara(passo - 1);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  return (
    <div className="flex min-h-screen flex-col lg:h-dvh lg:min-h-0">
      <header className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-black/[.06] px-4 sm:px-8">
        <Link href="/tutoriais" className="text-sm whitespace-nowrap text-text-muted hover:text-text">
          ← Tutoriais
        </Link>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[15px] font-semibold">{tutorial.titulo}</p>
          <ol className="flex gap-1.5" aria-label={`Passo ${passo} de ${total}`}>
            {Array.from({ length: total }, (_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => irPara(i + 1)}
                  aria-label={`Ir para o passo ${i + 1}`}
                  aria-current={i + 1 === passo ? "step" : undefined}
                  className={`block h-1 w-6 rounded-full transition-colors sm:w-10 ${i < passo ? "bg-aqua" : "bg-[#E5E5EA] hover:bg-black/20"}`}
                />
              </li>
            ))}
          </ol>
        </div>
        <Link href="/" className="justify-self-end" aria-label="LearningThinking, início">
          <Aqua unidade={4} />
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-8 px-4 py-6 sm:px-8 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_476px] lg:gap-10 lg:py-8">
        <section
          ref={palcoRef}
          aria-label="Visualização"
          className="flex min-h-[320px] flex-col justify-center gap-6 overflow-hidden rounded-[24px] bg-bg-subtle p-4 sm:p-8 lg:min-h-0 lg:[&>svg]:min-h-0 lg:[&>svg]:flex-1"
        >
          {atual ? (
            <>
              <Palco visual={atual.visual} valor={valor} />
              <Controle passo={atual} valor={valor} onValor={setValor} />
            </>
          ) : teste?.visual ? (
            <Palco visual={teste.visual} valor={0} estado={escolha === null ? "pergunta" : acertou ? "certo" : "errado"} />
          ) : (
            <Fim tutorial={tutorial} acertou={acertou} />
          )}
        </section>

        <section aria-live="polite" className="flex flex-col lg:min-h-0">
          <p className="text-[13px] font-semibold text-aqua-ink">
            Passo {passo} de {total}
            {atual ? (atual.assunto ? ` · ${atual.assunto}` : "") : ` · Teste rápido${tutorial.testes.length > 1 ? ` · ${nTeste + 1} de ${tutorial.testes.length}` : ""}`}
          </p>
          <div ref={textoRef} className="flex flex-col lg:-mr-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-3">
            {atual ? (
              <TextoDoPasso passo={atual} valor={valor} />
            ) : (
              teste && <TesteRapido teste={teste} ultima={ultimaPergunta} escolha={escolha} onEscolha={setEscolha} acertou={acertou} />
            )}
          </div>

          <nav className="mt-10 flex shrink-0 items-center justify-between gap-4 pb-2 lg:mt-0 lg:pt-6">
            <button type="button" className={BOTAO_SECUNDARIO} disabled={passo === 1} onClick={() => irPara(passo - 1)}>
              ← Anterior
            </button>
            {atual && <span className="hidden text-xs whitespace-nowrap text-text-subtle xl:inline">← → no teclado</span>}
            {atual || !ultimaPergunta ? (
              <button type="button" className={BOTAO_ESCURO} onClick={() => irPara(passo + 1)}>
                {atual ? "Próximo →" : "Próxima →"}
              </button>
            ) : (
              <Link
                href="/novo-projeto"
                className="whitespace-nowrap rounded-full bg-aqua px-6 py-3 text-[15px] font-semibold text-aqua-on transition-opacity hover:opacity-90"
              >
                Praticar no laboratório →
              </Link>
            )}
          </nav>
        </section>
      </main>
    </div>
  );
}

// Animações com GSAP (como as bolinhas do laboratório, ADR-0021). Elas sempre rodam (pedido do autor).
// Quem pediu menos movimento no sistema vê só as peças aparecendo aos poucos, sem deslizar nem
// pular (ADR-0011): as barras e as linhas continuam sendo reveladas, porque fazem parte da explicação.
const menosMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A cada passo, o palco entra deslizando do lado de onde o aluno veio, as peças dele aparecem uma
 * depois da outra e o texto vem logo atrás. No palco, `data-cresce` faz uma barra crescer (da
 * esquerda, ou da direita com "direita") e `data-traco` desenha uma linha do começo ao fim.
 */
function useEntradaDoPasso(palco: React.RefObject<HTMLElement | null>, texto: React.RefObject<HTMLDivElement | null>, passo: number) {
  const anterior = useRef(passo);
  useLayoutEffect(() => {
    const lado = passo >= anterior.current ? 1 : -1;
    anterior.current = passo;
    const mexe = !menosMovimento();
    const ctx = gsap.context(() => {
      const svg = palco.current?.querySelector("svg");
      const pecas = svg ? Array.from(svg.children) : Array.from(palco.current?.children ?? []);
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (svg && mexe) tl.from(svg, { x: 48 * lado, duration: 0.6, ease: "power3.out" }, 0);
      tl.from(pecas, { opacity: 0, y: mexe ? 12 : 0, duration: 0.55, stagger: 0.05 }, 0);
      palco.current?.querySelectorAll<SVGGraphicsElement>("[data-cresce]").forEach((el) => {
        const direita = el.dataset.cresce === "direita";
        tl.from(el, { scaleX: 0, transformOrigin: direita ? "right center" : "left center", duration: 0.8, ease: "power3.out" }, direita ? 0.9 : 0.4);
      });
      palco.current?.querySelectorAll<SVGGeometryElement>("[data-traco]").forEach((el) => {
        const comprimento = el.getTotalLength();
        tl.fromTo(
          el,
          { strokeDasharray: comprimento, strokeDashoffset: comprimento },
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" },
          0.2,
        );
      });
      if (texto.current) tl.from(texto.current.children, { opacity: 0, y: mexe ? 18 : 0, duration: 0.6, stagger: 0.08 }, 0.15);
    });
    return () => ctx.revert();
  }, [palco, texto, passo]);
}

/** Quando o aluno responde o teste, o que mudou (lacunas, a Aqua, o quadro da conta) dá um pulinho. */
function usePulo(palco: React.RefObject<HTMLElement | null>, texto: React.RefObject<HTMLDivElement | null>, escolha: number | null) {
  useLayoutEffect(() => {
    if (escolha === null) return;
    const pulos = [palco.current, texto.current].flatMap((raiz) => Array.from(raiz?.querySelectorAll("[data-pulo]") ?? []));
    const ctx = gsap.context(() => {
      if (menosMovimento()) gsap.from(pulos, { opacity: 0, duration: 0.5, stagger: 0.08 });
      else gsap.from(pulos, { scale: 0.6, opacity: 0, transformOrigin: "center", duration: 0.5, ease: "back.out(2)", stagger: 0.08 });
    });
    return () => ctx.revert();
  }, [palco, texto, escolha]);
}

function TextoDoPasso({ passo, valor }: { passo: Passo; valor: number }) {
  return (
    <>
      <h1 className="mt-3 text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-4xl">{passo.titulo}</h1>
      {passo.texto && (
        <div className="mt-5 space-y-4 text-[17px] leading-[1.55] text-text-muted">
          {passo.texto.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      )}
      {passo.diaADia && (
        <div className="mt-6 rounded-2xl bg-aqua-50 p-5">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-aqua-ink">
            <IconeCores /> No dia a dia
          </p>
          <p className="mt-2 text-[15px] leading-[1.55]">{passo.diaADia}</p>
        </div>
      )}
      {passo.naIA && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-text-muted">Na IA</p>
          <p className="mt-1.5 text-[17px] leading-[1.55] text-text-muted">{passo.naIA}</p>
        </div>
      )}
      {passo.conta && <CaixaConta conta={passo.conta} visual={passo.visual} valor={valor} />}
      {passo.quebra && (
        <div className="mt-6 rounded-2xl bg-[#FFF7E6] p-5">
          <p className="text-[13px] font-semibold text-[#8A5A00]">{passo.quebra.titulo}</p>
          <p className="mt-2 text-[15px] leading-[1.5] text-[#5C3D00]">{passo.quebra.texto}</p>
        </div>
      )}
      {passo.paraQuemQuiser && (
        <details className="group mt-6 rounded-2xl border border-black/[.08] bg-white p-5">
          <summary className="cursor-pointer list-none text-[15px] font-semibold">
            <span className="inline-block transition-transform group-open:rotate-90">▸</span> {passo.paraQuemQuiser.titulo}
          </summary>
          <p className="mt-3 font-mono text-xl font-semibold text-aqua-on">{passo.paraQuemQuiser.formula}</p>
          {passo.paraQuemQuiser.nota && <p className="mt-2 text-[13px] text-text-subtle">{passo.paraQuemQuiser.nota}</p>}
        </details>
      )}
      {passo.termos && (
        <div className="mt-6">
          <p className="text-[13px] text-text-subtle">Termos deste passo</p>
          <p className="mt-1 text-[15px] font-semibold text-aqua-ink">{passo.termos.join(" · ")}</p>
        </div>
      )}
    </>
  );
}

/** Dois quadradinhos de cor, laranja e azul, no quadro "No dia a dia" (a tarefa do laboratório). */
function IconeCores() {
  return (
    <svg width={20} height={12} viewBox="0 0 5 3" shapeRendering="crispEdges" aria-hidden>
      <rect x={0} y={0} width={2} height={3} fill="#FF8C00" />
      <rect x={3} y={0} width={2} height={3} fill="#378ADD" />
    </svg>
  );
}

function CaixaConta({ conta, visual, valor }: { conta: Conta; visual: Passo["visual"]; valor: number }) {
  let linhas: React.ReactNode[];
  let nota: string | undefined;
  if ("dinamica" in conta) {
    if (conta.dinamica === "peso" && visual.tipo === "peso") {
      const produto = visual.entrada * valor;
      linhas = [
        <>
          {formatar(visual.entrada)} × {formatar(valor)} = <Resultado n={produto} />
        </>,
      ];
      nota = Math.abs(valor) < 0.005 ? "Peso zero: a entrada é ignorada." : undefined;
    } else if (conta.dinamica === "sigmoide-passos") {
      const e = Math.exp(-conta.soma);
      linhas = [
        <>1 · troca o sinal da soma: {formatar(-conta.soma)}</>,
        <>
          2 · e<sup>{formatar(-conta.soma)}</sup> ≈ {formatar(e)}
        </>,
        <>
          3 · 1 ÷ (1 + {formatar(e)}) = <Resultado n={sigmoide(conta.soma)} />
        </>,
      ];
      nota = "e ≈ 2,718 é um número fixo da matemática, como o π.";
    } else {
      const e = Math.exp(-valor);
      linhas = [
        <>
          1 ÷ (1 + e<sup>{formatar(-valor)}</sup>)
        </>,
        <>
          = 1 ÷ (1 + {formatar(e)}) = <Resultado n={sigmoide(valor)} />
        </>,
      ];
      nota = "e ≈ 2,718 é um número fixo da matemática, como o π.";
    }
  } else {
    linhas = conta.linhas;
    nota = conta.nota;
  }
  return (
    <div className="mt-6 rounded-2xl border border-black/[.08] bg-white p-5">
      <p className="text-[13px] font-semibold text-text-muted">A conta</p>
      <div className="mt-3 space-y-1.5 font-mono text-[17px] font-medium tabular-nums sm:text-lg">
        {linhas.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      {nota && <p className="mt-3 text-[13px] text-text-subtle">{nota}</p>}
    </div>
  );
}

function Resultado({ n }: { n: number }) {
  const cor = Math.abs(n) < 0.005 ? "text-text-muted" : n > 0 ? "text-[#15803D]" : "text-[#B91C1C]";
  return <b className={cor}>{formatar(n)}</b>;
}

/** O controle deslizante dos passos interativos (peso ou soma). */
function Controle({ passo, valor, onValor }: { passo: Passo; valor: number; onValor: (n: number) => void }) {
  const v = passo.visual;
  if (!((v.tipo === "peso" || v.tipo === "curva") && v.interativo)) return null;
  const ePeso = v.tipo === "peso";
  const [min, max] = ePeso ? [-2, 2] : [-6, 6];
  const saida = ePeso ? v.entrada * valor : sigmoide(valor);
  return (
    <div className="rounded-2xl border border-black/[.06] bg-white px-5 py-4 sm:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="controle-passo" className="text-[13px] font-semibold">
          {ePeso ? "Mexa no peso" : "Mexa na soma"}
        </label>
        <output htmlFor="controle-passo" className="font-mono text-[15px] font-semibold tabular-nums">
          {formatar(valor)} → {formatar(saida)}
        </output>
      </div>
      <input
        id="controle-passo"
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={valor}
        onChange={(e) => onValor(Number(e.target.value))}
        className="mt-3 w-full accent-aqua-ink"
      />
      <div className="flex justify-between font-mono text-[11px] text-text-subtle">
        <span>−{-min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function TesteRapido({
  teste: t,
  ultima,
  escolha,
  onEscolha,
  acertou,
}: {
  teste: Teste;
  ultima: boolean;
  escolha: number | null;
  onEscolha: (i: number) => void;
  acertou: boolean;
}) {
  return (
    <>
      <h1 className="mt-3 text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-4xl">{t.pergunta}</h1>
      {t.subtitulo && <p className="mt-3 text-[17px] text-text-muted">{t.subtitulo}</p>}
      <div className="mt-6 space-y-3" role="group" aria-label="Respostas">
        {t.opcoes.map((o, i) => {
          const marcada = escolha === i;
          const estilo = !marcada
            ? "border-black/[.12] text-text-muted hover:border-black/30 hover:text-text"
            : o.certa
              ? "border-2 border-[#10B981] bg-[#ECFDF5] font-medium text-text"
              : "border-2 border-[#E5484D] bg-[#FEF2F2] text-text";
          return (
            <button
              key={i}
              type="button"
              aria-pressed={marcada}
              disabled={acertou && !marcada}
              onClick={() => onEscolha(i)}
              className={`flex w-full items-center justify-between gap-4 rounded-[14px] border px-6 py-4 text-left text-base transition-colors disabled:opacity-50 ${estilo}`}
            >
              <span className="flex items-baseline gap-6">
                <span className={o.detalhe ? "font-mono text-[17px] font-semibold text-text" : undefined}>{o.texto}</span>
                {o.detalhe && <span className="text-[15px]">{o.detalhe}</span>}
              </span>
              {marcada && <span aria-hidden className={o.certa ? "font-bold text-[#0B8A5F]" : "font-bold text-[#C2282D]"}>{o.certa ? "✓" : "✕"}</span>}
            </button>
          );
        })}
      </div>
      {escolha !== null &&
        (t.conta ? (
          <div data-pulo className={`mt-5 flex items-center gap-5 rounded-2xl p-5 ${acertou ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"}`}>
            <AquaReacao reacao={acertou ? "decidindo" : "preocupada"} unidade={5} rotulo={acertou ? "A Aqua com a lâmpada acesa" : "A Aqua preocupada"} />
            <div>
              <p className="text-[15px] font-semibold">{acertou ? t.explicacao : "Quase. A Aqua mostra a conta:"}</p>
              {t.conta.map((l) => (
                <p key={l} className="mt-1 font-mono text-[15px] tabular-nums">
                  {l}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className={`mt-5 text-[15px] leading-[1.5] ${acertou ? "text-[#0B6B4A]" : "text-[#C2282D]"}`}>
            {acertou ? t.explicacao : "Quase. Volte um passo se quiser rever, ou tente outra resposta."}
          </p>
        ))}
      {ultima && t.noLab && (
        <div className="mt-8 rounded-2xl border-2 border-aqua bg-aqua-50 p-5">
          <p className="text-[13px] font-semibold text-aqua-ink">Agora no laboratório</p>
          <p className="mt-2 text-[15px] leading-[1.5]">{t.noLab}</p>
        </div>
      )}
    </>
  );
}

function Fim({ tutorial, acertou }: { tutorial: Tutorial; acertou: boolean }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <AquaLampada acesa={acertou} className="h-auto w-[150px]" />
      <div className="mt-2 h-[3px] w-60 bg-black/[.06]" />
      <p className="mt-8 text-[28px] font-semibold tracking-[-0.01em]">
        {acertou ? `Você entendeu ${artigo(tutorial.titulo)}.` : "Responda para acender a lâmpada."}
      </p>
      <p className="mt-3 max-w-[420px] text-[17px] text-text-muted">{tutorial.descricao}</p>
      <div
        className={`mt-8 w-full max-w-[400px] rounded-2xl border border-black/[.06] bg-white p-6 text-left motion-safe:transition-opacity motion-safe:duration-500 ${acertou ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!acertou}
      >
        <p className="text-[13px] font-semibold text-text-muted">Você aprendeu</p>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {(tutorial.testes.at(-1)?.aprendeu ?? []).map((a) => (
            <li key={a}>✓ {a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** "O neurônio" → "o neurônio"; "Camadas e fios" → "camadas e fios". */
function artigo(titulo: string) {
  return titulo.charAt(0).toLowerCase() + titulo.slice(1);
}
