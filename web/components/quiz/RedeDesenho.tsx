"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { fmt, fmtPeso } from "@/lib/quiz/numeros";
import { NOME_DIRECAO, type Alvo, type Desenho, type Direcao } from "@/lib/quiz/perguntas";
import { CANAIS, LINHAS, nomeLinha, nomeNeuronio, type NeuronioId } from "@/lib/quiz/rede-quiz";

// Quiz ao vivo (ADR-0034): a rede desenhada, versão simples do canvas do lab (só desenho, sem
// React Flow e sem arrastar nada). Verde = peso positivo, vermelho = negativo, mais grossa = peso maior.
// No computador e no projetor a rede fica deitada, como no lab. No celular ela fica em pé
// (Entrada em cima, Saída embaixo): deitada, ela encolhe tanto que os números não dão para ler.

type Ponto = { x: number; y: number };
type Formato = {
  L: number;
  A: number;
  pos: Record<string, Ponto>;
  /** onde fica a etiqueta do peso de cada linha (sem encavalar uma na outra) */
  peso: (id: string) => Ponto;
  titulos: { texto: string; sub?: string; x: number; y: number; ancora: "middle" | "start" }[];
  canal: (c: number) => Ponto;
  amostra: Ponto & { lado: number; rotulo: Ponto };
  nome: (n: "n1" | "n2") => Ponto;
  objetivo: Ponto;
  /** o menu da linha abre embaixo (true) ou em cima da etiqueta do peso */
  menuEmbaixo: (id: string) => boolean;
};

const ao = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const pontas = (f: Formato, id: string) => {
  const [de, para] = id.split("->");
  return { a: f.pos[de], b: f.pos[para] };
};

const DEITADA: Formato = (() => {
  const pos = { "e#0": { x: 190, y: 110 }, "e#1": { x: 190, y: 210 }, "e#2": { x: 190, y: 310 }, n1: { x: 480, y: 150 }, n2: { x: 480, y: 270 }, s: { x: 770, y: 210 } };
  const f: Formato = {
    L: 900,
    A: 400,
    pos,
    peso: (id) => {
      const { a, b } = pontas(f, id);
      return ao(a, b, id.startsWith("e#") ? 0.3 : 0.5);
    },
    titulos: [
      { texto: "Entrada", x: 190, y: 34, ancora: "middle" },
      { texto: "Camada 1", sub: "ReLU", x: 480, y: 34, ancora: "middle" },
      { texto: "Saída", sub: "sigmoide", x: 770, y: 34, ancora: "middle" },
    ],
    canal: (c) => ({ x: 144, y: pos[`e#${c}` as "e#0"].y + 5 }),
    amostra: { x: 62, y: 192, lado: 40, rotulo: { x: 82, y: 256 } },
    nome: (n) => ({ x: 480, y: pos[n].y + 52 }),
    objetivo: { x: 770, y: 280 },
    menuEmbaixo: (id) => f.peso(id).y < 200,
  };
  return f;
})();

const EM_PE: Formato = (() => {
  const pos = { "e#0": { x: 70, y: 100 }, "e#1": { x: 200, y: 100 }, "e#2": { x: 330, y: 100 }, n1: { x: 130, y: 310 }, n2: { x: 270, y: 310 }, s: { x: 200, y: 505 } };
  const f: Formato = {
    L: 400,
    A: 600,
    pos,
    // as linhas que vão para o neurônio 1 têm a etiqueta mais perto da Entrada; as do neurônio 2, mais longe
    peso: (id) => {
      const { a, b } = pontas(f, id);
      return ao(a, b, id.startsWith("e#") ? (id.endsWith("n1") ? 0.27 : 0.45) : 0.5);
    },
    titulos: [
      { texto: "Entrada", x: 16, y: 26, ancora: "start" },
      { texto: "Camada 1", sub: "ReLU", x: 16, y: 250, ancora: "start" },
      { texto: "Saída", sub: "sigmoide", x: 16, y: 470, ancora: "start" },
    ],
    canal: (c) => ({ x: pos[`e#${c}` as "e#0"].x, y: 60 }),
    amostra: { x: 110, y: 8, lado: 26, rotulo: { x: 160, y: 26 } },
    nome: (n) => ({ x: pos[n].x, y: 362 }),
    objetivo: { x: 200, y: 575 },
    menuEmbaixo: () => false,
  };
  return f;
})();

/** Celular (tela estreita) ou não. Lido do navegador; no servidor, deitada. */
function useEstreita() {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia("(max-width: 639px)");
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

const VERDE = "#3FAE79";
const VERMELHO = "#E5736F";
const TEAL = "#0E7C86";

export type PropsDoDesenho = {
  desenho: Desenho;
  /** sorteio por aluno, na tela projetada: só o formato da rede, com "?" no lugar dos números */
  semNumeros?: boolean;
  /** onde o aluno digita, e o que já digitou */
  alvo?: Alvo | null;
  valor?: string;
  onValor?: (v: string) => void;
  onEnviar?: () => void;
  /** a linha da pergunta "subir, descer ou não mudar" */
  linhaDaPergunta?: string;
  menuAberto?: boolean;
  onAbrirMenu?: () => void;
  escolha?: Direcao | null;
  onEscolher?: (d: Direcao) => void;
  desligado?: boolean;
  className?: string;
};

export function RedeDesenho({
  desenho: d,
  semNumeros = false,
  alvo = null,
  valor = "",
  onValor,
  onEnviar,
  linhaDaPergunta,
  menuAberto = false,
  onAbrirMenu,
  escolha = null,
  onEscolher,
  desligado = false,
  className = "",
}: PropsDoDesenho) {
  const f = useEstreita() ? EM_PE : DEITADA;
  const pct = (p: Ponto) => ({ left: `${(p.x / f.L) * 100}%`, top: `${(p.y / f.A) * 100}%` });
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  // sem números (sorteio por aluno no projetor) também não destaca: cada aluno tem a sua linha
  const temDestaque = !semNumeros && d.destaque.length > 0;
  const destacado = (id: string) => !semNumeros && (d.destaque.includes(id) || id === linhaDaPergunta || (alvo?.tipo === "linha" && alvo.id === id));

  // as linhas em destaque piscam quando a pergunta aparece (GSAP, como no lab)
  useEffect(() => {
    if (!raiz.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (raiz.current.querySelectorAll("[data-destaque='sim']").length === 0) return;
    // context + revert: ao limpar, o GSAP devolve o estilo original
    const ctx = gsap.context(() => {
      gsap.timeline().fromTo("[data-destaque='sim']", { opacity: 0.2 }, { opacity: 1, duration: 0.35, repeat: 3, yoyo: true, ease: "power1.inOut" });
    }, raiz);
    return () => ctx.revert();
  }, [d]);

  useEffect(() => {
    if (alvo && !desligado) campo.current?.focus({ preventScroll: true });
  }, [alvo, desligado]);

  const texto = (n: NeuronioId) => (semNumeros ? (n === "s" ? "?" : "") : (d.textos[n] ?? ""));
  const apagado = (n: NeuronioId) => !semNumeros && d.apagados.includes(n);
  const alvoNeuronio = alvo?.tipo === "neuronio" ? alvo.id : null;
  const emPe = f === EM_PE;
  // em pé, tudo um pouco maior: o desenho encolhe menos que a tela
  const fonte = emPe ? { titulo: 16, sub: 12, valor: 17, peso: 14, nome: 12, saida: 20 } : { titulo: 17, sub: 13, valor: 16, peso: 14, nome: 12, saida: 20 };
  const pilula = emPe ? { l: 60, a: 24 } : { l: 66, a: 26 };

  return (
    <div ref={raiz} className={`relative w-full ${emPe ? "mx-auto max-w-[420px]" : ""} ${className}`}>
      <svg viewBox={`0 0 ${f.L} ${f.A}`} className="block h-auto w-full select-none" role="img" aria-label="A rede: Entrada com R, G e B, Camada 1 com 2 neurônios (ReLU) e a Saída (sigmoide).">
        {/* títulos das camadas */}
        <g fontFamily="var(--font-inter)" textAnchor={f.titulos[0].ancora}>
          {f.titulos.map((t) => (
            <g key={t.texto}>
              <text x={t.x} y={t.y} fontSize={fonte.titulo} fontWeight={700} fill="#1D1D1F">{t.texto}</text>
              {t.sub && <text x={t.x} y={t.y + 20} fontSize={fonte.sub} fill="#86868B">{t.sub}</text>}
            </g>
          ))}
        </g>

        {/* as linhas */}
        <g fill="none" strokeLinecap="round">
          {LINHAS.map((id) => {
            const { a, b } = pontas(f, id);
            const w = d.pesos[id] ?? 0;
            const forte = destacado(id);
            const largura = semNumeros ? 2.5 : 1.5 + Math.abs(w) * 1.3;
            return (
              <line
                key={id}
                data-destaque={forte && temDestaque ? "sim" : undefined}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={semNumeros ? "#C7C7CC" : w >= 0 ? VERDE : VERMELHO}
                strokeWidth={forte ? largura + 2 : largura}
                strokeOpacity={temDestaque && !forte ? 0.3 : 1}
              />
            );
          })}
          {/* a linha da pergunta "subir, descer, não mudar": uma faixa larga e invisível para o toque */}
          {linhaDaPergunta && !desligado && (
            <line
              {...(() => {
                const { a, b } = pontas(f, linhaDaPergunta);
                return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
              })()}
              stroke="transparent"
              strokeWidth={40}
              className="cursor-pointer"
              onClick={onAbrirMenu}
              role="button"
              aria-label={`A linha ${nomeLinha(linhaDaPergunta)}: escolher se sobe, desce ou não muda`}
            />
          )}
        </g>

        {/* os pesos */}
        <g fontFamily="var(--font-inter)" fontSize={fonte.peso} fontWeight={700} textAnchor="middle">
          {LINHAS.map((id) => {
            const w = d.pesos[id] ?? 0;
            if (alvo?.tipo === "linha" && alvo.id === id) return null; // o aluno digita aqui
            const p = f.peso(id);
            const forte = destacado(id);
            if (temDestaque && !forte && !id.endsWith("->s")) return null; // só os da pergunta, para não poluir
            return (
              <g key={id} opacity={temDestaque && !forte ? 0.55 : 1} onClick={id === linhaDaPergunta && !desligado ? onAbrirMenu : undefined} className={id === linhaDaPergunta && !desligado ? "cursor-pointer" : undefined}>
                <rect x={p.x - pilula.l / 2} y={p.y - pilula.a / 2} width={pilula.l} height={pilula.a} rx={pilula.a / 2} fill={forte ? "#E6F8FA" : "#FFFFFF"} stroke={semNumeros ? "#C7C7CC" : forte ? TEAL : w >= 0 ? VERDE : VERMELHO} />
                <text x={p.x} y={p.y + fonte.peso * 0.36} fill={forte ? "#06363A" : "#1D1D1F"}>{semNumeros ? "?" : fmtPeso(w)}</text>
              </g>
            );
          })}
        </g>

        {/* a cor que entra */}
        <rect x={f.amostra.x} y={f.amostra.y} width={f.amostra.lado} height={f.amostra.lado} rx={f.amostra.lado / 4} fill={semNumeros ? "#E5E5EA" : d.cor} stroke="#00000014" />
        <text x={f.amostra.rotulo.x} y={f.amostra.rotulo.y} fontFamily="var(--font-inter)" fontSize={12} fill="#86868B" textAnchor={emPe ? "start" : "middle"}>a cor</text>

        {/* os neurônios */}
        <g fontFamily="var(--font-inter)" textAnchor="middle">
          {[0, 1, 2].map((c) => {
            const p = f.pos[`e#${c}`];
            const r = f.canal(c);
            return (
              <g key={c}>
                <text x={r.x} y={r.y} fontSize={14} fontWeight={700} fill="#6E6E73">{CANAIS[c]}</text>
                <circle cx={p.x} cy={p.y} r={28} fill="#FFFFFF" stroke="#1D1D1F" strokeWidth={2} />
                <text x={p.x} y={p.y + 6} fontSize={fonte.valor} fontWeight={700} fill="#1D1D1F">{semNumeros ? "?" : fmt(d.entradas[c])}</text>
              </g>
            );
          })}
          {(["n1", "n2"] as const).map((n) => {
            const p = f.pos[n];
            const off = apagado(n);
            const eAlvo = alvoNeuronio === n;
            const nome = f.nome(n);
            return (
              <g key={n} data-destaque={destacado(n) ? "sim" : undefined}>
                <circle cx={p.x} cy={p.y} r={32} fill={eAlvo ? "#E6F8FA" : off ? "#F2F2F4" : "#FFFFFF"} stroke={eAlvo ? TEAL : off ? "#AEAEB2" : "#1D1D1F"} strokeWidth={eAlvo ? 3 : 2} strokeDasharray={eAlvo ? "6 5" : undefined} />
                {!eAlvo && <text x={p.x} y={p.y + 6} fontSize={fonte.valor} fontWeight={700} fill={off ? "#8E8E93" : "#1D1D1F"}>{texto(n)}</text>}
                <text x={nome.x} y={nome.y} fontSize={fonte.nome} fill="#86868B">{nomeNeuronio(n)}</text>
              </g>
            );
          })}
          {(() => {
            const p = f.pos.s;
            const eAlvo = alvoNeuronio === "s";
            return (
              <g>
                <circle cx={p.x} cy={p.y} r={44} fill="#E6F8FA" stroke={TEAL} strokeWidth={eAlvo ? 3 : 2} strokeDasharray={eAlvo ? "6 5" : undefined} />
                {!eAlvo && <text x={p.x} y={p.y + 7} fontSize={fonte.saida} fontWeight={700} fill={TEAL}>{texto("s")}</text>}
                {d.objetivo !== undefined && !semNumeros && (
                  <text x={f.objetivo.x} y={f.objetivo.y} fontSize={13} fontWeight={600} fill="#6E6E73">
                    certo: {d.objetivo} ({d.objetivo === 1 ? "laranja" : "azul"})
                  </text>
                )}
              </g>
            );
          })()}
        </g>
      </svg>

      {/* o campo para digitar, em cima do neurônio ou da linha */}
      {alvo && (
        <input
          ref={campo}
          inputMode="decimal"
          autoComplete="off"
          aria-label={alvo.tipo === "neuronio" ? `Digite o número do ${nomeNeuronio(alvo.id)}` : "Digite o que chega pela linha"}
          value={valor}
          disabled={desligado}
          onChange={(e) => onValor?.(e.target.value.replace(/[^0-9,.\-−]/g, "").slice(0, 8))}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnviar?.();
          }}
          placeholder="?"
          className="absolute w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-aqua-ink bg-white px-2 py-1 text-center text-lg font-bold text-aqua-ink tabular-nums shadow-sm outline-none placeholder:text-aqua-ink/50 focus:ring-4 focus:ring-aqua/40 sm:w-28 sm:text-xl"
          style={pct(alvo.tipo === "neuronio" ? f.pos[alvo.id] : f.peso(alvo.id))}
        />
      )}

      {/* o menu da linha: junto da linha no computador, embaixo da rede no celular (decisão 12).
          No computador abre embaixo da linha se ela está na metade de cima, e em cima se está na de baixo,
          para não tapar a Saída. */}
      {linhaDaPergunta && menuAberto && (
        <div
          role="group"
          aria-label="O número do peso deve"
          className={`mt-3 flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-3 shadow-lg sm:absolute sm:z-10 sm:mt-0 sm:w-56 sm:-translate-x-1/2 ${
            f.menuEmbaixo(linhaDaPergunta) ? "sm:translate-y-6" : "sm:translate-y-[calc(-100%-24px)]"
          }`}
          style={emPe ? undefined : pct(f.peso(linhaDaPergunta))}
        >
          <p className="px-1 text-sm font-semibold text-text-muted">O número do peso deve:</p>
          {(["sobe", "desce", "nao-muda"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              disabled={desligado}
              onClick={() => onEscolher?.(dir)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-base font-semibold transition-colors ${
                escolha === dir ? "border-aqua-ink bg-aqua-50 text-aqua-on" : "border-black/10 hover:bg-black/[.03]"
              }`}
            >
              <span aria-hidden className="w-5 text-center text-lg">{dir === "sobe" ? "↑" : dir === "desce" ? "↓" : "="}</span>
              {NOME_DIRECAO[dir]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A barra de 0 (azul) a 1 (laranja) com a resposta marcada: o "termômetro" das perguntas de Saída e Erro. */
export function Termometro({ saida, objetivo, semNumeros = false }: { saida: number; objetivo?: 0 | 1; semNumeros?: boolean }) {
  return (
    <div className="w-full">
      <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg, #378ADD, #D9D9DE, #E8853A)" }}>
        {!semNumeros && (
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text bg-white"
            style={{ left: `${saida * 100}%` }}
            aria-hidden
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs text-text-muted">
        <span>0 = azul{objetivo === 0 ? " · o certo" : ""}</span>
        {!semNumeros && <span className="font-semibold text-text">resposta: {fmt(saida)}</span>}
        <span>{objetivo === 1 ? "o certo · " : ""}1 = laranja</span>
      </div>
    </div>
  );
}
