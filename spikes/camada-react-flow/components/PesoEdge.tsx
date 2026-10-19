"use client";

import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type Edge, type EdgeProps } from "@xyflow/react";
import { formatar, limitarPeso, type EstadoLinha } from "@/lib/rede";
import { useLab } from "./contexto";

type PesoData = { peso: number; editando: boolean; posicao: number; estado: EstadoLinha };

/**
 * Linha entre dois neurônios: espessura = força, cor = sinal, e o número do peso.
 * Durante a rodada, a linha da conta atual fica destacada e as que ainda não vieram ficam apagadas.
 */
export default function PesoEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<Edge<PesoData>>) {
  const { editarPeso, salvarPeso } = useLab();
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const peso = data?.peso ?? 0;
  const estado = data?.estado ?? "normal";
  const t = data?.posicao ?? 0.5;
  const x = sourceX + (targetX - sourceX) * t;
  const y = sourceY + (targetY - sourceY) * t;
  const cor = peso >= 0 ? "#378ADD" : "#E8853A";
  const largura = 0.5 + Math.min(Math.abs(peso), 3) * 2;

  return (
    <>
      {estado === "agora" && <path d={path} fill="none" stroke="#5ED3DB" strokeWidth={14} strokeOpacity={0.3} strokeLinecap="round" />}
      <BaseEdge
        path={path}
        interactionWidth={14}
        style={
          estado === "agora"
            ? { stroke: "#5ED3DB", strokeWidth: 4, strokeLinecap: "round" }
            : { stroke: cor, strokeWidth: largura, strokeOpacity: estado === "apagada" ? 0.2 : 0.8 }
        }
      />
      <EdgeLabelRenderer>
        <div
          className={`peso nodrag nopan ${peso >= 0 ? "positivo" : "negativo"} ${estado}`}
          style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
          onDoubleClick={() => editarPeso(id)}
          title="Duplo clique para mudar o peso"
        >
          {data?.editando ? <EditorDePeso inicial={peso} salvar={(v) => salvarPeso(id, v)} cancelar={() => editarPeso(null)} /> : formatar(peso)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function EditorDePeso({ inicial, salvar, cancelar }: { inicial: number; salvar: (v: number) => void; cancelar: () => void }) {
  const [texto, setTexto] = useState(String(inicial));
  const confirmar = () => {
    const v = Number(texto.replace(",", ".").replace("−", "-"));
    if (Number.isNaN(v)) cancelar();
    else salvar(limitarPeso(v));
  };

  return (
    <input
      autoFocus
      className="peso-editor"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === "Enter") confirmar();
        if (e.key === "Escape") cancelar();
      }}
    />
  );
}
