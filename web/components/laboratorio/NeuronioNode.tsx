"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { formatar, type NeuronioNode as NeuronioNodeType } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

export default function NeuronioNode({ id, selected }: NodeProps<NeuronioNodeType>) {
  const { vista } = useLab();
  const valor = vista?.valores.get(id);
  const agora = vista?.neuronioAgora === id;
  // preenchimento = ativação: quanto maior o valor, mais "aceso"
  const brilho = valor === undefined ? 0 : Math.min(1, valor);

  return (
    <div
      className={`neuronio ${selected ? "selecionado" : ""} ${agora ? "agora" : ""}`}
      style={{ background: `rgba(94, 211, 219, ${0.06 + brilho * 0.55})` }}
    >
      {valor !== undefined ? <span className="neuronio-valor">{formatar(valor)}</span> : agora && <span className="neuronio-valor">…</span>}
      {/* pontos de ligação invisíveis: as linhas são criadas automaticamente */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="ponto" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="ponto" />
    </div>
  );
}
