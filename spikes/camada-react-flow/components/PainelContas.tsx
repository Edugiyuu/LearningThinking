"use client";

import { formatar, type Erro, type Passo, type Rodada } from "@/lib/rede";

type Props = {
  rodada: Rodada | null;
  atual: number;
  erros: Erro[];
  automatico: boolean;
  rodar: () => void;
  irPara: (passo: number) => void;
  setAutomatico: (ligado: boolean) => void;
  /** "0,71 → laranja (1)", com o objetivo que o aluno deu à Saída. */
  textoResposta: (saidaId: string, valor: number, resposta: 0 | 1) => string;
};

/** Painel da direita: o botão Rodar e as contas, uma multiplicação de cada vez. */
export default function PainelContas({ rodada, atual, erros, automatico, rodar, irPara, setAutomatico, textoResposta }: Props) {
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

      <button className="botao principal" onClick={rodar}>
        ▶ {rodada ? "Rodar de novo" : "Rodar"}
      </button>

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
    </aside>
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
