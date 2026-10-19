"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { definirQuantidade, MAX_NEURONIOS, type CamadaNode as CamadaNodeType, type NoDaRede } from "@/lib/rede";
import { useLab } from "./contexto";

export default function CamadaNode({ id, data, selected }: NodeProps<CamadaNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { erros, avisos } = useLab();

  return (
    <div className={`camada ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""} ${avisos.has(id) ? "com-aviso" : ""}`}>
      {/* portas do fio: entra pela esquerda, sai pela direita */}
      <Handle id="entrada" type="target" position={Position.Left} className="porta" style={{ top: 18 }} />
      <Handle id="saida" type="source" position={Position.Right} className="porta" style={{ top: 18 }} />
      <div className="camada-titulo">{data.titulo}</div>
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
