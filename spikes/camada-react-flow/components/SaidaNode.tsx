"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { formatar, type NoDaRede, type SaidaData, type SaidaNode as SaidaNodeType } from "@/lib/rede";
import { useLab } from "./contexto";

/** Bloco Saída: mostra o número e a cor da resposta. Selecionado, deixa mudar o objetivo. */
export default function SaidaNode({ id, data, selected }: NodeProps<SaidaNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { vista, erros } = useLab();
  const saida = vista?.saidas.get(id);

  const mudar = (campo: keyof SaidaData, valor: string) =>
    setNodes((ns) => ns.map((n) => (n.id === id && n.type === "saida" ? { ...n, data: { ...n.data, [campo]: valor } } : n)));

  const resposta = saida ? saida.resposta : null;
  const cor = resposta === 1 ? data.cor1 : data.cor0;
  const rotulo = resposta === 1 ? data.rotulo1 : data.rotulo0;

  return (
    <div className={`saida ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""}`}>
      <Handle id="entrada" type="target" position={Position.Left} className="porta" style={{ top: 18 }} />
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
