"use client";

import { useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { BackwardData, BackwardNode as BackwardNodeType, NoDaRede } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

/**
 * Bloco Backward pass (ADR-0025): liga na Saída e guarda a resposta certa (o gabarito) da
 * cor que está na Entrada. A resposta certa vem dos Dados do Treinar; uma cor nova pode ser
 * adicionada aos Dados aqui mesmo. Frame "Laboratório · Backward pass · 3 bloco com a resposta certa".
 */
export default function BackwardNode({ id, data, selected }: NodeProps<BackwardNodeType>) {
  const { setNodes } = useReactFlow<NoDaRede>();
  const { entrada, dados, setDados, rotulos, erros } = useLab();
  // a escolha de uma cor nova vale só para aquela cor: trocou a cor, começa sem escolha
  const [escolha, setEscolha] = useState<{ cor: string; objetivo: 0 | 1 } | null>(null);

  const mudarModo = (modo: BackwardData["modo"]) =>
    setNodes((ns) => ns.map((n) => (n.id === id && n.type === "backward" ? { ...n, data: { ...n.data, modo } } : n)));

  const cor = entrada?.tipo === "cor" ? entrada.cor.toUpperCase() : null;
  const i = cor ? dados.findIndex((d) => d.cor.toUpperCase() === cor) : -1;
  const marcada = i >= 0 ? dados[i].objetivo : null;
  const escolhida = escolha && escolha.cor === cor ? escolha.objetivo : null;
  const pronto = marcada !== null;

  const opcoes = (atual: 0 | 1 | null, escolher: (o: 0 | 1) => void) => (
    <div className="backward-opcoes">
      {([0, 1] as const).map((o) => (
        <button key={o} className={atual === o ? "ativa" : ""} aria-pressed={atual === o} onClick={() => escolher(o)}>
          <i style={{ background: o === 1 ? rotulos.cor1 : rotulos.cor0 }} />
          {o === 1 ? rotulos.rotulo1 : rotulos.rotulo0} · {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`backward ${selected ? "selecionada" : ""} ${erros.has(id) ? "com-erro" : ""}`}>
      <Handle id="entrada" type="target" position={Position.Left} className="porta" style={{ top: 18 }} />
      <div className="backward-titulo">
        <span className="backward-icone" aria-hidden>
          ◀
        </span>
        Backward pass
      </div>

      <div className="nodrag">
        {!cor ? (
          <p className="backward-nota">Por enquanto o Backward pass usa a Entrada de cor.</p>
        ) : pronto ? (
          <>
            <div className="backward-rotulo">Resposta certa para esta cor</div>
            {/* trocar aqui troca nos Dados também: é uma lista só */}
            {opcoes(marcada, (o) => setDados(dados.map((d, j) => (j === i ? { ...d, objetivo: o } : d))))}
            <div className="backward-origem">✓ veio dos Dados</div>
          </>
        ) : (
          <>
            <div className="backward-nova">
              <b>
                <i style={{ background: cor }} /> Cor nova
              </b>
              Ela ainda não está nos Dados.
            </div>
            <div className="backward-rotulo">O que ela é?</div>
            {opcoes(escolhida, (o) => setEscolha({ cor, objetivo: o }))}
            <button
              className="botao escuro backward-adicionar"
              disabled={escolhida === null}
              onClick={() => escolhida !== null && setDados([...dados, { cor, objetivo: escolhida }])}
            >
              + adicionar aos Dados
            </button>
            <p className="backward-nota">Até lá, o Rodar faz só a ida.</p>
          </>
        )}

        <div className={`alternar backward-modo ${pronto ? "" : "apagado"}`}>
          <button className={data.modo === "mostrar" ? "ativo" : ""} disabled={!pronto} onClick={() => mudarModo("mostrar")}>
            Mostrar
          </button>
          <button className={data.modo === "salvar" ? "ativo" : ""} disabled={!pronto} onClick={() => mudarModo("salvar")}>
            Salvar
          </button>
        </div>
        {pronto && (
          <p className="backward-nota">
            {data.modo === "mostrar" ? "Mostrar: só vê a culpa. Os pesos não mudam." : "Salvar: no fim, cada peso anda um passinho de verdade."}
          </p>
        )}
      </div>
    </div>
  );
}
