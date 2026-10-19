"use client";

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

      {somaPronta ? (
        <p className="contas-resultado">
          {somaPronta.final
            ? `Espremer entre 0 e 1: ${formatar(somaPronta.soma)} → ${formatar(somaPronta.valor)}`
            : somaPronta.soma > 0
              ? `Positivo: o neurônio acende e passa ${formatar(somaPronta.valor)} adiante.`
              : "Negativo ou zero: o neurônio apaga e passa 0,00 adiante."}
        </p>
      ) : (
        <p className="contas-nota">
          Depois: {passo.tipo === "termo" && rodada.passos.find((p) => p.tipo === "ativacao" && p.neuronio === passo.neuronio && p.final)
            ? "a soma é espremida entre 0 e 1."
            : "se a soma for positiva, o neurônio acende; se não, passa 0."}
        </p>
      )}
    </div>
  );
}
