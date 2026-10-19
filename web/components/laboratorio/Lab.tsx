"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/components/laboratorio/laboratorio.css";

import CamadaNode from "@/components/laboratorio/CamadaNode";
import EntradaNode from "@/components/laboratorio/EntradaNode";
import NeuronioNode from "@/components/laboratorio/NeuronioNode";
import SaidaNode from "@/components/laboratorio/SaidaNode";
import PesoEdge from "@/components/laboratorio/PesoEdge";
import PainelContas from "@/components/laboratorio/PainelContas";
import { LabContexto } from "@/components/laboratorio/contexto";
import { Aqua } from "@/components/mascote";
import { lerMontagem, salvarMontagem, type Projeto } from "@/lib/projetos";
import {
  camadaNoPonto,
  continuarIds,
  criarCamada,
  criarEntrada,
  criarNeuronio,
  criarSaida,
  definirQuantidade,
  fioPermitido,
  fiosValidos,
  formatar,
  ligarFio,
  linhas,
  montagemBasica,
  montagemVazia,
  prepararRodada,
  reorganizar,
  vistaDaRodada,
  type Erro,
  type Fio,
  type Montagem,
  type NoDaRede,
  type Pesos,
  type Rodada,
} from "@/lib/rede";

const nodeTypes = { camada: CamadaNode, neuronio: NeuronioNode, saida: SaidaNode, entrada: EntradaNode };
const edgeTypes = { peso: PesoEdge };
const TIPO_ARRASTE = "application/x-bloco";
const INTERVALO_AUTOMATICO = 900; // ms entre um passo e outro no modo automático
const ESPERA_SALVAR = 400; // ms sem mexer antes de salvar

/** A montagem salva do projeto ou, se não houver, a que o aluno escolheu em Novo projeto. */
function montagemDoProjeto(projeto: Projeto | null): Montagem {
  const salva = projeto ? lerMontagem(projeto.id) : null;
  if (salva) {
    continuarIds(salva.nodes.map((n) => n.id));
    return salva;
  }
  return projeto?.inicio === "vazio" ? montagemVazia() : montagemBasica();
}

/** A rodada (ou os erros) vale só para a montagem em que o aluno clicou em Rodar. */
type Execucao = { estrutura: string; rodada: Rodada | null; erros: Erro[]; atual: number };
type Salvamento = "salvo" | "salvando" | "nao-salvo";

function Laboratorio({ projeto }: { projeto: Projeto | null }) {
  const [inicial] = useState(() => montagemDoProjeto(projeto));
  const [nodes, setNodes] = useState<NoDaRede[]>(inicial.nodes);
  const [fiosBrutos, setFios] = useState<Fio[]>(inicial.fios);
  const [pesos, setPesos] = useState<Pesos>(inicial.pesos);
  const [editando, setEditando] = useState<string | null>(null);
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [automatico, setAutomatico] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvamento, setSalvamento] = useState<Salvamento>(projeto ? "salvo" : "nao-salvo");
  const treinarRef = useRef<HTMLElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut } = useReactFlow<NoDaRede>();

  // fios de blocos apagados somem sozinhos
  const fios = useMemo(() => fiosValidos(nodes, fiosBrutos), [nodes, fiosBrutos]);

  // salva a montagem no navegador um pouco depois da última mudança
  const primeiraVez = useRef(true);
  useEffect(() => {
    if (!projeto) return;
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    setSalvamento("salvando");
    const t = setTimeout(() => {
      setSalvamento(salvarMontagem(projeto.id, { nodes, fios, pesos }) ? "salvo" : "nao-salvo");
    }, ESPERA_SALVAR);
    return () => clearTimeout(t);
  }, [projeto, nodes, fios, pesos]);

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
      <IconeBloco tipo={tipo} />
      <span>
        <span className="bloco-nome">{rotulo}</span>
        <span className="bloco-descricao">{descricao}</span>
      </span>
    </div>
  );

  return (
    <LabContexto.Provider value={lab}>
      <div className="lab-pagina">
        <header className="lab-topo">
          <div className="lab-topo-esquerda">
            <Link href="/" className="lab-logo" aria-label="LearningThinking, início">
              <Aqua unidade={3} />
              <span>LearningThinking</span>
            </Link>
            <span className="lab-divisor" />
            <span className="lab-projeto">{projeto?.nome ?? "Experimento"}</span>
            <span className="lab-salvo">
              {salvamento === "salvo" ? "Salvo" : salvamento === "salvando" ? "Salvando…" : "Não salvo"}
            </span>
          </div>

          <div className="lab-abas" role="tablist" aria-label="Tema do laboratório">
            <button role="tab" aria-selected className="ativa">
              Redes neurais
            </button>
            <button role="tab" aria-selected={false} disabled>
              Busca por significado <span className="sr-only">(em breve)</span>
            </button>
          </div>

          <div className="lab-topo-direita">
            <button className="botao lab-botao" onClick={() => treinarRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Treinar
            </button>
            <button className="botao principal lab-botao" onClick={rodar}>
              <span aria-hidden>▶</span> {rodada ? "Rodar de novo" : "Rodar"}
            </button>
          </div>
        </header>

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
              fitViewOptions={{ padding: 0.25 }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            </ReactFlow>
            <div className="canvas-zoom">
              <button onClick={() => zoomIn()} aria-label="Aproximar">
                +
              </button>
              <button onClick={() => zoomOut()} aria-label="Afastar">
                −
              </button>
            </div>
            <div className="canvas-legenda">
              <span>
                <i className="legenda-positivo" /> peso positivo
              </span>
              <span>
                <i className="legenda-negativo" /> peso negativo
              </span>
              <span className="legenda-dica">Duplo clique no número muda o peso</span>
            </div>
          </div>

          <PainelContas
            rodada={rodada}
            atual={atual}
            erros={ativa?.erros ?? []}
            automatico={automatico}
            irPara={(p) => setExecucao((e) => (e ? { ...e, atual: p } : e))}
            setAutomatico={setAutomatico}
            textoResposta={textoResposta}
            treinarRef={treinarRef}
          />
        </div>
      </div>
    </LabContexto.Provider>
  );
}

function IconeBloco({ tipo }: { tipo: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="bloco-icone" aria-hidden>
      {tipo === "entrada" && (
        <>
          <rect x="1" y="1" width="22" height="22" rx="6" fill="#FDEBDD" />
          <circle cx="12" cy="12" r="5" fill="#E8853A" />
        </>
      )}
      {tipo === "camada" && (
        <>
          <rect x="4" y="1" width="16" height="22" rx="4" fill="#E8FAFB" stroke="#0E7C86" strokeWidth="1.5" />
          <circle cx="12" cy="8" r="2" fill="#0E7C86" />
          <circle cx="12" cy="16" r="2" fill="#0E7C86" />
        </>
      )}
      {tipo === "neuronio" && <circle cx="12" cy="12" r="8" fill="#E8FAFB" stroke="#5ED3DB" strokeWidth="1.5" />}
      {tipo === "saida" && (
        <>
          <circle cx="12" cy="12" r="9" fill="#fff" stroke="#0E7C86" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" fill="#0E7C86" />
        </>
      )}
    </svg>
  );
}

export default function Lab({ projeto }: { projeto: Projeto | null }) {
  return (
    <ReactFlowProvider>
      <Laboratorio projeto={projeto} />
    </ReactFlowProvider>
  );
}
