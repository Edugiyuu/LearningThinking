"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type Edge, type EdgeProps } from "@xyflow/react";
import { formatar, limitarPeso, NEURONIO_TAMANHO, type EstadoLinha, type Vista } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";
import { MarcaSinal } from "@/components/laboratorio/ContasDaVolta";

const LUPA: Record<"+" | "-" | "=", string> = { "+": "mais forte", "-": "mais fraca", "=": "igual" };

type PesoData = { peso: number; editando: boolean; posicao: number; estado: EstadoLinha; conta?: Vista["contaAgora"] };

/**
 * Linha entre dois neurônios: espessura = força, cor = sinal, e o número do peso.
 * Durante a rodada, a linha da conta atual fica destacada e as que ainda não vieram ficam apagadas.
 */
export default function PesoEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<Edge<PesoData>>) {
  const { editarPeso, salvarPeso, chegou, bolinhaChegou, informarLinha, posicaoDoPeso, volta, modoVolta } = useLab();
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const peso = data?.peso ?? 0;
  const estado = data?.estado ?? "normal";
  const t = posicaoDoPeso.get(id) ?? data?.posicao ?? 0.5;
  const x = sourceX + (targetX - sourceX) * t;
  const y = sourceY + (targetY - sourceY) * t;
  const cor = peso >= 0 ? "var(--peso-positivo)" : "var(--peso-negativo)";
  const largura = 0.75 + Math.min(Math.abs(peso), 3) * 1.1;
  const conta = estado === "agora" ? data?.conta : null;
  // na volta (ADR-0025): a linha da vez leva a bolinha de culpa e a lupa; as que já passaram ganham o sinal
  const daVolta = volta?.linhaAgora?.linha === id ? volta.linhaAgora : null;
  const sinal = volta?.sinais.get(id);
  const estiloVolta = daVolta
    ? { stroke: "var(--destaque)", strokeWidth: 2.5, strokeLinecap: "round" as const }
    : { stroke: cor, strokeWidth: largura, strokeOpacity: sinal ? 0.7 : 0.22 };

  // o laboratório junta as pontas de todas as linhas para os números não se encavalarem
  useEffect(() => {
    informarLinha(id, { sx: sourceX, sy: sourceY, tx: targetX, ty: targetY });
  }, [id, sourceX, sourceY, targetX, targetY, informarLinha]);

  return (
    <>
      <BaseEdge
        path={path}
        interactionWidth={14}
        style={
          volta
            ? estiloVolta
            : estado === "agora"
            ? { stroke: "var(--destaque)", strokeWidth: 2.5, strokeLinecap: "round" }
            : { stroke: cor, strokeWidth: largura, strokeOpacity: estado === "apagada" ? 0.22 : 0.7 }
        }
      />
      {conta && chegou !== conta.passo && (
        <Bolinha
          // chave nova a cada passo: a bolinha recomeça do início da linha
          key={conta.passo}
          de={{ x: sourceX, y: sourceY }}
          // termina no centro do neurônio, não na borda onde a linha encaixa
          para={{ x: targetX + NEURONIO_TAMANHO / 2, y: targetY }}
          noPeso={t}
          entrada={conta.entrada}
          resultado={conta.entrada * conta.peso}
          chegar={() => bolinhaChegou(conta.passo)}
        />
      )}
      {daVolta && daVolta.culpa !== 0 && (
        <BolinhaDeCulpa
          key={daVolta.passo}
          // a culpa anda ao contrário da ida: do centro do neurônio de destino até a origem
          de={{ x: targetX + NEURONIO_TAMANHO / 2, y: targetY }}
          para={{ x: sourceX, y: sourceY }}
          raio={4 + 7 * daVolta.tamanho}
        />
      )}
      <EdgeLabelRenderer>
        {daVolta && (
          <div className="lupa nodrag nopan" style={{ transform: `translate(-50%, 22px) translate(${x}px, ${y}px)` }}>
            <div className="lupa-pesos">
              {formatar(daVolta.antes)} → {formatar(daVolta.salvo)}
            </div>
            <span className={`lupa-sinal ${daVolta.sinal === "+" ? "mais" : daVolta.sinal === "-" ? "menos" : "igual"}`}>
              {daVolta.sinal === "-" ? "−" : daVolta.sinal} {LUPA[daVolta.sinal]}
            </span>
            {modoVolta === "mostrar" && daVolta.sinal !== "=" && <div className="lupa-nota">andaria assim</div>}
            {/* a regra do mínimo de 0,01 só aparece quando ela agiu de verdade (ADR-0025) */}
            {daVolta.sinal !== "=" && limitarPeso(daVolta.depois) === limitarPeso(daVolta.antes) && (
              <div className="lupa-nota">
                pela conta: {daVolta.depois < 0 ? "−" : ""}
                {Math.abs(daVolta.depois).toFixed(3).replace(".", ",")} · anda o mínimo de 0,01
              </div>
            )}
          </div>
        )}
        <div
          className={`peso nodrag nopan ${peso >= 0 ? "positivo" : "negativo"} ${estado}`}
          style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
          onDoubleClick={() => editarPeso(id)}
          title="Duplo clique para mudar o peso"
        >
          {data?.editando ? (
            <EditorDePeso inicial={peso} salvar={(v) => salvarPeso(id, v)} cancelar={() => editarPeso(null)} />
          ) : (
            <>
              {sinal && <MarcaSinal sinal={sinal} />}
              {estado === "agora" && !volta && "× "}
              {formatar(peso)}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const DURACAO_CAMINHO = 1.75; // segundos da origem até o centro do neurônio
const DURACAO_ENTRAR = 0.25; // a bolinha some dentro do neurônio

type Ponto = { x: number; y: number };

/**
 * A bolinha da linha da vez: sai neutra com o valor da origem, faz a conta
 * ao passar pelo número do peso, vira o resultado (verde +, vermelho −, cinza 0)
 * e entra no neurônio, que passa a somar essa parcela.
 */
function Bolinha({
  de,
  para,
  noPeso,
  entrada,
  resultado,
  chegar,
}: {
  de: Ponto;
  para: Ponto;
  noPeso: number;
  entrada: number;
  resultado: number;
  chegar: () => void;
}) {
  const ref = useRef<SVGGElement>(null);
  // quem pediu menos movimento no sistema não vê a viagem: a parcela entra direto no neurônio
  const [semMovimento] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [fez, setFez] = useState(false);
  // o ponto do peso fica fixo durante a viagem, mesmo se os números se reorganizarem
  const [ondeFazConta] = useState(noPeso);
  const chegarRef = useRef(chegar);
  useLayoutEffect(() => {
    chegarRef.current = chegar;
  });

  // as pontas da linha podem mexer durante o caminho (um bloco que cresce, o aluno arrastando);
  // a animação lê sempre as pontas atuais em vez de recomeçar
  const linha = useRef({ de, para });
  const progresso = useRef(0);
  const colocar = useCallback(() => {
    const { de, para } = linha.current;
    const p = progresso.current;
    ref.current?.setAttribute("transform", `translate(${de.x + (para.x - de.x) * p} ${de.y + (para.y - de.y) * p})`);
  }, []);
  useLayoutEffect(() => {
    linha.current = { de, para };
    colocar();
  });

  // a bolinha nasce a cada passo (a chave muda), então a animação roda uma vez só
  useEffect(() => {
    const g = ref.current;
    if (semMovimento) {
      chegarRef.current();
      return;
    }
    if (!g) return;
    const prog = { p: 0 };
    const andar = () => {
      progresso.current = prog.p;
      colocar();
    };
    const tl = gsap.timeline();
    tl.to(prog, { p: ondeFazConta, duration: DURACAO_CAMINHO * ondeFazConta, ease: "power1.in", onUpdate: andar })
      .call(() => setFez(true))
      .to(prog, { p: 1, duration: DURACAO_CAMINHO * (1 - ondeFazConta), ease: "power1.out", onUpdate: andar })
      // entra no neurônio: encolhe e some no centro dele
      .to(g, { opacity: 0, duration: DURACAO_ENTRAR, ease: "power1.in" })
      .to(g.querySelector("circle"), { attr: { r: 2 }, duration: DURACAO_ENTRAR, ease: "power1.in" }, "<")
      .call(() => chegarRef.current());
    return () => {
      tl.kill();
    };
  }, [ondeFazConta, semMovimento, colocar]);

  if (semMovimento) return null;
  const valor = fez ? resultado : entrada;
  const tipo = !fez ? "neutra" : resultado > 0 ? "positiva" : resultado < 0 ? "negativa" : "zero";

  return (
    <g ref={ref} className={`bolinha ${tipo}`} aria-hidden>
      <circle r={7} />
      {/* o número vai em cima da bolinha, para ficar legível mesmo pequeno */}
      <text textAnchor="middle" y={-12}>
        {formatar(valor)}
      </text>
    </g>
  );
}

/**
 * A bolinha de culpa (ADR-0025): aqua, do tamanho da culpa da linha, anda do neurônio de
 * destino até a origem, o caminho contrário da bolinha da ida.
 */
function BolinhaDeCulpa({ de, para, raio }: { de: Ponto; para: Ponto; raio: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const [semMovimento] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const linha = useRef({ de, para });
  useLayoutEffect(() => {
    linha.current = { de, para };
  });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const prog = { p: semMovimento ? 1 : 0 };
    const colocar = () => {
      const { de, para } = linha.current;
      c.setAttribute("cx", String(de.x + (para.x - de.x) * prog.p));
      c.setAttribute("cy", String(de.y + (para.y - de.y) * prog.p));
    };
    colocar();
    if (semMovimento) return;
    const tl = gsap.to(prog, { p: 1, duration: DURACAO_CULPA, ease: "power1.inOut", onUpdate: colocar });
    return () => {
      tl.kill();
    };
  }, [semMovimento]);

  return <circle ref={ref} r={raio} className="bolinha-culpa" aria-hidden />;
}

const DURACAO_CULPA = 1.2; // segundos do neurônio até a origem da linha

function EditorDePeso({ inicial, salvar, cancelar }: { inicial: number; salvar: (v: number) => void; cancelar: () => void }) {
  const [texto, setTexto] = useState(String(inicial));
  const confirmar = () => {
    const v = Number(texto.replace(",", ".").replace("−", "-"));
    if (Number.isNaN(v)) cancelar();
    else salvar(limitarPeso(v));
  };

  return (
    <input
      autoFocus
      className="peso-editor"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === "Enter") confirmar();
        if (e.key === "Escape") cancelar();
      }}
    />
  );
}
