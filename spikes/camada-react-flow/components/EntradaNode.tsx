"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import {
  formatar,
  MAX_NUMEROS,
  valoresDaEntrada,
  type EntradaData,
  type EntradaNode as EntradaNodeType,
  type NoDaRede,
} from "@/lib/rede";
import { useLab } from "./contexto";

/** Bloco Entrada: o aluno escolhe o que entra na rede (uma cor ou números livres). */
export default function EntradaNode({ id, data, selected }: NodeProps<EntradaNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { erros } = useLab();
  const valores = valoresDaEntrada(data);

  const mudar = (d: Partial<EntradaData>) =>
    setNodes((ns) => ns.map((n) => (n.id === id && n.type === "entrada" ? { ...n, data: { ...n.data, ...d } } : n)));
  const mudarNumero = (i: number, campo: "nome" | "valor", valor: string) =>
    mudar({
      numeros: data.numeros.map((x, j) =>
        j === i ? { ...x, [campo]: campo === "valor" ? Number(valor.replace(",", ".")) || 0 : valor } : x,
      ),
    });

  return (
    <div className={`entrada ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""}`}>
      <Handle id="saida" type="source" position={Position.Right} className="porta" style={{ top: 18 }} />
      <div className="bloco-topo">
        <span className="bloco-titulo">Entrada</span>
        <select className="nodrag" value={data.tipo} onChange={(e) => mudar({ tipo: e.target.value as EntradaData["tipo"] })}>
          <option value="cor">Cor</option>
          <option value="numeros">Números</option>
        </select>
      </div>

      {data.tipo === "cor" && (
        <label className="entrada-cor nodrag">
          <input type="color" value={data.cor} onChange={(e) => mudar({ cor: e.target.value })} />
          <span>{data.cor.toUpperCase()}</span>
        </label>
      )}

      {valores.map((v, i) => (
        <div key={i} className="entrada-linha">
          {data.tipo === "cor" ? (
            <>
              <span className="entrada-nome">{v.nome}</span>
              <span className="entrada-valor">{formatar(v.valor)}</span>
            </>
          ) : (
            <>
              <input className="nodrag entrada-campo" value={v.nome} onChange={(e) => mudarNumero(i, "nome", e.target.value)} />
              <input
                className="nodrag entrada-campo valor"
                type="number"
                step="0.1"
                value={v.valor}
                onChange={(e) => mudarNumero(i, "valor", e.target.value)}
              />
              <button
                className="nodrag entrada-remover"
                title="Remover"
                onClick={() => mudar({ numeros: data.numeros.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </>
          )}
          {/* cada número é uma bolinha de onde saem as linhas */}
          <Handle
            id={`v${i}`}
            type="source"
            position={Position.Right}
            isConnectable={false}
            className="valor-ponto"
            style={{ background: `rgba(94, 211, 219, ${0.08 + Math.min(1, Math.max(0, v.valor)) * 0.6})` }}
          />
        </div>
      ))}

      {data.tipo === "numeros" && data.numeros.length < MAX_NUMEROS && (
        <button
          className="nodrag entrada-adicionar"
          onClick={() => mudar({ numeros: [...data.numeros, { nome: `x${data.numeros.length + 1}`, valor: 0 }] })}
        >
          + número
        </button>
      )}
    </div>
  );
}
