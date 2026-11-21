"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { formatar, type NeuronioNode as NeuronioNodeType } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

export default function NeuronioNode({ id, selected }: NodeProps<NeuronioNodeType>) {
  const { vista, chegou, volta } = useLab();
  // na volta, o neurônio da vez é onde a culpa está; "parado" é o que passou 0 e segurou a culpa (ADR-0025)
  const agora = volta ? volta.neuronioAgora === id : vista?.neuronioAgora === id;
  const parado = volta?.parados.has(id);

  // depois da ativação mostra o valor que passa adiante; antes, a soma das bolinhas que já entraram
  const ativado = vista?.valores.get(id);
  const termo = vista?.termoAgora?.neuronio === id && chegou === vista.contaAgora?.passo ? vista.termoAgora.valor : null;
  const parcial = vista?.parciais.get(id);
  const soma = parcial === undefined && termo === null ? undefined : (parcial ?? 0) + (termo ?? 0);
  const valor = ativado ?? soma;
  const sinal = valor === undefined ? "" : valor > 0 ? "positivo" : valor < 0 ? "negativo" : "zero";

  return (
    <div className={`neuronio ${sinal} ${selected ? "selecionado" : ""} ${agora ? "agora" : ""} ${parado ? "parado" : ""}`}>
      {/* a chave muda com o número: cada bolinha que entra dá um pulinho no valor */}
      {valor !== undefined && (
        <ValorQuePula key={formatar(valor)} texto={formatar(valor)} />
      )}
      {/* pontos de ligação invisíveis: as linhas são criadas automaticamente */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="ponto" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="ponto" />
    </div>
  );
}

/** A bolinha entrou: o número dá um pulinho (timeline do GSAP; parado com "reduzir movimento"). */
function ValorQuePula({ texto }: { texto: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(ref.current, { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "power2.out" });
    return () => {
      tween.kill();
    };
  }, []);
  return (
    <span ref={ref} className="neuronio-valor">
      {texto}
    </span>
  );
}
