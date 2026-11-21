"use client";

import { Handle, Position, useEdges, useReactFlow, type NodeProps } from "@xyflow/react";
import { definirQuantidade, MAX_NEURONIOS, type CamadaNode as CamadaNodeType, type NoDaRede } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

export default function CamadaNode({ id, data, selected }: NodeProps<CamadaNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { erros, avisos } = useLab();
  // a camada ligada à Saída faz a conta da Saída: o canvas diz isso, com o nome que o painel e o Modo Foco usam (ADR-0035, B1)
  const daSaida = useEdges().some((e) => e.source === id && e.target.startsWith("saida"));

  return (
    <div className={`camada ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""} ${avisos.has(id) ? "com-aviso" : ""}`}>
      {/* portas do fio: entra pela esquerda, sai pela direita */}
      <Handle id="entrada" type="target" position={Position.Left} className="porta" style={{ top: 18 }} />
      <Handle id="saida" type="source" position={Position.Right} className="porta" style={{ top: 18 }} />
      <div className="camada-titulo">
        {data.titulo}
        {daSaida && <span className="camada-papel"> · Saída</span>}
      </div>
      <label className="camada-qtd">
        <span>neurônios</span>
        {/* "nodrag" impede que mexer no campo arraste a camada */}
        <input
          className="nodrag"
          type="number"
          min={0}
          max={MAX_NEURONIOS}
          value={data.quantidade}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) setNodes((ns) => definirQuantidade(ns, id, n));
          }}
        />
      </label>
    </div>
  );
}
