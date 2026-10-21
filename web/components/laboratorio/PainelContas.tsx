"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { formatar, type Erro, type Passo, type Rodada } from "@/lib/rede";

type Props = {
  rodada: Rodada | null;
  atual: number;
  erros: Erro[];
  automatico: boolean;
  irPara: (passo: number) => void;
  setAutomatico: (ligado: boolean) => void;
  /** "0,71 → laranja (1)", com o objetivo que o aluno deu à Saída. */
  textoResposta: (saidaId: string, valor: number, resposta: 0 | 1) => string;
  /** Para o botão Treinar da barra de cima rolar até aqui. */
  treinarRef: RefObject<HTMLElement | null>;
};

/** Painel da direita: as contas, uma multiplicação de cada vez, e o Treinar. */
export default function PainelContas({ rodada, atual, erros, automatico, irPara, setAutomatico, textoResposta, treinarRef }: Props) {
  const total = rodada?.passos.length ?? 0;
  const passo = rodada?.passos[atual];
  const graves = erros.filter((e) => e.tipo !== "aviso");
  const avisos = erros.filter((e) => e.tipo === "aviso");

  return (
    <aside className="painel">
      <div className="painel-topo">
        <h2>Contas</h2>
        {rodada && (
          <span className="painel-passo">
            Passo {atual + 1} de {total}
          </span>
        )}
      </div>

      {graves.length > 0 && (
        <div className="erros">
          {graves.map((e, i) => (
            <p key={i}>{e.mensagem}</p>
          ))}
          <p className="erros-dica">O bloco com problema está marcado em vermelho.</p>
        </div>
      )}

      {avisos.length > 0 && (
        <div className="avisos">
          {avisos.map((e, i) => (
            <p key={i}>{e.mensagem}</p>
          ))}
        </div>
      )}

      {!rodada && graves.length === 0 && (
        <p className="contas-vazio">Clique em Rodar para ver os números atravessarem a rede, uma conta de cada vez.</p>
      )}

      {rodada && passo && <ContasDoPasso rodada={rodada} atual={atual} passo={passo} textoResposta={textoResposta} />}

      {rodada && (
        <>
          <div className="navegar">
            <button className="botao" disabled={atual === 0} onClick={() => irPara(atual - 1)}>
              ← Anterior
            </button>
            <button className="botao escuro" disabled={atual === total - 1} onClick={() => irPara(atual + 1)}>
              Próximo →
            </button>
          </div>
          <div className="alternar">
            <button className={!automatico ? "ativo" : ""} onClick={() => setAutomatico(false)}>
              Passo a passo
            </button>
            <button className={automatico ? "ativo" : ""} onClick={() => setAutomatico(true)}>
              Automático
            </button>
          </div>
        </>
      )}

      <Treinar secaoRef={treinarRef} />
    </aside>
  );
}

/**
 * Seção Treinar, como no Figma. O treino ainda não foi feito em código:
 * os campos já funcionam, mas o botão fica desligado (ADR-0020).
 */
function Treinar({ secaoRef }: { secaoRef: RefObject<HTMLElement | null> }) {
  const [repeticoes, setRepeticoes] = useState(1000);
  const [velocidade, setVelocidade] = useState("x100");
  const [doZero, setDoZero] = useState(true);

  return (
    <section ref={secaoRef} className="treinar" aria-labelledby="treinar-titulo">
      <h2 id="treinar-titulo">Treinar</h2>
      <div className="treinar-campos">
        <label>
          <span>Repetições</span>
          <input
            type="number"
            min={1}
            max={100000}
            value={repeticoes}
            onChange={(e) => setRepeticoes(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label>
          <span>Velocidade</span>
          <select value={velocidade} onChange={(e) => setVelocidade(e.target.value)}>
            <option>x1</option>
            <option>x10</option>
            <option>x100</option>
          </select>
        </label>
      </div>
      <div className="treinar-rotulo">Começar de</div>
      <div className="alternar">
        <button className={doZero ? "ativo" : ""} onClick={() => setDoZero(true)}>
          Do zero
        </button>
        <button className={!doZero ? "ativo" : ""} onClick={() => setDoZero(false)}>
          Já treinada
        </button>
      </div>
      <button className="botao principal treinar-botao" disabled aria-describedby="treinar-nota">
        Treinar {repeticoes.toLocaleString("pt-BR")} vezes
      </button>
      <p id="treinar-nota" className="treinar-nota">O treino chega na próxima etapa. No fim, você verá as saídas de cada repetição.</p>
    </section>
  );
}

/**
 * O último neurônio passa a soma pela sigmoide, que a deixa entre 0 e 1 (frame "Laboratório ·
 * Desktop · v2 (sigmoide)"). Uma curva em S pequena mostra onde a soma caiu, e a conta vem em
 * três passos com os números da rodada. A fórmula geral fica só no tutorial 03 · A sigmoide.
 */
function Sigmoide({ soma, valor }: { soma: number; valor: number }) {
  const e = Math.exp(-soma);
  return (
    <div className="sigmoide">
      <div className="sigmoide-titulo">
        <b>Sigmoide</b> deixa a soma entre 0 e 1 · soma {formatar(soma)}
      </div>
      <CurvaS soma={soma} valor={valor} />
      <div className="sigmoide-rotulo">A conta</div>
      <ol className="sigmoide-passos">
        <li>
          <span className="sigmoide-num">1</span>Troca o sinal da soma: {formatar(-soma)}
        </li>
        <li>
          <span className="sigmoide-num">2</span>
          <span>
            e<sup>{formatar(-soma)}</sup> ≈ {formatar(e)}
          </span>
        </li>
        <li className="sigmoide-final">
          <span className="sigmoide-num">3</span>1 ÷ (1 + {formatar(e)}) = {formatar(valor)}
        </li>
      </ol>
      <Link href="/tutoriais/sigmoide" className="sigmoide-link">
        Por que essa conta? Tutorial A sigmoide →
      </Link>
    </div>
  );
}

/** Curva em S de −6 a 6 com o ponto da soma da rodada (somas fora disso ficam na ponta). */
function CurvaS({ soma, valor }: { soma: number; valor: number }) {
  const px = (s: number) => 22 + ((s + 6) / 12) * 210;
  const py = (v: number) => 74 - v * 62;
  const caminho = Array.from({ length: 49 }, (_, i) => -6 + i * 0.25)
    .map((s, i) => `${i ? "L" : "M"}${px(s).toFixed(1)} ${py(1 / (1 + Math.exp(-s))).toFixed(1)}`)
    .join(" ");
  const sx = px(Math.max(-6, Math.min(6, soma)));
  const sy = py(valor);
  const direita = sx > 150;
  return (
    <svg className="sigmoide-curva" viewBox="0 0 244 96" role="img" aria-label={`Curva em S: a soma ${formatar(soma)} vira ${formatar(valor)}.`}>
      <line x1={22} y1={py(1)} x2={232} y2={py(1)} className="sigmoide-guia" strokeDasharray="3 3" />
      <line x1={22} y1={py(0)} x2={232} y2={py(0)} className="sigmoide-guia" />
      <line x1={px(0)} y1={8} x2={px(0)} y2={78} className="sigmoide-guia" strokeDasharray="3 3" />
      <text x={14} y={py(1) + 3} textAnchor="end">1</text>
      <text x={14} y={py(0) + 3} textAnchor="end">0</text>
      <text x={px(0)} y={90} textAnchor="middle">soma 0</text>
      <path d={caminho} className="sigmoide-linha" />
      <line x1={sx} y1={sy} x2={sx} y2={py(0)} className="sigmoide-marca" strokeDasharray="2 2" />
      <circle cx={sx} cy={sy} r={4.5} className="sigmoide-ponto" />
      <text x={sx} y={90} textAnchor="middle" className="sigmoide-valor">
        {Math.abs(sx - px(0)) > 26 ? formatar(soma) : ""}
      </text>
      <text x={direita ? sx - 8 : sx + 8} y={sy < 40 ? sy + 16 : sy - 8} textAnchor={direita ? "end" : "start"} className="sigmoide-valor">
        {formatar(valor)}
      </text>
    </svg>
  );
}

function ContasDoPasso({ rodada, atual, passo, textoResposta }: { rodada: Rodada; atual: number; passo: Passo; textoResposta: Props["textoResposta"] }) {
  if (passo.tipo === "saida") {
    return (
      <div className="contas">
        <span className="chip">Saída</span>
        <p>A Saída lê o último neurônio e decide a resposta.</p>
        <p className="contas-formula agora">{textoResposta(passo.saida, passo.valor, passo.resposta)}</p>
        <p className="contas-nota">Abaixo de 0,50 a resposta é 0; a partir de 0,50 é 1.</p>
      </div>
    );
  }

  // todas as contas do neurônio da vez, com o índice de cada uma na rodada
  const doNeuronio = rodada.passos.map((p, i) => ({ p, i })).filter(({ p }) => p.tipo !== "saida" && p.neuronio === passo.neuronio);
  const termos = doNeuronio.filter(({ p }) => p.tipo === "termo");
  const ativacao = doNeuronio.find(({ p }) => p.tipo === "ativacao");
  const somaPronta = ativacao && ativacao.i <= atual && ativacao.p.tipo === "ativacao" ? ativacao.p : null;

  return (
    <div className="contas">
      <span className="chip">{rodada.nomes.get(passo.neuronio)}</span>
      <p className="contas-nota">Multiplica cada entrada pelo peso da sua linha. Uma de cada vez.</p>

      {termos.map(({ p, i }) => {
        if (p.tipo !== "termo") return null;
        const status = i < atual ? "feito" : i === atual ? "agora" : "proximo";
        return (
          <div key={i} className={`termo ${status}`}>
            <span className="termo-marca">{status === "feito" ? "✓" : termos.findIndex((t) => t.i === i) + 1}</span>
            <div>
              <div className="termo-nome">
                {p.nome}
                {status === "agora" && " · agora"}
                {status === "proximo" && i === atual + 1 && " · próxima"}
              </div>
              <div className="termo-conta">
                {formatar(p.entrada)} × {formatar(p.peso)} = {status === "proximo" ? "?" : formatar(p.entrada * p.peso)}
              </div>
            </div>
          </div>
        );
      })}

      <div className={`termo soma ${somaPronta ? "feito" : ""}`}>
        <div>
          <div className="termo-nome">Soma {somaPronta ? "" : "(no fim)"}</div>
          <div className="termo-conta">
            {termos.map(({ p, i }) => (p.tipo === "termo" && i <= atual ? formatar(p.entrada * p.peso) : "?")).join(" + ")} ={" "}
            {somaPronta ? formatar(somaPronta.soma) : "?"}
          </div>
        </div>
      </div>

      {somaPronta?.final ? (
        <Sigmoide soma={somaPronta.soma} valor={somaPronta.valor} />
      ) : somaPronta ? (
        <p className="contas-resultado">
          {somaPronta.soma > 0
              ? `Positivo: o neurônio acende e passa ${formatar(somaPronta.valor)} adiante.`
              : "Negativo ou zero: o neurônio apaga e passa 0,00 adiante."}
        </p>
      ) : null}
    </div>
  );
}
