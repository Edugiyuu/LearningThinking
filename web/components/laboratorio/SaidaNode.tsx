"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { formatar, type NoDaRede, type SaidaData, type SaidaNode as SaidaNodeType } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

/**
 * Termômetro do Backward pass (ADR-0025): a resposta (ponteiro), o certo (marca verde) e o erro
 * entre os dois (faixa vermelha). No fim, o ponteiro mostra a resposta com os pesos novos.
 */
function Termometro({ erro, depois, rotulo }: { erro: { resposta: number; objetivo: number; erro: number }; depois: number | null; rotulo: string }) {
  const agora = depois ?? erro.resposta;
  const pct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;
  const de = Math.min(agora, erro.objetivo);
  return (
    <div className="termometro" aria-label={`Resposta ${formatar(agora)}, o certo é ${formatar(erro.objetivo)}`}>
      <div className="termometro-barra">
        <span className="termometro-erro" style={{ left: pct(de), width: pct(Math.abs(agora - erro.objetivo)) }} />
        <span className="termometro-certo" style={{ left: pct(erro.objetivo) }} />
        {depois !== null && <span className="termometro-ponteiro antes" style={{ left: pct(erro.resposta) }} />}
        <span className="termometro-ponteiro" style={{ left: pct(agora) }} />
      </div>
      <div className="termometro-escala">
        <span>0</span>
        <span>1</span>
      </div>
      <div className="termometro-texto">
        certo: {rotulo} ({erro.objetivo}) ·{" "}
        {depois === null ? (
          <b className="negativo">erro {formatar(erro.erro)}</b>
        ) : (
          <b className="positivo">
            erro {formatar(erro.erro)} → {formatar(Math.abs(erro.objetivo - depois))}
          </b>
        )}
      </div>
    </div>
  );
}

/** Bloco Saída: mostra o número e a cor da resposta. Selecionado, deixa mudar o objetivo. */
export default function SaidaNode({ id, data, selected }: NodeProps<SaidaNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { vista, erros, volta, rotulos } = useLab();
  const saida = vista?.saidas.get(id);

  const mudar = (campo: keyof SaidaData, valor: string) =>
    setNodes((ns) => ns.map((n) => (n.id === id && n.type === "saida" ? { ...n, data: { ...n.data, [campo]: valor } } : n)));

  const resposta = saida ? saida.resposta : null;
  const cor = resposta === 1 ? data.cor1 : data.cor0;
  const rotulo = resposta === 1 ? data.rotulo1 : data.rotulo0;

  return (
    <div className={`saida ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""}`}>
      <Handle id="entrada" type="target" position={Position.Left} className="porta" style={{ top: 18 }} />
      {/* só liga no Backward pass (ADR-0025) */}
      <Handle id="saida" type="source" position={Position.Right} className="porta" style={{ top: 18 }} />
      <div className="saida-titulo">Saída</div>

      {saida ? (
        <div className="saida-resposta">
          <span className="saida-cor" style={{ background: cor }} />
          <div>
            <div className="saida-numero">{formatar(saida.valor)}</div>
            <div className="saida-rotulo">
              {rotulo} ({resposta})
            </div>
          </div>
        </div>
      ) : (
        <div className="saida-resposta">
          <span className="saida-cor vazia" />
          <div>
            <div className="saida-numero vazio">—</div>
            <div className="saida-rotulo">aguardando</div>
          </div>
        </div>
      )}

      {volta?.erro && <Termometro erro={volta.erro} depois={volta.fim?.respostaDepois ?? null} rotulo={volta.erro.objetivo === 1 ? rotulos.rotulo1 : rotulos.rotulo0} />}

      {selected ? (
        <div className="saida-objetivo nodrag">
          <div className="saida-objetivo-titulo">Objetivo</div>
          {(["0", "1"] as const).map((r) => (
            <label key={r} className="saida-opcao">
              <span>{r}</span>
              <input type="color" value={data[`cor${r}`]} onChange={(e) => mudar(`cor${r}`, e.target.value)} />
              <input value={data[`rotulo${r}`]} onChange={(e) => mudar(`rotulo${r}`, e.target.value)} />
            </label>
          ))}
          <p className="saida-dica">Abaixo de 0,50 a resposta é 0; a partir de 0,50 é 1.</p>
        </div>
      ) : (
        <p className="saida-dica">Clique para mudar o objetivo.</p>
      )}
    </div>
  );
}
