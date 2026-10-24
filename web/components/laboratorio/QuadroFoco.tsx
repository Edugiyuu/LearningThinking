"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

type Props = {
  rodada: Rodada;
  /** Os passos da volta, que vêm depois dos da ida (ADR-0025). */
  volta: PassoVolta[] | null;
  atual: number;
  textoResposta: (saidaId: string, valor: number, resposta: 0 | 1) => string;
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
export default function QuadroFoco({ rodada, volta, atual, textoResposta, onFechar }: Props) {
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

  return (
    <div className="foco" role="dialog" aria-label="Modo Foco: a conta da vez">
      <div className="foco-quadro">
        <button className="foco-fechar" onClick={onFechar} aria-label="Fechar o Modo Foco">
          ×
        </button>
        <div className="foco-etapa">{etapa}</div>
        {naVolta ? (
          <Volta passos={volta} atual={atual - daIda} nomeNeuronio={nomeNeuronio} origem={origem} verConta={setConta} />
        ) : (
          <Ida rodada={rodada} mapa={mapa} atual={atual} nomeNeuronio={nomeNeuronio} textoResposta={textoResposta} verConta={setConta} />
        )}
      </div>
      <LousaOndeEstamos mapa={mapa} onde={onde} />
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
  textoResposta,
  verConta,
}: {
  rodada: Rodada;
  mapa: MapaDaRede;
  atual: number;
  nomeNeuronio: (id: string) => string;
  textoResposta: Props["textoResposta"];
  verConta: (c: Conta) => void;
}) {
  const q = quadroDaIda(rodada, atual);
  if (!q) return null;
  if (q.tipo === "saida") {
    return (
      <>
        <h2 className="foco-titulo">A rede toda</h2>
        <p className="foco-nota esquerda">A entrada passou pelas camadas e virou a resposta: {textoResposta(q.saida, q.valor, q.resposta)}.</p>
        <RedeToda mapa={mapa} />
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
                <circle cx={118 + (338 - 118) * 0.35} cy={y + (dy - y) * 0.35} r={7} className="foco-bolinha" />
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
function RedeToda({ mapa }: { mapa: MapaDaRede }) {
  const largura = 720;
  const passo = 64;
  const maior = Math.max(...mapa.colunas.map((c) => c.nos.length));
  const altura = maior * passo + 50;
  const x = (c: number) => 70 + (c * (largura - 140)) / Math.max(1, mapa.colunas.length - 1);
  const pos = new Map<string, { x: number; y: number }>();
  mapa.colunas.forEach((c, i) => c.nos.forEach((n, j) => pos.set(n.id, { x: x(i), y: 40 + (j - (c.nos.length - 1) / 2) * passo + (maior * passo) / 2 - passo / 2 })));
  const ultima = mapa.colunas.length - 1;
  return (
    <svg className="foco-rede" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="A rede toda, da Entrada até a Saída">
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
            opacity={0.7}
          />
        );
      })}
      {mapa.colunas.map((c, i) => (
        <g key={c.nome + i}>
          <text x={x(i)} y={14} textAnchor="middle" className="foco-no-nome destino">
            {c.nome}
          </text>
          {c.nos.map((n) => {
            const p = pos.get(n.id)!;
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r={i === ultima ? 26 : 22} className={`foco-no ${i === ultima ? "destino" : ""}`} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" className="foco-no-valor pequeno">
                  {formatar(n.valor)}
                </text>
                {i === 0 && (
                  <text x={p.x - 32} y={p.y + 4} textAnchor="end" className="foco-no-nome">
                    {n.nome}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/**
 * A lousa "Onde estamos" (ADR-0026, item 11), embaixo do quadro: as colunas da rede, a da vez
 * marcada, o nó da vez aceso e a Aqua em cima. Quando a ida passa para a próxima camada, a Aqua
 * anda até lá (a transição do CSS) e a lousa avisa por um instante.
 */
function LousaOndeEstamos({ mapa, onde }: { mapa: MapaDaRede; onde: OndeEstamos }) {
  const anterior = useRef(onde.coluna);
  const [aviso, setAviso] = useState<string | null>(null);
  // o mapa é refeito a cada passo: o efeito olha só os nomes das colunas
  const colunas = mapa.colunas.map((c) => c.nome).join("|");
  useEffect(() => {
    const de = anterior.current;
    anterior.current = onde.coluna;
    if (onde.sentido !== "ida" || onde.coluna !== de + 1 || de === 0) return;
    const nomes = colunas.split("|");
    setAviso(`Próxima camada! Os resultados da ${nomes[de]} viram as entradas da ${nomes[onde.coluna]}.`);
  }, [onde.coluna, onde.sentido, colunas]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  const n = mapa.colunas.length;
  const pct = (c: number) => `${((c + 0.5) / n) * 100}%`;
  return (
    <div className="foco-onde" aria-label={`Onde estamos: ${onde.frase}`}>
      <div className="foco-onde-topo">
        <span>Onde estamos</span>
        <b>{aviso ?? onde.frase}</b>
      </div>
      <div className="foco-onde-mapa">
        {onde.seta && (
          <span
            className={`foco-onde-seta ${onde.sentido}`}
            style={{ left: pct(Math.min(onde.seta.de, onde.seta.para)), width: `${(1 / n) * 100}%` }}
            aria-hidden
          />
        )}
        {mapa.colunas.map((c, i) => (
          <div key={c.nome + i} className={`foco-onde-coluna ${i === onde.coluna ? "agora" : ""}`} style={{ left: pct(i) }}>
            <div className="foco-onde-nos">
              {c.nos.map((no) => (
                <i key={no.id} className={no.id === onde.no ? "aceso" : ""} />
              ))}
            </div>
            <small>{c.nome}</small>
          </div>
        ))}
        <span className="foco-onde-aqua" style={{ left: pct(onde.coluna) }} aria-hidden>
          <Aqua unidade={3} />
        </span>
      </div>
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
      <>
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
      </>
    );
  }

  if (q.tipo === "fim") {
    return (
      <>
        <h2 className="foco-titulo">Fim da volta</h2>
        <Cadeia elos={[{ n: formatar(q.erroAntes), nome: "erro antes" }, { op: "→" }, { n: formatar(q.erroDepois), nome: "erro depois", destaque: true }]} />
        <p className="foco-nota">Cada peso andou um passinho contra a sua culpa. O resumo está no painel.</p>
      </>
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
        <>
          <h2 className="foco-titulo">{nome} passou 0</h2>
          <p className="foco-grande">A culpa para aqui: as linhas dele ficam iguais.</p>
          <p className="foco-nota">Com a ReLU, quem passou 0 não mudou a resposta. Então não tem culpa.</p>
        </>
      );
    }
    return (
      <>
        <h2 className="foco-titulo">A culpa chega {q.final ? "na Saída" : `no ${nome}`}</h2>
        <Cadeia elos={origemDaCulpa(q.final, q.chegou, q.inclinacao, q.culpa, true)} />
        {q.final && <p className="foco-nota">Perto de 0 ou de 1 a sigmoide é quase plana: a culpa encolhe.</p>}
      </>
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
      <circle cx={400} cy={56} r={10} className="foco-culpa" />
      <text x={400} y={34} textAnchor="middle" className="foco-culpa-nome">
        culpa
      </text>
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
    </svg>
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
  const legenda = `${conta.a} = ${conta.nomeA} · ${conta.b} = ${conta.nomeB}`;
  return (
    <div className="ver-conta" role="dialog" aria-label={`A conta ${conta.a} × ${conta.b}, passo a passo`}>
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
      <div className="ver-conta-corpo">{tela ? <Corpo corpo={tela.corpo} conta={conta} primeira={i === 0} /> : conta.fim}</div>
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

