"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { formatar, type NeuronioNode as NeuronioNodeType } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

export default function NeuronioNode({ id, selected }: NodeProps<NeuronioNodeType>) {
  const { vista, chegou } = useLab();
  const agora = vista?.neuronioAgora === id;

  // depois da ativação mostra o valor que passa adiante; antes, a soma das bolinhas que já entraram
  const ativado = vista?.valores.get(id);
  const termo = vista?.termoAgora?.neuronio === id && chegou === vista.contaAgora?.passo ? vista.termoAgora.valor : null;
  const parcial = vista?.parciais.get(id);
  const soma = parcial === undefined && termo === null ? undefined : (parcial ?? 0) + (termo ?? 0);
  const valor = ativado ?? soma;
  const sinal = valor === undefined ? "" : valor > 0 ? "positivo" : valor < 0 ? "negativo" : "zero";

  return (
    <div className={`neuronio ${sinal} ${selected ? "selecionado" : ""} ${agora ? "agora" : ""}`}>
      {/* a chave muda com o número: cada bolinha que entra dá um pulinho no valor */}
      {valor !== undefined && (
        <span key={formatar(valor)} className="neuronio-valor">
          {formatar(valor)}
        </span>
      )}
      {/* pontos de ligação invisíveis: as linhas são criadas automaticamente */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="ponto" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="ponto" />
    </div>
  );
}
