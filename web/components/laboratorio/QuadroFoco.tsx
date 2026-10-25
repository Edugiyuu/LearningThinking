"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { PassoVolta } from "@/lib/backward";
import {
  contaArmada,
  culpaComSinal,
  mapaDaRede,
  ondeEstamos,
  quadroDaIda,
  quadroDaVolta,
  type CorpoConta,
  type LinhaArmada,
  type MapaDaRede,
  type OndeEstamos,
  type ParteDaSoma,
} from "@/lib/foco";
import { formatar, type Rodada } from "@/lib/rede";
import { Aqua } from "@/components/mascote";
import gsap from "gsap";

type Props = {
  rodada: Rodada;
  /** Os passos da volta, que vêm depois dos da ida (ADR-0025). */
  volta: PassoVolta[] | null;
  atual: number;
  /** A cor da Entrada, quando ela é uma cor: aparece no fim da ida. */
  corDaEntrada: string | null;
  rotuloDaResposta: (saidaId: string, resposta: 0 | 1) => { rotulo: string; cor: string | null };
  onFechar: () => void;
};

/** "Entrada R" → "R"; "Camada 1 · neurônio 2" → "neurônio 2" (na soma, onde a camada já está no título). */
const curto = (nome: string) => nome.replace(/^Entrada /, "").replace(/^.* · /, "");
/** Com a camada, para não confundir o neurônio 1 de uma camada com o de outra (ADR-0026, item 7). */
const completo = (nome: string) => nome.replace(/^Entrada /, "");

/** A conta do "ver conta": os dois números como aparecem no quadro, com o nome de cada um. */
type Conta = { a: string; b: string; nomeA: string; nomeB: string; nomeResultado: string; casas: number; fim?: ReactNode };

/**
 * Modo Foco (ADR-0026): a conta da vez num quadro (lousa clara) por cima do canvas, com a Aqua
 * pequena apontando. Na ida, todas as linhas do neurônio e a soma inteira, com a linha da vez acesa;
 * na volta, de onde vem a culpa e o teste "e se?". Frames "Laboratório · Modo Foco · 1 a 4" no Figma.
 */
export default function QuadroFoco({ rodada, volta, atual, corDaEntrada, rotuloDaResposta, onFechar }: Props) {
  const [conta, setConta] = useState<Conta | null>(null);
  const daIda = rodada.passos.length;
  const naVolta = !!volta && atual >= daIda;

  // Esc fecha o "ver conta" e depois o quadro
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (conta) setConta(null);
      else onFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [conta, onFechar]);

  // nomes curtos: o último neurônio é a "Saída", como no painel da volta
  const finais = new Set(rodada.passos.flatMap((p) => (p.tipo === "ativacao" && p.final ? [p.neuronio] : [])));
  const nomeNeuronio = (id: string) => (finais.has(id) ? "Saída" : completo(rodada.nomes.get(id) ?? id));
  const origem = new Map(rodada.passos.flatMap((p) => (p.tipo === "termo" ? [[p.linha, completo(p.nome)] as const] : [])));

  const mapa = mapaDaRede(rodada);
  const onde = ondeEstamos(rodada, mapa, volta, atual);

  const etapa = naVolta ? `BACKWARD · PASSO ${atual - daIda + 1} DE ${volta.length}` : `FORWARD · PASSO ${atual + 1} DE ${daIda}`;

  // o quadro abre com um fade curto, e cada passo novo entra de leve (ADR-0026, item 15)
  const fundo = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (semMovimento()) return;
    const tl = gsap.timeline();
    tl.from(fundo.current, { autoAlpha: 0, duration: 0.25, ease: "power1.out" }).from(quadro.current, { y: 16, scale: 0.98, duration: 0.35, ease: "power2.out" }, "<");
    return () => {
      // revert, e não kill: no modo estrito o efeito roda duas vezes e o "from" ficaria preso no começo
      tl.revert();
    };
  }, []);
  useTroca(conteudo, atual);

  return (
    <div ref={fundo} className="foco" role="dialog" aria-label="Modo Foco: a conta da vez">
      <div ref={quadro} className="foco-quadro">
        <button className="foco-fechar" onClick={onFechar} aria-label="Fechar o Modo Foco">
          ×
        </button>
        <div className="foco-etapa">{etapa}</div>
        <div className="foco-caixa">
          <div ref={conteudo} className="foco-conteudo">
            {naVolta ? (
              <Volta passos={volta} atual={atual - daIda} nomeNeuronio={nomeNeuronio} origem={origem} verConta={setConta} />
            ) : (
              <Ida
                rodada={rodada}
                mapa={mapa}
                atual={atual}
                nomeNeuronio={nomeNeuronio}
                corDaEntrada={corDaEntrada}
                rotuloDaResposta={rotuloDaResposta}
                verConta={setConta}
              />
            )}
          </div>
        </div>
      </div>
      <LousaOndeEstamos mapa={mapa} onde={onde} passo={atual} />
      {conta && <VerConta key={`${conta.a}×${conta.b}`} conta={conta} onFechar={() => setConta(null)} />}
    </div>
  );
}

/* ---------- Ida ---------- */

function Ida({
  rodada,
  mapa,
  atual,
  nomeNeuronio,
  corDaEntrada,
  rotuloDaResposta,
  verConta,
}: {
  rodada: Rodada;
  mapa: MapaDaRede;
  atual: number;
  nomeNeuronio: (id: string) => string;
  corDaEntrada: string | null;
  rotuloDaResposta: Props["rotuloDaResposta"];
  verConta: (c: Conta) => void;
}) {
  const q = quadroDaIda(rodada, atual);
  if (!q) return null;
  if (q.tipo === "saida") {
    const quantos = mapa.colunas[0].nos.length;
    const meio = mapa.colunas.slice(1, -1).map((c) => `pela ${c.nome}`);
    const caminho = meio.length ? `passou ${meio.join(" e ")}` : "foi direto para a Saída";
    return (
      <>
        <h2 className="foco-titulo">A rede toda</h2>
        <p className="foco-nota esquerda">
          {corDaEntrada ? "A cor" : "A Entrada"} entrou como {quantos} {quantos === 1 ? "número" : "números"}, {caminho} e virou a resposta.
        </p>
        <RedeToda mapa={mapa} corDaEntrada={corDaEntrada} valor={q.valor} resposta={{ ...rotuloDaResposta(q.saida, q.resposta), n: q.resposta }} />
        <p className="foco-nota esquerda">Linha verde: peso positivo · vermelha: negativo · mais grossa: peso maior.</p>
      </>
    );
  }
  const destino = nomeNeuronio(q.neuronio);
  const agora = q.partes.find((p) => p.agora);
  const funcao = q.final ? "sigmoide" : "ReLU";
  return (
    <>
      <h2 className="foco-titulo">{agora ? `${completo(agora.nome)} → ${destino}` : `${destino}: soma e ${funcao}`}</h2>
      <div className="foco-corpo">
        <div>
          <DiagramaIda partes={q.partes} destino={destino} valor={q.ativando ? q.valor : null} />
          {agora ? (
            <Cadeia
              elos={[
                { n: formatar(agora.entrada), nome: "o que passou" },
                { op: "×" },
                { n: formatar(agora.peso), nome: "peso", cor: agora.peso < 0 ? "negativo" : "positivo" },
                { op: "=" },
                {
                  n: formatar(agora.parte),
                  nome: "parte desta linha",
                  destaque: true,
                  conta: () =>
                    verConta({
                      a: formatar(agora.entrada),
                      b: formatar(agora.peso),
                      nomeA: `o que ${completo(agora.nome)} passou`,
                      nomeB: "peso da linha",
                      nomeResultado: "parte desta linha",
                      casas: 2,
                      fim: <SomaDoNeuronio partes={q.partes} destino={destino} final={q.final} soma={q.soma} valor={q.valor} />,
                    }),
                },
              ]}
            />
          ) : (
            <Cadeia
              elos={[
                { n: formatar(q.soma), nome: "soma" },
                { op: "→" },
                { n: funcao, nome: q.final ? "deixa entre 0 e 1" : "negativo vira 0" },
                { op: "→" },
                { n: formatar(q.valor), nome: `${destino} passa adiante`, destaque: true },
              ]}
            />
          )}
        </div>
        <SomaDoNeuronio partes={q.partes} destino={destino} final={q.final} soma={q.soma} valor={q.valor} ativando={q.ativando} />
      </div>
    </>
  );
}

/** As linhas que chegam no neurônio: a da vez acesa, as outras apagadas (verde/vermelho = sinal do peso). */
function DiagramaIda({ partes, destino, valor }: { partes: ParteDaSoma[]; destino: string; valor: number | null }) {
  const passo = 74;
  const altura = Math.max(170, partes.length * passo + 30);
  const dy = altura / 2;
  const yDe = (i: number) => altura / 2 + (i - (partes.length - 1) / 2) * passo;
  return (
    <svg className="foco-diagrama" viewBox={`0 0 440 ${altura}`} role="img" aria-label={`As linhas que chegam em ${destino}`}>
      {partes.map((p, i) => {
        const y = yDe(i);
        const cor = p.peso < 0 ? "var(--erro)" : "var(--positivo)";
        return (
          <g key={p.linha} className={p.agora ? "agora" : "apagada"}>
            <line x1={118} y1={y} x2={338} y2={dy} stroke={cor} strokeWidth={p.agora ? 5 : 2.5} strokeLinecap="round" />
            {p.agora && (
              <>
                <g transform={`translate(${118 + (338 - 118) * 0.6} ${y + (dy - y) * 0.6 + 20})`}>
                  <rect x={-44} y={-13} width={88} height={26} rx={13} className={`foco-pilula ${p.peso < 0 ? "negativo" : "positivo"}`} />
                  <text textAnchor="middle" y={4.5}>
                    peso {formatar(p.peso)}
                  </text>
                </g>
              </>
            )}
            <circle cx={90} cy={y} r={28} className="foco-no" />
            <text x={90} y={y + 5} textAnchor="middle" className="foco-no-valor">
              {formatar(p.entrada)}
            </text>
            <text x={90} y={y + 44} textAnchor="middle" className="foco-no-nome">
              {completo(p.nome)}
            </text>
          </g>
        );
      })}
      <circle cx={374} cy={dy} r={34} className="foco-no destino" />
      <text x={374} y={dy + 6} textAnchor="middle" className="foco-no-valor">
        {valor === null ? "Σ" : formatar(valor)}
      </text>
      <text x={374} y={dy + 52} textAnchor="middle" className="foco-no-nome destino">
        {destino}
      </text>
      {partes.map((p, i) =>
        p.agora ? <BolinhaDaIda key={p.linha} de={{ x: 118, y: yDe(i) }} para={{ x: 340, y: dy }} entrada={p.entrada} parte={p.parte} /> : null,
      )}
    </svg>
  );
}

/** "A soma da Saída": a parte de cada linha, a da vez acesa, e a soma passando pela ativação. */
function SomaDoNeuronio({
  partes,
  destino,
  final,
  soma,
  valor,
  ativando = false,
}: {
  partes: ParteDaSoma[];
  destino: string;
  final: boolean;
  soma: number;
  valor: number;
  ativando?: boolean;
}) {
  return (
    <div className="foco-soma">
      <div className="foco-rotulo">A soma {destino === "Saída" ? "da Saída" : `do ${destino}`}</div>
      <ul>
        {partes.map((p) => (
          <li key={p.linha} className={p.agora ? "agora" : ""}>
            <span>parte de {curto(p.nome)}</span>
            <b className={p.parte < 0 ? "negativo" : ""}>{formatar(p.parte)}</b>
          </li>
        ))}
      </ul>
      <div className={`foco-soma-fim ${ativando ? "agora" : ""}`}>
        <span>
          soma {formatar(soma)} → {final ? "sigmoide" : "ReLU"} →
        </span>
        <b>{formatar(valor)}</b>
      </div>
    </div>
  );
}

/** Fim da ida (ADR-0026, item 8): a rede toda, com o valor de cada nó e cada linha com a cor e a espessura do peso. */
function RedeToda({
  mapa,
  corDaEntrada,
  valor,
  resposta,
}: {
  mapa: MapaDaRede;
  corDaEntrada: string | null;
  valor: number;
  resposta: { rotulo: string; cor: string | null; n: 0 | 1 };
}) {
  const largura = 720;
  const passo = 76;
  const r = 26;
  const maior = Math.max(...mapa.colunas.map((c) => c.nos.length));
  const topo = 76;
  const meio = topo + ((maior - 1) * passo) / 2;
  const altura = topo + (maior - 1) * passo + r + 62;
  const x = (c: number) => 130 + (c * (largura - 230)) / Math.max(1, mapa.colunas.length - 1);
  const pos = new Map<string, { x: number; y: number }>();
  mapa.colunas.forEach((c, i) => c.nos.forEach((n, j) => pos.set(n.id, { x: x(i), y: meio + (j - (c.nos.length - 1) / 2) * passo })));
  const ultima = mapa.colunas.length - 1;
  // o que cada coluna faz, embaixo do nome (frame "Modo Foco · 6 fim da ida")
  const funcao = (i: number) => (i === 0 ? (corDaEntrada ? "a cor" : "os números") : i === ultima ? "sigmoide" : "ReLU");
  const cor = resposta.cor ?? "var(--destaque-texto)";
  const pilula = `${resposta.rotulo} (${resposta.n})`;
  const larguraPilula = pilula.length * 7.6 + 28;
  const saida = mapa.colunas[ultima].nos.length === 1 ? pos.get(mapa.colunas[ultima].nos[0].id) : null;
  return (
    <svg className="foco-rede" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={`A rede toda: ${formatar(valor)} → ${pilula}`}>
      {corDaEntrada && (
        <g>
          <rect x={22} y={meio - 16} width={32} height={32} rx={6} fill={corDaEntrada} stroke="var(--text)" strokeWidth={1.5} />
          <text x={38} y={meio + 32} textAnchor="middle" className="foco-no-nome pequeno">
            a cor
          </text>
        </g>
      )}
      {mapa.linhas.map((l) => {
        const a = pos.get(l.de);
        const b = pos.get(l.para);
        if (!a || !b) return null;
        return (
          <line
            key={l.linha}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={l.peso < 0 ? "var(--erro)" : "var(--positivo)"}
            strokeWidth={1.5 + Math.min(5, Math.abs(l.peso) * 2)}
            strokeLinecap="round"
            opacity={0.75}
          />
        );
      })}
      {mapa.colunas.map((c, i) => (
        <g key={c.nome + i}>
          <text x={x(i)} y={16} textAnchor="middle" className="foco-no-nome destino">
            {c.nome}
          </text>
          <text x={x(i)} y={32} textAnchor="middle" className="foco-no-nome pequeno">
            {funcao(i)}
          </text>
          {c.nos.map((n) => {
            const p = pos.get(n.id)!;
            const fim = i === ultima;
            return (
              <g key={n.id}>
                {fim && <circle cx={p.x} cy={p.y} r={r + 6} fill="#fff" />}
                {fim && <circle cx={p.x} cy={p.y} r={r + 6} fill={cor} fillOpacity={0.15} />}
                <circle cx={p.x} cy={p.y} r={fim ? r + 6 : r} className="foco-no" style={fim ? { stroke: cor, strokeWidth: 3, fill: "none" } : undefined} />
                <text x={p.x} y={p.y + 6} textAnchor="middle" className="foco-no-valor">
                  {formatar(n.valor)}
                </text>
                {i === 0 ? (
                  <text x={p.x - r - 14} y={p.y + 4} textAnchor="end" className="foco-no-nome">
                    {n.nome}
                  </text>
                ) : (
                  !fim && (
                    <text x={p.x} y={p.y + r + 18} textAnchor="middle" className="foco-no-nome">
                      {n.nome}
                    </text>
                  )
                )}
              </g>
            );
          })}
        </g>
      ))}
      {saida && (
        <g>
          {/* a Aqua em cima da resposta */}
          <foreignObject x={saida.x - 20} y={saida.y - r - 6 - 34} width={40} height={24}>
            <Aqua unidade={4} />
          </foreignObject>
          <rect x={saida.x - larguraPilula / 2} y={saida.y + r + 14} width={larguraPilula} height={26} rx={13} fill={cor} />
          <text x={saida.x} y={saida.y + r + 31.5} textAnchor="middle" className="foco-pilula-resposta">
            {pilula}
          </text>
        </g>
      )}
    </svg>
  );
}

/** O zoom da lousa quando o passo muda de camada (ADR-0026, item 13): sobe, a Aqua anda, para e desce. */
type Zoom = { passo: number; de: number; para: number; titulo: string; frase: string; fase: "sobe" | "anda" | "parada" };
const DESENHO_IDA = "inset(-14px 100% -14px 0%)";
const DESENHO_VOLTA = "inset(-14px 0% -14px 100%)";

/**
 * A lousa "Onde estamos" (ADR-0026, item 11), embaixo do quadro: as colunas da rede, a da vez
 * marcada, o nó da vez aceso e a Aqua em cima. Na troca de camada, a lousa faz o zoom (item 13).
 */
function LousaOndeEstamos({ mapa, onde, passo }: { mapa: MapaDaRede; onde: OndeEstamos; passo: number }) {
  const anterior = useRef(onde.coluna);
  // na volta, a camada mais à esquerda a que a culpa já chegou: só passar dela é camada nova
  const menor = useRef(onde.coluna);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const pequena = useRef<HTMLDivElement>(null);
  const grande = useRef<HTMLDivElement>(null);
  const veu = useRef<HTMLDivElement>(null);
  // o mapa é refeito a cada passo: o efeito olha só os nomes das colunas
  const colunas = mapa.colunas.map((c) => c.nome).join("|");
  const passoAntes = useRef(passo);
  useEffect(() => {
    const de = anterior.current;
    anterior.current = onde.coluna;
    const voltou = passo < passoAntes.current;
    passoAntes.current = passo;
    // Anterior desfaz o caminho: a camada da vez volta a ser a mais à esquerda
    if (onde.sentido === "ida" || voltou) menor.current = onde.sentido === "ida" ? mapa.colunas.length : onde.coluna;
    const nomes = colunas.split("|");
    const naIda = onde.sentido === "ida" && onde.coluna === de + 1 && de !== 0;
    const naVolta = onde.sentido === "volta" && onde.coluna < de && onde.coluna < menor.current;
    if (onde.sentido === "volta") menor.current = Math.min(menor.current, onde.coluna);
    // qualquer outro passo (inclusive Próximo no meio do zoom) pula a animação
    if (!(naIda || naVolta) || semMovimento()) return setZoom(null);
    setZoom(
      naIda
        ? { passo, de, para: onde.coluna, titulo: "Próxima camada!", frase: `Os resultados da ${nomes[de]} viram as entradas da ${nomes[onde.coluna]}.`, fase: "sobe" }
        : { passo, de, para: onde.coluna, titulo: "Camada anterior!", frase: `A culpa volta da ${nomes[de]} para a ${nomes[onde.coluna]}.`, fase: "sobe" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o zoom recomeça a cada passo
  }, [passo]);

  // a lousa sai de onde está embaixo, cresce no meio da tela e volta para o mesmo lugar
  const zoomDoPasso = zoom?.passo ?? null;
  useLayoutEffect(() => {
    const caixa = grande.current;
    const embaixo = pequena.current;
    if (zoomDoPasso === null || !caixa || !embaixo) return;
    const a = embaixo.getBoundingClientRect();
    const b = caixa.getBoundingClientRect();
    const la = { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: a.width / b.width };
    const fase = (f: Zoom["fase"]) => () => setZoom((z) => (z ? { ...z, fase: f } : null));
    const seta = caixa.querySelector(".foco-onde-seta");
    const tl = gsap.timeline({ onComplete: () => setZoom(null) });
    tl.set(embaixo, { autoAlpha: 0 }, 0)
      // um véu escuro por cima do quadro (mais leve que borrar o quadro inteiro)
      .fromTo(veu.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" }, 0)
      .from(caixa, { ...la, duration: 0.55, ease: "power3.out" }, 0)
      .call(fase("anda"), [], 0.55);
    // a seta se desenha no sentido da conta enquanto a Aqua anda
    if (seta) tl.fromTo(seta, { clipPath: onde.sentido === "ida" ? DESENHO_IDA : DESENHO_VOLTA }, { clipPath: "inset(-14px 0% -14px 0%)", duration: 0.8, ease: "power2.inOut" }, 0.55);
    tl.call(fase("parada"), [], 1.5)
      // na descida, a lousa grande encolhe até o lugar da pequena e some enquanto a pequena aparece
      .to(caixa, { ...la, duration: 0.6, ease: "power3.inOut" }, 2.5)
      .to(veu.current, { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, 2.5)
      .to(caixa, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 2.85)
      .to(embaixo, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, 2.85);
    return () => {
      tl.kill();
      gsap.set(embaixo, { clearProps: "opacity,visibility" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o sentido é o do passo que abriu o zoom
  }, [zoomDoPasso]);

  return (
    <>
      <div ref={pequena} className="foco-onde" aria-label={`Onde estamos: ${onde.frase}`}>
        <div className="foco-onde-topo">
          <span>Onde estamos</span>
          <b>{onde.frase}</b>
        </div>
        <MapaOnde mapa={mapa} coluna={onde.coluna} no={onde.no} seta={onde.seta} sentido={onde.sentido} aqua={onde.coluna} unidade={3} />
      </div>
      {zoom && <div ref={veu} className="foco-veu" aria-hidden />}
      {zoom && (
        <div ref={grande} className="foco-onde grande" role="status" onClick={() => setZoom(null)}>
          <div className="foco-onde-topo">
            <span>Onde estamos</span>
            <b>{zoom.titulo}</b>
            <p>{zoom.frase}</p>
          </div>
          <MapaOnde
            mapa={mapa}
            coluna={zoom.fase === "sobe" ? zoom.de : zoom.fase === "anda" ? -1 : zoom.para}
            no={zoom.fase === "parada" ? onde.no : null}
            seta={{ de: zoom.de, para: zoom.para }}
            sentido={onde.sentido}
            aqua={zoom.fase === "sobe" ? zoom.de : zoom.para}
            unidade={8}
            realcar
          />
        </div>
      )}
    </>
  );
}

function MapaOnde({
  mapa,
  coluna,
  no,
  seta,
  sentido,
  aqua,
  unidade,
  realcar = false,
}: {
  mapa: MapaDaRede;
  coluna: number;
  no: string | null;
  seta: OndeEstamos["seta"];
  sentido: OndeEstamos["sentido"];
  aqua: number;
  unidade: number;
  realcar?: boolean;
}) {
  const n = mapa.colunas.length;
  const pct = (c: number) => `${((c + 0.5) / n) * 100}%`;
  const entre = (c: number) => ({ left: `calc(${pct(c)} + var(--folga))`, width: `calc(${100 / n}% - 2 * var(--folga))` });
  // a Aqua anda até a coluna nova (GSAP); na primeira vez ela já aparece no lugar
  const aquaRef = useRef<HTMLSpanElement>(null);
  const aquaAntes = useRef(aqua);
  useLayoutEffect(() => {
    const el = aquaRef.current;
    const de = aquaAntes.current;
    aquaAntes.current = aqua;
    if (!el || de === aqua || semMovimento()) return;
    const tl = gsap.timeline();
    tl.fromTo(el, { left: `${((de + 0.5) / n) * 100}%` }, { left: `${((aqua + 0.5) / n) * 100}%`, duration: 0.9, ease: "sine.inOut" })
      .to(el, { y: -unidade * 1.5, duration: 0.15, ease: "sine.out", yoyo: true, repeat: 5 }, 0);
    return () => {
      tl.kill();
      gsap.set(el, { y: 0 });
    };
  }, [aqua, n, unidade]);
  // só na lousa grande: quando a Aqua chega, a coluna da vez e o nó aceso aparecem com um pop
  const mapaRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const m = mapaRef.current;
    if (!realcar || !m || coluna < 0 || semMovimento()) return;
    const alvos = [m.querySelector(".foco-onde-coluna.agora .foco-onde-nos"), m.querySelector("i.aceso")].filter(Boolean);
    const t = gsap.from(alvos, { scale: 0.6, autoAlpha: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.08, clearProps: "transform,opacity,visibility" });
    return () => {
      t.revert();
    };
  }, [realcar, coluna, no]);
  return (
    <div ref={mapaRef} className="foco-onde-mapa">
      {/* as linhas param antes dos nós, como no Figma: começam e terminam a uma folga de cada coluna */}
      {mapa.colunas.slice(1).map((c, i) => (
        <span key={c.nome + i} className="foco-onde-trilho" style={entre(i)} aria-hidden />
      ))}
      {seta && <span className={`foco-onde-seta ${sentido}`} style={entre(Math.min(seta.de, seta.para))} aria-hidden />}
      {mapa.colunas.map((c, i) => (
        <div key={c.nome + i} className={`foco-onde-coluna ${i === coluna ? "agora" : ""}`} style={{ left: pct(i) }}>
          <div className="foco-onde-nos">
            {c.nos.map((n) => (
              <i key={n.id} className={n.id === no ? "aceso" : ""} />
            ))}
          </div>
          <small>{c.nome}</small>
        </div>
      ))}
      <span ref={aquaRef} className="foco-onde-aqua" style={{ left: pct(aqua) }} aria-hidden>
        <Aqua unidade={unidade} />
      </span>
    </div>
  );
}

/* ---------- Volta ---------- */

function Volta({
  passos,
  atual,
  nomeNeuronio,
  origem,
  verConta,
}: {
  passos: PassoVolta[];
  atual: number;
  nomeNeuronio: (id: string) => string;
  origem: Map<string, string>;
  verConta: (c: Conta) => void;
}) {
  const q = quadroDaVolta(passos, atual);
  if (!q) return null;

  if (q.tipo === "erro") {
    return (
      <div className="foco-centro">
        <h2 className="foco-titulo">Quanto a rede errou</h2>
        <Cadeia
          elos={[
            { n: formatar(q.resposta), nome: "respondeu" },
            { op: "·" },
            { n: String(q.objetivo), nome: "número correto" },
            { op: "→" },
            { n: formatar(q.erro), nome: "erro", destaque: true },
          ]}
        />
        <p className="foco-nota">Agora a culpa volta pela rede, da Saída até a Entrada.</p>
      </div>
    );
  }

  if (q.tipo === "fim") {
    return (
      <div className="foco-centro">
        <h2 className="foco-titulo">Fim da volta</h2>
        <Cadeia elos={[{ n: formatar(q.erroAntes), nome: "erro antes" }, { op: "→" }, { n: formatar(q.erroDepois), nome: "erro depois", destaque: true }]} />
        <p className="foco-nota">Cada peso andou um passinho contra a sua culpa. O resumo está no painel.</p>
      </div>
    );
  }

  const nome = nomeNeuronio(q.neuronio);
  const origemDaCulpa = (final: boolean, chegou: number, inclinacao: number, culpa: number, conta: boolean) => [
    { n: final ? formatar(chegou) : culpaComSinal(chegou), nome: final ? "erro" : "culpa que chegou" },
    { op: "×" as const },
    { n: formatar(inclinacao), nome: final ? "inclinação da sigmoide" : "inclinação da ReLU" },
    { op: "=" as const },
    {
      n: culpaComSinal(culpa),
      nome: final ? "culpa da Saída" : `culpa do ${nome}`,
      destaque: true,
      conta:
        conta && final
          ? () =>
              verConta({
                a: formatar(chegou),
                b: formatar(inclinacao),
                nomeA: "erro",
                nomeB: "inclinação da sigmoide",
                nomeResultado: "culpa da Saída",
                casas: 3,
              })
          : undefined,
    },
  ];

  if (q.tipo === "neuronio") {
    if (q.apagado) {
      return (
        <div className="foco-centro">
          <h2 className="foco-titulo">{nome} passou 0</h2>
          <p className="foco-grande">A culpa para aqui: as linhas dele ficam iguais.</p>
          <p className="foco-nota">Com a ReLU, quem passou 0 não mudou a resposta. Então não tem culpa.</p>
        </div>
      );
    }
    return (
      <div className="foco-centro">
        <h2 className="foco-titulo">A culpa chega {q.final ? "na Saída" : `no ${nome}`}</h2>
        <Cadeia elos={origemDaCulpa(q.final, q.chegou, q.inclinacao, q.culpa, true)} />
        {q.final && <p className="foco-nota">Perto de 0 ou de 1 a sigmoide é quase plana: a culpa encolhe.</p>}
      </div>
    );
  }

  // culpa-linha: de onde vem a culpa da linha e o teste "e se?"
  const de = origem.get(q.linha) ?? nomeNeuronio(q.de);
  const culpaN = culpaComSinal(q.culpaNeuronio);
  const podeContar = (s: string) => !s.startsWith("menos");
  return (
    <>
      <h2 className="foco-titulo">
        A culpa volta: {nome} → {de}
      </h2>
      <DiagramaVolta de={de} para={nome} passou={q.passou} peso={q.antes} final={q.final} resposta={q.resposta} objetivo={q.objetivo} />
      <Cadeia
        elos={[
          // cadeia curta (ADR-0026, item 9): o erro × inclinação já apareceu no passo anterior e fica no "ver conta"
          ...origemDaCulpa(q.final, q.chegou, q.inclinacao, q.culpaNeuronio, true)
            .slice(4)
            .map((e) => ("destaque" in e ? { ...e, destaque: false } : e)),
          { op: "×" },
          { n: formatar(q.passou), nome: "o que passou" },
          { op: "=" },
          {
            n: culpaComSinal(q.culpa),
            nome: "culpa da linha",
            destaque: true,
            conta: podeContar(culpaN)
              ? () =>
                  verConta({
                    a: culpaN.replace(/^\+/, ""),
                    b: formatar(q.passou),
                    nomeA: q.final ? "culpa da Saída" : `culpa do ${nome}`,
                    nomeB: "o que passou",
                    nomeResultado: "culpa da linha",
                    casas: 3,
                  })
              : undefined,
          },
        ]}
      />
      {q.eSe ? (
        <div className="foco-ese">
          <div className="foco-ese-topo">
            <span>E se o peso…</span>
            <b>culpa {q.culpa > 0 ? "+ = subir piora" : "− = subir melhora"}</b>
          </div>
          {(["sobe", "desce"] as const).map((lado) => {
            const l = q.eSe![lado];
            const resposta = l.resposta === 0 ? "a resposta quase não muda" : `resposta ${l.resposta > 0 ? "sobe ↑" : "desce ↓"}`;
            return (
              <div key={lado} className={`foco-ese-linha ${l.melhora ? "melhora" : ""}`}>
                <b>{lado === "sobe" ? "sobe ↑" : "desce ↓"}</b>
                <span>{formatar(l.peso)}</span>
                <i aria-hidden>→</i>
                <span>{resposta}</span>
                <i aria-hidden>→</i>
                <span>
                  {l.melhora ? "perto" : "longe"} do certo ({q.objetivo})
                </span>
                <b className="foco-ese-marca">{l.melhora ? "✓" : "✗"}</b>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="foco-nota">Culpa 0: o peso fica igual.</p>
      )}
    </>
  );
}

/** A linha da vez com a culpa voltando (seta e bolinha da direita para a esquerda). */
function DiagramaVolta({
  de,
  para,
  passou,
  peso,
  final,
  resposta,
  objetivo,
}: {
  de: string;
  para: string;
  passou: number;
  peso: number;
  final: boolean;
  resposta: number;
  objetivo: number;
}) {
  const cor = peso < 0 ? "var(--erro)" : "var(--positivo)";
  return (
    <svg className="foco-diagrama volta" viewBox="0 0 640 134" role="img" aria-label={`A culpa volta de ${para} para ${de}`}>
      <line x1={132} y1={56} x2={508} y2={56} stroke={cor} strokeWidth={5} strokeLinecap="round" />
      <path d="M 146 56 l 14 -9 v 18 z" className="foco-seta" />
      <g transform="translate(310 82)">
        <rect x={-44} y={-13} width={88} height={26} rx={13} className={`foco-pilula ${peso < 0 ? "negativo" : "positivo"}`} />
        <text textAnchor="middle" y={4.5}>
          peso {formatar(peso)}
        </text>
      </g>
      <circle cx={90} cy={56} r={40} className="foco-no" />
      <text x={90} y={62} textAnchor="middle" className="foco-no-valor">
        {formatar(passou)}
      </text>
      <text x={90} y={118} textAnchor="middle" className="foco-no-nome">
        {de}
      </text>
      <circle cx={550} cy={56} r={40} className="foco-no destino" />
      {final ? (
        <>
          <text x={550} y={50} textAnchor="middle" className="foco-no-nome">
            respondeu
          </text>
          <text x={550} y={70} textAnchor="middle" className="foco-no-valor">
            {formatar(resposta)}
          </text>
        </>
      ) : (
        <circle cx={550} cy={56} r={9} className="foco-culpa" />
      )}
      <text x={550} y={114} textAnchor="middle" className="foco-no-nome destino">
        {para}
      </text>
      {final && (
        <text x={550} y={128} textAnchor="middle" className="foco-certo">
          número correto: {objetivo}
        </text>
      )}
      <BolinhaDeCulpa key={`${de}->${para}`} />
    </svg>
  );
}

/** Fade curto quando o conteúdo troca (passo novo, tela nova do "ver conta"); os números não animam. */
function useTroca(ref: React.RefObject<HTMLElement | null>, chave: unknown) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || semMovimento()) return;
    const t = gsap.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out", clearProps: "opacity,visibility,transform" });
    return () => {
      t.revert();
    };
  }, [ref, chave]);
}

/* ---------- As bolinhas andando (ADR-0026, item 14) ---------- */

type Ponto = { x: number; y: number };
const PONTO_DO_PESO = 0.6; // onde fica a pílula do peso: ali a bolinha faz a conta
const semMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A bolinha da linha da vez, como no canvas: sai com o que passou, faz a conta no peso, vira a
 * parte desta linha (verde +, vermelha −, cinza 0) e entra no neurônio. Repete enquanto o passo
 * está na tela, para dar tempo de ver.
 */
function BolinhaDaIda({ de, para, entrada, parte }: { de: Ponto; para: Ponto; entrada: number; parte: number }) {
  const ref = useRef<SVGGElement>(null);
  // sem movimento, a bolinha fica parada no peso, já com a parte desta linha
  const [parada] = useState(semMovimento);
  const [fez, setFez] = useState(parada);
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const prog = { p: 0 };
    const colocar = () => g.setAttribute("transform", `translate(${de.x + (para.x - de.x) * prog.p} ${de.y + (para.y - de.y) * prog.p})`);
    if (parada) {
      prog.p = PONTO_DO_PESO;
      colocar();
      return;
    }
    const bola = g.querySelector("circle");
    const neuronio = g.ownerSVGElement?.querySelector("circle.destino") ?? null;
    // seno nas duas metades: a velocidade não dá tranco quando passa pelo peso
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.7 });
    tl.call(() => setFez(false))
      .set(bola, { attr: { r: 9 } })
      .set(prog, { p: 0, onComplete: colocar })
      .fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out" })
      .to(prog, { p: PONTO_DO_PESO, duration: 1.1, ease: "sine.in", onUpdate: colocar }, "<")
      .call(() => setFez(true))
      // a conta acontece no peso: a bolinha incha um pouco e já sai com a cor do resultado
      .to(bola, { attr: { r: 12 }, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 })
      .to(prog, { p: 1, duration: 0.75, ease: "sine.out", onUpdate: colocar }, "<")
      // entra no neurônio: encolhe e some, e o neurônio recebe com um pulinho
      .to(bola, { attr: { r: 3 }, duration: 0.25, ease: "power1.in" })
      .to(g, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, "<");
    if (neuronio) tl.fromTo(neuronio, { scale: 1 }, { scale: 1.06, transformOrigin: "50% 50%", duration: 0.15, ease: "power1.out", yoyo: true, repeat: 1 }, "<0.1");
    return () => {
      tl.kill();
      if (neuronio) gsap.set(neuronio, { clearProps: "transform" });
    };
  }, [de.x, de.y, para.x, para.y, parada]);
  const tipo = !fez ? "neutra" : parte > 0 ? "positiva" : parte < 0 ? "negativa" : "zero";
  return (
    <g ref={ref} className={`bolinha foco-viajante ${tipo}`} aria-hidden>
      <circle r={9} />
      <text textAnchor="middle" y={-15}>
        {formatar(fez ? parte : entrada)}
      </text>
    </g>
  );
}

/** A bolinha de culpa (ADR-0025): aqua, sai da direita e volta pela linha até a origem. Repete. */
function BolinhaDeCulpa() {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (semMovimento()) {
      gsap.set(g, { x: 400, y: 56 });
      return;
    }
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.7 });
    tl.set(g, { x: 508, y: 56, scale: 1 })
      .fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out" })
      .to(g, { x: 132, duration: 1.6, ease: "sine.inOut" }, "<")
      .to(g, { autoAlpha: 0, scale: 0.4, duration: 0.25, ease: "power1.in" });
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <g ref={ref} aria-hidden>
      <circle r={10} className="foco-culpa" />
      <text y={-22} textAnchor="middle" className="foco-culpa-nome">
        culpa
      </text>
    </g>
  );
}

/* ---------- A cadeia de números com nome ---------- */

type Elo = { op: string } | { n: string; nome: string; cor?: "positivo" | "negativo"; destaque?: boolean; conta?: () => void };

function Cadeia({ elos }: { elos: Elo[] }) {
  return (
    <div className="foco-cadeia">
      {elos.map((e, i) =>
        "op" in e ? (
          <span key={i} className="foco-op" aria-hidden>
            {e.op}
          </span>
        ) : (
          <span key={i} className={`foco-elo ${e.destaque ? "destaque" : ""} ${e.cor ?? ""}`}>
            <b>{e.n}</b>
            <small>{e.nome}</small>
            {e.conta && (
              <button className="foco-ver-conta" onClick={e.conta}>
                ver conta ▸
              </button>
            )}
          </span>
        ),
      )}
    </div>
  );
}

/* ---------- Ver conta: a conta armada, uma tela por passo ---------- */

function VerConta({ conta, onFechar }: { conta: Conta; onFechar: () => void }) {
  const telas = contaArmada(conta.a, conta.b, conta.casas);
  const total = telas.length + (conta.fim ? 1 : 0);
  const [i, setI] = useState(0);
  const tela = telas[i];
  const caixa = useRef<HTMLDivElement>(null);
  const corpo = useRef<HTMLDivElement>(null);
  // o pop-up abre por cima do quadro; cada tela da conta entra com um fade curto
  useLayoutEffect(() => {
    if (semMovimento()) return;
    const t = gsap.from(caixa.current, { autoAlpha: 0, y: 12, scale: 0.98, duration: 0.3, ease: "power2.out" });
    return () => {
      t.revert();
    };
  }, []);
  useTroca(corpo, i);
  const legenda = `${conta.a} = ${conta.nomeA} · ${conta.b} = ${conta.nomeB}`;
  return (
    <div ref={caixa} className="ver-conta" role="dialog" aria-label={`A conta ${conta.a} × ${conta.b}, passo a passo`}>
      <div className="ver-conta-topo">
        <button className="foco-link" onClick={onFechar}>
          ← voltar ao quadro
        </button>
        <span>
          passo {i + 1} de {total}
        </span>
      </div>
      <h3>{tela ? tela.titulo : `Onde esse ${resultadoDe(telas)} entra`}</h3>
      <p className="ver-conta-legenda">{legenda}</p>
      <div ref={corpo} className="ver-conta-corpo">{tela ? <Corpo corpo={tela.corpo} conta={conta} primeira={i === 0} /> : conta.fim}</div>
      <div className="ver-conta-fala">
        <Aqua unidade={4} />
        <p>{tela ? tela.fala : `${resultadoDe(telas)} é a ${conta.nomeResultado}. Cada linha entrega a sua parte, e o neurônio soma todas.`}</p>
      </div>
      <div className="ver-conta-navegar">
        <button className="botao" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Anterior
        </button>
        <span className="ver-conta-bolinhas" aria-hidden>
          {Array.from({ length: total }, (_, k) => (
            <i key={k} className={k === i ? "agora" : ""} />
          ))}
        </span>
        {i < total - 1 ? (
          <button className="botao escuro" onClick={() => setI(i + 1)}>
            Próximo →
          </button>
        ) : (
          <button className="botao escuro" onClick={onFechar}>
            Voltar ao quadro
          </button>
        )}
      </div>
    </div>
  );
}

function resultadoDe(telas: ReturnType<typeof contaArmada>) {
  const c = telas.at(-1)?.corpo;
  if (!c) return "";
  if (c.tipo === "sinalVolta" || c.tipo === "zero") return c.resultado;
  if (c.tipo === "arredonda") return c.para;
  if (c.tipo === "virgula") return c.fica;
  return "";
}

function Corpo({ corpo, conta, primeira }: { corpo: CorpoConta; conta: Conta; primeira: boolean }) {
  switch (corpo.tipo) {
    case "sinal":
      return (
        <div className="ver-conta-par">
          <Numero texto={corpo.a} nome={primeira ? conta.nomeA : undefined} />
          <span className="foco-op">×</span>
          <Numero texto={corpo.b} nome={primeira ? conta.nomeB : undefined} />
        </div>
      );
    case "tirar":
      return (
        <div className="ver-conta-tirar">
          {corpo.itens.map((it, k) => (
            <div key={k}>
              <span>
                {it.de}
                {it.semZero && ` = ${it.semZero}`}
                {primeira && <small>{k === 0 ? conta.nomeA : conta.nomeB}</small>}
              </span>
              <i aria-hidden>→</i>
              <b>{it.para}</b>
              <small>{it.casas === 0 ? "sem casas" : it.casas === 1 ? "1 casa" : `${it.casas} casas`}</small>
            </div>
          ))}
        </div>
      );
    case "armada":
      return <Armada linhas={corpo.linhas} barras={corpo.barras} />;
    case "virgula":
      return (
        <div className="ver-conta-resultado">
          <b>{corpo.resultado}</b>
          {corpo.fica !== corpo.resultado && <span>= {corpo.fica}</span>}
          <small>{conta.nomeResultado}</small>
        </div>
      );
    case "arredonda":
      return (
        <div className="ver-conta-resultado">
          <span>{corpo.de} ≈</span>
          <b>{corpo.para}</b>
          <small>{conta.nomeResultado}</small>
        </div>
      );
    case "sinalVolta":
      return (
        <div className="ver-conta-resultado">
          <span className="ver-conta-regra">{corpo.regra}</span>
          <b className={corpo.resultado.startsWith("−") ? "negativo" : ""}>{corpo.resultado}</b>
          <small>{conta.nomeResultado}</small>
        </div>
      );
    case "zero":
      return (
        <div className="ver-conta-resultado">
          <b>{corpo.resultado}</b>
          <small>{conta.nomeResultado}</small>
        </div>
      );
  }
}

function Numero({ texto, nome }: { texto: string; nome?: string }) {
  const negativo = texto.startsWith("−");
  return (
    <span className="ver-conta-numero">
      <b>
        {negativo && <em>−</em>}
        {texto.replace(/^−/, "")}
      </b>
      {nome && <small>{nome}</small>}
    </span>
  );
}

/** A conta armada: algarismos em colunas, alinhados à direita, com os da vez acesos. */
function Armada({ linhas, barras }: { linhas: LinhaArmada[]; barras: number[] }) {
  const colunas = Math.max(...linhas.map((l) => l.digitos.length));
  return (
    <div className="armada" style={{ gridTemplateColumns: `1.4em repeat(${colunas}, 1.1em)` }}>
      {linhas.map((l, r) => {
        const d = l.digitos.padStart(colunas, " ");
        return (
          <div key={r} className={`armada-linha ${barras.includes(r) ? "barra" : ""}`} style={{ display: "contents" }}>
            <span className="armada-op">{l.op ?? ""}</span>
            {[...d].map((ch, c) => {
              const k = colunas - 1 - c;
              const classe = l.destaque?.includes(k) ? "destaque" : l.apagados?.includes(k) ? "apagado" : "";
              return (
                <span key={c} className={`armada-digito ${classe} ${barras.includes(r) ? "barra" : ""}`}>
                  {ch.trim()}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

