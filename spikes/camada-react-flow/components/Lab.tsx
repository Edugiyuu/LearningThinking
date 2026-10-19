"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CamadaNode from "./CamadaNode";
import EntradaNode from "./EntradaNode";
import NeuronioNode from "./NeuronioNode";
import SaidaNode from "./SaidaNode";
import PesoEdge from "./PesoEdge";
import PainelContas from "./PainelContas";
import { LabContexto } from "./contexto";
import {
  camadaNoPonto,
  criarCamada,
  criarEntrada,
  criarFio,
  criarNeuronio,
  criarSaida,
  definirQuantidade,
  fioPermitido,
  fiosValidos,
  formatar,
  ligarFio,
  linhas,
  prepararRodada,
  reorganizar,
  vistaDaRodada,
  type Erro,
  type Fio,
  type NoDaRede,
  type Pesos,
  type Rodada,
} from "@/lib/rede";

const nodeTypes = { camada: CamadaNode, neuronio: NeuronioNode, saida: SaidaNode, entrada: EntradaNode };
const edgeTypes = { peso: PesoEdge };
const TIPO_ARRASTE = "application/x-bloco";
const INTERVALO_AUTOMATICO = 900; // ms entre um passo e outro no modo automático

/**
 * Montagem básica pronta: a cor entra, a Camada 1 tem um detector de laranja
 * e um de azul, e a Camada 2 decide. Os pesos já funcionam, para o aluno ver
 * uma resposta certa antes de mexer em qualquer coisa.
 */
function montagemInicial(): { nodes: NoDaRede[]; fios: Fio[]; pesos: Pesos } {
  const entrada = criarEntrada(0, 0);
  const c1 = criarCamada("Camada 1", 280, 20);
  const c2 = criarCamada("Camada 2", 540, 50);
  const saida = criarSaida(780, 40);
  let nodes: NoDaRede[] = [entrada, c1, c2, saida];
  nodes = definirQuantidade(nodes, c1.id, 2);
  nodes = definirQuantidade(nodes, c2.id, 1);

  const [laranja, azul] = nodes.filter((n) => n.parentId === c1.id).map((n) => n.id);
  const [final] = nodes.filter((n) => n.parentId === c2.id).map((n) => n.id);
  const daEntrada = (i: number, neuronio: string) => `${entrada.id}#${i}->${neuronio}`;
  const pesos: Pesos = {
    // R, G, B → detector de laranja
    [daEntrada(0, laranja)]: 2,
    [daEntrada(1, laranja)]: 0.5,
    [daEntrada(2, laranja)]: -2,
    // R, G, B → detector de azul
    [daEntrada(0, azul)]: -1,
    [daEntrada(1, azul)]: 0.5,
    [daEntrada(2, azul)]: 1.5,
    // os dois detectores → resposta (perto de 1 = laranja)
    [`${laranja}->${final}`]: 1.5,
    [`${azul}->${final}`]: -1.5,
  };

  return { nodes, pesos, fios: [criarFio(entrada.id, c1.id), criarFio(c1.id, c2.id), criarFio(c2.id, saida.id)] };
}

/** A rodada (ou os erros) vale só para a montagem em que o aluno clicou em Rodar. */
type Execucao = { estrutura: string; rodada: Rodada | null; erros: Erro[]; atual: number };

function Canvas() {
  const [inicial] = useState(montagemInicial);
  const [nodes, setNodes] = useState<NoDaRede[]>(inicial.nodes);
  const [fiosBrutos, setFios] = useState<Fio[]>(inicial.fios);
  const [pesos, setPesos] = useState<Pesos>(inicial.pesos);
  const [editando, setEditando] = useState<string | null>(null);
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [automatico, setAutomatico] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow<NoDaRede>();

  // fios de blocos apagados somem sozinhos
  const fios = useMemo(() => fiosValidos(nodes, fiosBrutos), [nodes, fiosBrutos]);

  // só o que muda as contas (não a posição nem a seleção); mexer nisso cancela a rodada
  const estrutura = useMemo(
    () =>
      JSON.stringify({
        n: nodes.map((n) => [n.id, n.type, n.parentId, n.type === "saida" ? null : n.data]),
        f: fios.map((f) => [f.source, f.target]),
        pesos,
      }),
    [nodes, fios, pesos],
  );
  const ativa = execucao?.estrutura === estrutura ? execucao : null;
  const rodada = ativa?.rodada ?? null;
  const atual = ativa?.atual ?? 0;
  const vista = useMemo(() => (rodada ? vistaDaRodada(rodada, atual) : null), [rodada, atual]);

  // as linhas não são guardadas: são recalculadas a partir dos blocos, fios e da rodada
  const edges = useMemo<Edge[]>(
    () => [...fios, ...linhas(nodes, fios, pesos, editando, vista)],
    [nodes, fios, pesos, editando, vista],
  );

  // modo automático: avança sozinho até o último passo
  const total = rodada?.passos.length ?? 0;
  useEffect(() => {
    if (!automatico || !rodada || atual >= total - 1) return;
    const t = setTimeout(() => setExecucao((e) => (e ? { ...e, atual: e.atual + 1 } : e)), INTERVALO_AUTOMATICO);
    return () => clearTimeout(t);
  }, [automatico, rodada, atual, total]);

  const rodar = () => {
    const { rodada, erros } = prepararRodada(nodes, fios, pesos);
    setExecucao({ estrutura, rodada, erros, atual: 0 });
  };

  const lab = useMemo(
    () => ({
      vista,
      erros: new Set((ativa?.erros ?? []).flatMap((e) => (e.no && e.tipo !== "aviso" ? [e.no] : []))),
      avisos: new Set((ativa?.erros ?? []).flatMap((e) => (e.no && e.tipo === "aviso" ? [e.no] : []))),
      editarPeso: setEditando,
      salvarPeso: (id: string, valor: number) => {
        setPesos((p) => ({ ...p, [id]: valor }));
        setEditando(null);
      },
    }),
    [vista, ativa],
  );

  const textoResposta = (saidaId: string, valor: number, resposta: 0 | 1) => {
    const saida = nodes.find((n) => n.id === saidaId);
    const rotulo = saida?.type === "saida" ? (resposta === 1 ? saida.data.rotulo1 : saida.data.rotulo0) : "";
    return `${formatar(valor)} → ${rotulo} (${resposta})`;
  };

  const onNodesChange = useCallback((changes: NodeChange<NoDaRede>[]) => {
    setNodes((ns) => {
      const atualizados = applyNodeChanges(changes, ns);
      return changes.some((c) => c.type === "remove") ? reorganizar(atualizados) : atualizados;
    });
  }, []);

  // só os fios mudam por aqui (selecionar, apagar); as linhas de peso são derivadas
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setFios((fs) => applyEdgeChanges(changes, fs)), []);

  const onConnect = useCallback((c: Connection) => setFios((fs) => ligarFio(fs, c)), []);
  const isValidConnection = useCallback((c: Connection | Edge) => fioPermitido(nodes, fios, c), [nodes, fios]);

  // ao soltar um neurônio arrastado dentro da camada, ele volta para a coluna
  const onNodeDragStop = useCallback(() => setNodes((ns) => reorganizar(ns)), []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const tipo = e.dataTransfer.getData(TIPO_ARRASTE);
      const ponto = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setAviso(null);

      if (tipo === "camada") {
        setNodes((ns) => {
          const numero = ns.filter((n) => n.type === "camada").length + 1;
          const camada = criarCamada(`Camada ${numero}`, ponto.x, ponto.y);
          return definirQuantidade([...ns, camada], camada.id, 1);
        });
      }
      if (tipo === "entrada") setNodes((ns) => [...ns, criarEntrada(ponto.x, ponto.y)]);
      if (tipo === "saida") setNodes((ns) => [...ns, criarSaida(ponto.x, ponto.y)]);

      if (tipo === "neuronio") {
        const alvo = camadaNoPonto(nodes, ponto.x, ponto.y);
        if (!alvo) {
          setAviso("Solte o neurônio dentro de uma Camada.");
          return;
        }
        setNodes((ns) => reorganizar([...ns, criarNeuronio(alvo.id, ponto.y - alvo.position.y)]));
      }
    },
    [nodes, screenToFlowPosition],
  );

  const bloco = (tipo: string, rotulo: string, descricao: string) => (
    <div className="bloco" draggable onDragStart={(e) => e.dataTransfer.setData(TIPO_ARRASTE, tipo)}>
      <span className="bloco-nome">{rotulo}</span>
      <span className="bloco-descricao">{descricao}</span>
    </div>
  );

  return (
    <LabContexto.Provider value={lab}>
      <div className="lab">
        <aside className="paleta">
          <h2>Blocos</h2>
          {bloco("entrada", "Entrada", "Cor ou números")}
          {bloco("camada", "Camada", "Agrupa neurônios")}
          {bloco("neuronio", "Neurônio", "Solte numa camada")}
          {bloco("saida", "Saída", "A resposta da rede")}
          {aviso && <p className="aviso">{aviso}</p>}

          <div className="dicas">
            <strong>Como montar</strong>
            <ol>
              <li>Arraste os blocos para o canvas.</li>
              <li>Puxe um fio da bolinha colorida até o próximo bloco.</li>
              <li>Clique em Rodar.</li>
            </ol>
            <p>Duplo clique no número de uma linha muda o peso. Delete apaga o que estiver selecionado.</p>
          </div>
        </aside>

        <div className="canvas" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeDragStop={onNodeDragStop}
            onEdgeDoubleClick={(_, edge) => edge.type === "peso" && setEditando(edge.id)}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        <PainelContas
          rodada={rodada}
          atual={atual}
          erros={ativa?.erros ?? []}
          automatico={automatico}
          rodar={rodar}
          irPara={(p) => setExecucao((e) => (e ? { ...e, atual: p } : e))}
          setAutomatico={setAutomatico}
          textoResposta={textoResposta}
        />
      </div>
    </LabContexto.Provider>
  );
}

export default function Lab() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
