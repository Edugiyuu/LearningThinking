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

import BackwardNode from "@/components/laboratorio/BackwardNode";
import CamadaNode from "@/components/laboratorio/CamadaNode";
import EntradaNode from "@/components/laboratorio/EntradaNode";
import NeuronioNode from "@/components/laboratorio/NeuronioNode";
import SaidaNode from "@/components/laboratorio/SaidaNode";
import PesoEdge from "@/components/laboratorio/PesoEdge";
import PainelContas from "@/components/laboratorio/PainelContas";
import { ResultadoTreino, SecaoTreinar, useTreino } from "@/components/laboratorio/Treinar";
import { LabContexto } from "@/components/laboratorio/contexto";
import { Aqua } from "@/components/mascote";
import { lerMontagem, salvarMontagem, type Projeto } from "@/lib/projetos";
import { EXEMPLOS_PRONTOS, corParaEntradas, lerRede, type Exemplo } from "@/lib/treino";
import { vistaDaVolta, voltarCulpa, type PassoVolta } from "@/lib/backward";
import {
  camadaNoPonto,
  continuarIds,
  criarBackward,
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
  posicionarPesos,
  prepararRodada,
  reorganizar,
  vistaDaRodada,
  type Erro,
  type Fio,
  type Montagem,
  type NoDaRede,
  type Pesos,
  type Rodada,
  type Segmento,
} from "@/lib/rede";

const nodeTypes = { camada: CamadaNode, neuronio: NeuronioNode, saida: SaidaNode, entrada: EntradaNode, backward: BackwardNode };
const edgeTypes = { peso: PesoEdge };
const TIPO_ARRASTE = "application/x-bloco";
const INTERVALO_AUTOMATICO = 2300; // ms entre um passo e outro no modo automático (a bolinha leva 2 s)
const ESPERA_SALVAR = 400; // ms sem mexer antes de salvar
const ROTULOS_PADRAO = { rotulo0: "0", cor0: "#378ADD", rotulo1: "1", cor1: "#E8853A" };

/** A montagem salva do projeto ou, se não houver, a que o aluno escolheu em Novo projeto. */
function montagemDoProjeto(projeto: Projeto | null): Montagem {
  const salva = projeto ? lerMontagem(projeto.id) : null;
  if (salva) {
    continuarIds(salva.nodes.map((n) => n.id));
    return salva;
  }
  return projeto?.inicio === "vazio" ? montagemVazia() : montagemBasica();
}

/**
 * A rodada (ou os erros) vale só para a montagem em que o aluno clicou em Rodar.
 * Com o Backward pass, a volta vem depois da ida (ADR-0025); com Salvar, os pesos entram no fim.
 */
type Execucao = {
  estrutura: string;
  rodada: Rodada | null;
  erros: Erro[];
  atual: number;
  volta: PassoVolta[] | null;
  modo: "mostrar" | "salvar";
  salvou: boolean;
};

/** Só o que muda as contas (não a posição nem a seleção); mexer nisso cancela a rodada. */
function estruturaDe(nodes: NoDaRede[], fios: Fio[], pesos: Pesos) {
  return JSON.stringify({
    n: nodes.map((n) => [n.id, n.type, n.parentId, n.type === "saida" || n.type === "backward" ? null : n.data]),
    f: fios.map((f) => [f.source, f.target]),
    pesos,
  });
}
type Salvamento = "salvo" | "salvando" | "nao-salvo";

function Laboratorio({ projeto }: { projeto: Projeto | null }) {
  const [inicial] = useState(() => montagemDoProjeto(projeto));
  const [nodes, setNodes] = useState<NoDaRede[]>(inicial.nodes);
  const [fiosBrutos, setFios] = useState<Fio[]>(inicial.fios);
  const [pesos, setPesos] = useState<Pesos>(inicial.pesos);
  const [exemplos, setExemplos] = useState<Exemplo[]>(inicial.exemplos ?? EXEMPLOS_PRONTOS);
  const [editando, setEditando] = useState<string | null>(null);
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [automatico, setAutomatico] = useState(false);
  const [chegou, setChegou] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvamento, setSalvamento] = useState<Salvamento>(projeto ? "salvo" : "nao-salvo");
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
      setSalvamento(salvarMontagem(projeto.id, { nodes, fios, pesos, exemplos }) ? "salvo" : "nao-salvo");
    }, ESPERA_SALVAR);
    return () => clearTimeout(t);
  }, [projeto, nodes, fios, pesos, exemplos]);

  // Treinar (ADR-0024): a rede aprende com os exemplos; no fim, os pesos novos entram no projeto
  const aplicarPesos = useCallback((novos: Pesos) => setPesos((atuais) => ({ ...atuais, ...novos })), []);
  const treino = useTreino({
    exemplos,
    aplicar: aplicarPesos,
    ler: () => {
      // treinar é o backward repetido sobre os Dados: sem o bloco ligado na Saída, não há treino (ADR-0025)
      const bloco = nodes.find((n) => n.type === "backward");
      if (!bloco || !fios.some((f) => f.target === bloco.id)) return "Para treinar, ligue o Backward pass na Saída.";
      const entrada = nodes.find((n) => n.type === "entrada");
      if (entrada?.type === "entrada" && entrada.data.tipo !== "cor") return "Por enquanto o treino usa a Entrada de cor. Troque a Entrada para Cor.";
      return lerRede(nodes, fios, pesos) ?? "A montagem tem um problema. Clique em Rodar para ver o que falta.";
    },
  });

  const estrutura = useMemo(() => estruturaDe(nodes, fios, pesos), [nodes, fios, pesos]);
  const ativa = execucao?.estrutura === estrutura ? execucao : null;
  const rodada = ativa?.rodada ?? null;
  const atual = ativa?.atual ?? 0;
  // a volta vem depois de todos os passos da ida: na volta, a ida fica parada no último passo
  const passosDaIda = rodada?.passos.length ?? 0;
  const voltaPassos = ativa?.volta ?? null;
  const vista = useMemo(() => (rodada ? vistaDaRodada(rodada, Math.min(atual, passosDaIda - 1)) : null), [rodada, atual, passosDaIda]);
  const volta = useMemo(
    () => (voltaPassos && atual >= passosDaIda ? vistaDaVolta(voltaPassos, atual - passosDaIda) : null),
    [voltaPassos, atual, passosDaIda],
  );

  // as linhas não são guardadas: são recalculadas a partir dos blocos, fios e da rodada.
  // Durante o treino, elas mostram os pesos da repetição que está passando.
  const pesosNaTela = useMemo(() => (treino.pesosAoVivo ? { ...pesos, ...treino.pesosAoVivo } : pesos), [pesos, treino.pesosAoVivo]);
  const edges = useMemo<Edge[]>(
    () => [...fios, ...linhas(nodes, fios, pesosNaTela, editando, vista)],
    [nodes, fios, pesosNaTela, editando, vista],
  );

  // mexer em blocos ou fios no meio do treino cancela o treino
  const formato = useMemo(() => JSON.stringify([nodes.map((n) => [n.id, n.parentId]), fios.map((f) => [f.source, f.target])]), [nodes, fios]);
  const formatoDoTreino = useRef(formato);
  const { emAndamento, parar } = treino;
  useEffect(() => {
    if (!emAndamento) formatoDoTreino.current = formato;
    else if (formato !== formatoDoTreino.current) parar();
  }, [formato, emAndamento, parar]);

  const total = passosDaIda + (voltaPassos?.length ?? 0);

  const rodar = () => {
    const { rodada, erros } = prepararRodada(nodes, fios, pesos);
    setChegou(null);
    setExecucao({ estrutura, rodada, erros, atual: 0, ...(rodada ? prepararVolta() : { volta: null, modo: "mostrar" }), salvou: false });
  };

  /**
   * Backward pass (ADR-0025): a volta só acontece com o bloco ligado na Saída, a Entrada de cor
   * e a resposta certa da cor nos Dados. Sem isso, o Rodar faz só a ida.
   */
  const prepararVolta = (): Pick<Execucao, "volta" | "modo"> => {
    const bloco = nodes.find((n) => n.type === "backward");
    const ligado = bloco && fios.some((f) => f.target === bloco.id && nodes.find((n) => n.id === f.source)?.type === "saida");
    const cor = entrada?.tipo === "cor" ? entrada.cor.toUpperCase() : null;
    const certa = cor ? exemplos.find((d) => d.cor.toUpperCase() === cor) : undefined;
    const lida = lerRede(nodes, fios, pesos);
    if (!bloco || bloco.type !== "backward" || !ligado || !cor || !certa || !lida) return { volta: null, modo: "mostrar" };
    return {
      volta: voltarCulpa({ rede: lida.rede, pesos: lida.pesos, entradas: corParaEntradas(cor), objetivo: certa.objetivo }),
      modo: bloco.data.modo,
    };
  };

  // voltar um passo não repete a viagem: a parcela daquele passo já aparece dentro do neurônio.
  // Com Salvar, chegar no fim da volta grava os pesos novos (uma vez só) e a rodada continua aberta.
  const irPara = (p: number) => {
    if (p < atual) setChegou(p);
    const fim = voltaPassos?.at(-1);
    if (ativa && fim?.tipo === "fim" && ativa.modo === "salvar" && !ativa.salvou && p === total - 1) {
      const novos = { ...pesos, ...fim.pesos };
      setPesos(novos);
      setExecucao({ ...ativa, atual: p, salvou: true, estrutura: estruturaDe(nodes, fios, novos) });
      return;
    }
    setExecucao((e) => (e ? { ...e, atual: p } : e));
  };

  // modo automático: avança sozinho até o último passo
  const irParaRef = useRef(irPara);
  useEffect(() => {
    irParaRef.current = irPara;
  });
  useEffect(() => {
    if (!automatico || !rodada || atual >= total - 1) return;
    const t = setTimeout(() => irParaRef.current(atual + 1), INTERVALO_AUTOMATICO);
    return () => clearTimeout(t);
  }, [automatico, rodada, atual, total]);

  // onde fica o número de cada peso: as linhas contam as pontas, e o laboratório
  // escolhe um ponto de cada uma sem encostar em outro número nem ficar embaixo de um bloco
  const pendentes = useRef(new Map<string, Segmento>());
  const quadro = useRef(0);
  const [pontas, setPontas] = useState<Map<string, Segmento>>(() => new Map());
  const informarLinha = useCallback((id: string, s: Omit<Segmento, "id">) => {
    pendentes.current.set(id, { id, ...s });
    // várias linhas mexem juntas (arrastar um bloco): junta tudo num quadro só
    cancelAnimationFrame(quadro.current);
    quadro.current = requestAnimationFrame(() => setPontas(new Map(pendentes.current)));
  }, []);
  const posicaoDoPeso = useMemo(() => {
    const ids = new Set(edges.filter((e) => e.type === "peso").map((e) => e.id));
    const segmentos = [...pontas.values()].filter((s) => ids.has(s.id));
    const caixas = nodes
      .filter((n) => !n.parentId && n.measured?.width && n.measured?.height)
      .map((n) => ({ x: n.position.x, y: n.position.y, w: n.measured!.width!, h: n.measured!.height! }));
    return posicionarPesos(segmentos, caixas, vista?.linhaAgora ?? null);
  }, [pontas, edges, nodes, vista?.linhaAgora]);

  const saidaDaMontagem = nodes.find((n) => n.type === "saida");
  const rotulos = saidaDaMontagem?.type === "saida" ? saidaDaMontagem.data : ROTULOS_PADRAO;
  const entradaDaMontagem = nodes.find((n) => n.type === "entrada");
  const entrada = entradaDaMontagem?.type === "entrada" ? entradaDaMontagem.data : null;

  const lab = useMemo(
    () => ({
      entrada,
      dados: exemplos,
      setDados: setExemplos,
      rotulos,
      volta,
      modoVolta: ativa?.modo ?? "mostrar",
      treino,
      vista,
      erros: new Set((ativa?.erros ?? []).flatMap((e) => (e.no && e.tipo !== "aviso" ? [e.no] : []))),
      avisos: new Set((ativa?.erros ?? []).flatMap((e) => (e.no && e.tipo === "aviso" ? [e.no] : []))),
      editarPeso: setEditando,
      salvarPeso: (id: string, valor: number) => {
        setPesos((p) => ({ ...p, [id]: valor }));
        setEditando(null);
      },
      chegou,
      bolinhaChegou: setChegou,
      informarLinha,
      posicaoDoPeso,
    }),
    [entrada, exemplos, rotulos, volta, treino, vista, ativa, chegou, informarLinha, posicaoDoPeso],
  );

  const rodarAgora = () => {
    treino.reiniciar();
    rodar();
  };

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
      if (tipo === "backward") {
        if (nodes.some((n) => n.type === "backward")) {
          setAviso("Use só um bloco Backward pass por montagem.");
          return;
        }
        setNodes((ns) => [...ns, criarBackward(ponto.x, ponto.y)]);
      }

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
              <Aqua unidade={4} />
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
            <button className="botao principal lab-botao" onClick={rodar} disabled={treino.emAndamento}>
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
            {bloco("backward", "Backward pass", "Liga na Saída · a culpa volta")}
            {aviso && <p className="aviso">{aviso}</p>}
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
              {volta ? (
                <>
                  <span>
                    <i className="legenda-culpa" /> culpa voltando
                  </span>
                  <span className="legenda-sinais">
                    <b className="sinal mais">+</b> mais forte <b className="sinal menos">−</b> mais fraca <b className="sinal igual">=</b> igual
                  </span>
                </>
              ) : (
                <span className="legenda-dica">Duplo clique no número muda o peso</span>
              )}
            </div>
            <ResultadoTreino treino={treino} rotulos={rotulos} rodarAgora={rodarAgora} />
          </div>

          <PainelContas
            rodada={rodada}
            volta={voltaPassos}
            modoVolta={ativa?.modo ?? "mostrar"}
            atual={atual}
            erros={ativa?.erros ?? []}
            automatico={automatico}
            irPara={irPara}
            setAutomatico={setAutomatico}
            textoResposta={textoResposta}
            soTreinar={treino.fase !== "pronto"}
            treinar={<SecaoTreinar treino={treino} exemplos={exemplos} rodarAgora={rodarAgora} />}
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
      {tipo === "backward" && (
        <>
          <circle cx="12" cy="12" r="10" fill="#0E7C86" />
          <path d="M15 7.5 L8.5 12 L15 16.5 Z" fill="#fff" />
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
