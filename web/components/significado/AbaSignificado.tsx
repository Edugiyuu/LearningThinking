"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import gsap from "gsap";
import LadoRecolhivel from "@/components/laboratorio/LadoRecolhivel";
import { AquaAnimada } from "@/components/aqua-animada";
import { cosseno, encaixarNoMapa, pca2d, type Ponto } from "@/lib/significado";
import type { ResultadoTexto } from "@/lib/significado-modelo";
import { useModelo, type EstadoModelo } from "./useModelo";
import "./significado.css";

// Aba Busca por significado (ADR-0037). Telas no Figma, página "Busca por significado (ADR-0037)".

type Tipo = "palavra" | "categoria";
type Item = { texto: string; tipo: Tipo; visivel: boolean };
type Selecao = { tipo: Tipo; texto: string } | null;
type Rodada = { passo: 1 | 2 | 3; camadas: boolean };

const LARGURA = 1000;
const ALTURA = 640;
const MARGEM = 80;

const chave = (projetoId: string) => `lt-significado-${projetoId}`;

function lerItens(projetoId: string): Item[] {
  try {
    const salvo = localStorage.getItem(chave(projetoId));
    return salvo ? (JSON.parse(salvo) as Item[]) : [];
  } catch {
    return [];
  }
}

const virgula = (n: number) => n.toFixed(2).replace(".", ",").replace("-", "−");
const mb = (bytes: number) => Math.round(bytes / 1e6);

export default function AbaSignificado({ projetoId, rodarRef }: { projetoId: string; rodarRef: RefObject<(() => void) | null> }) {
  const { modelo, calcular, tentarDeNovo } = useModelo();
  const [itens, setItens] = useState<Item[]>(() => lerItens(projetoId));
  const [resultados, setResultados] = useState<Record<string, ResultadoTexto>>({});
  const [selecao, setSelecao] = useState<Selecao>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [aviso, setAviso] = useState<"baixando" | "vazio" | null>(null);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(chave(projetoId), JSON.stringify(itens));
    } catch {
      // sem espaço ou sem permissão: a aba continua funcionando, só não guarda
    }
  }, [itens, projetoId]);

  // o mapa: PCA de todos os textos que já têm embedding, até os escondidos (esconder não mexe em ninguém)
  const posicoes = useMemo(() => {
    const comNumeros = itens.filter((i) => resultados[i.texto]);
    const pontos = encaixarNoMapa(
      pca2d(comNumeros.map((i) => resultados[i.texto].embedding)),
      LARGURA,
      ALTURA,
      MARGEM,
    );
    const pos: Record<string, Ponto> = {};
    comNumeros.forEach((i, k) => (pos[i.texto] = pontos[k]));
    return pos;
  }, [itens, resultados]);

  const palavras = itens.filter((i) => i.tipo === "palavra");
  const categorias = itens.filter((i) => i.tipo === "categoria");

  const rodar = useCallback(async () => {
    if (calculando) return;
    if (modelo.estado !== "pronto") {
      setAviso("baixando");
      return;
    }
    if (!itens.some((i) => i.tipo === "palavra") || !itens.some((i) => i.tipo === "categoria")) {
      setAviso("vazio");
      return;
    }
    setAviso(null);
    setCalculando(true);
    const res = await calcular(itens.map((i) => i.texto));
    const novos: Record<string, ResultadoTexto> = {};
    for (const r of res) novos[r.texto] = r;
    setResultados(novos);
    setSelecao(null);
    setRodada({ passo: 1, camadas: false });
    setCalculando(false);
  }, [calculando, calcular, itens, modelo.estado]);

  // o botão Rodar fica na barra de cima do lab: ele chama esta função pela ref
  useEffect(() => {
    rodarRef.current = () => void rodar();
    return () => {
      rodarRef.current = null;
    };
  }, [rodarRef, rodar]);

  function adicionar(tipo: Tipo, texto: string) {
    const limpo = texto.trim();
    if (!limpo || itens.some((i) => i.texto.toLowerCase() === limpo.toLowerCase())) return;
    setItens((atual) => [...atual, { texto: limpo, tipo, visivel: true }]);
    setAviso(null);
  }

  function alternar(texto: string) {
    setItens((atual) => atual.map((i) => (i.texto === texto ? { ...i, visivel: !i.visivel } : i)));
    if (selecao?.texto === texto) setSelecao(null);
  }

  function apagar(texto: string) {
    // apagar muda o cálculo: o PCA é refeito sem ele (esconder, não)
    setItens((atual) => atual.filter((i) => i.texto !== texto));
    if (selecao?.texto === texto) setSelecao(null);
  }

  // quem o Rodar mostra nos passos 2: a palavra selecionada ou a primeira
  const emFoco = useMemo(() => {
    const escolhida = selecao?.tipo === "palavra" ? selecao.texto : palavras.find((p) => p.visivel)?.texto;
    return escolhida ? resultados[escolhida] ?? null : null;
  }, [selecao, palavras, resultados]);

  const fecharRodada = () => setRodada(null);

  return (
    <div className="lab sig">
      <LadoRecolhivel lado="esquerda" nome="Palavras">
        <aside className="sig-lista">
          <Lista
            titulo="Palavras"
            placeholder="Escreva uma palavra em inglês…"
            itens={palavras}
            tipo="palavra"
            selecao={selecao}
            semNumeros={(t) => !resultados[t]}
            onAdicionar={(t) => adicionar("palavra", t)}
            onAlternar={alternar}
            onApagar={apagar}
          />
          <Lista
            titulo="Categorias"
            placeholder="Escreva uma categoria…"
            itens={categorias}
            tipo="categoria"
            selecao={selecao}
            semNumeros={(t) => !resultados[t]}
            onAdicionar={(t) => adicionar("categoria", t)}
            onAlternar={alternar}
            onApagar={apagar}
          />
          <p className="sig-dica">
            Desmarque para esconder do mapa.
            <br />
            Os outros pontos não saem do lugar.
          </p>
        </aside>
      </LadoRecolhivel>

      <div className="canvas sig-canvas">
        {rodada?.passo === 1 ? (
          <PassoTokens itens={itens.filter((i) => resultados[i.texto])} resultados={resultados} />
        ) : rodada?.passo === 2 ? (
          <PassoEntradaSaida
            emFoco={emFoco}
            camadas={rodada.camadas}
            onCamadas={() => setRodada({ ...rodada, camadas: !rodada.camadas })}
          />
        ) : (
          <Mapa
            itens={itens}
            posicoes={posicoes}
            resultados={resultados}
            selecao={selecao}
            onSelecionar={(s) => !rodada && setSelecao(s)}
            posicionando={rodada?.passo === 3}
            modelo={modelo}
            aviso={aviso}
            tentarDeNovo={tentarDeNovo}
          />
        )}
      </div>

      <LadoRecolhivel lado="direita" nome="Barras">
        <aside className="painel sig-painel">
          {rodada ? (
            <PainelRodar rodada={rodada} setRodada={setRodada} onTerminar={fecharRodada} />
          ) : selecao ? (
            <Barras itens={itens} selecao={selecao} resultados={resultados} />
          ) : (
            <p className="sig-vazio">
              {aviso === "vazio"
                ? "Escreva pelo menos uma palavra e uma categoria, e aperte Rodar."
                : calculando
                  ? "A Aqua está calculando…"
                  : Object.keys(resultados).length
                    ? "Clique num ponto do mapa para ver as barras."
                    : "Depois do Rodar, clique num ponto do mapa para ver as barras."}
            </p>
          )}
        </aside>
      </LadoRecolhivel>
    </div>
  );
}

/* ---------------- Lista de palavras ou categorias (esquerda) ---------------- */

function Lista({
  titulo,
  placeholder,
  itens,
  tipo,
  selecao,
  semNumeros,
  onAdicionar,
  onAlternar,
  onApagar,
}: {
  titulo: string;
  placeholder: string;
  itens: Item[];
  tipo: Tipo;
  selecao: Selecao;
  semNumeros: (texto: string) => boolean;
  onAdicionar: (texto: string) => void;
  onAlternar: (texto: string) => void;
  onApagar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  function enviar(e: FormEvent) {
    e.preventDefault();
    onAdicionar(texto);
    setTexto("");
  }
  return (
    <section className="sig-secao">
      <h2>{titulo}</h2>
      <form onSubmit={enviar}>
        <input
          className="sig-caixa"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={titulo}
          lang="en"
        />
      </form>
      <ul>
        {itens.map((i) => (
          <li key={i.texto} className={selecao?.texto === i.texto ? "selecionada" : undefined}>
            <label>
              <input type="checkbox" checked={i.visivel} onChange={() => onAlternar(i.texto)} />
              <span className={i.visivel ? undefined : "escondida"}>{i.texto}</span>
            </label>
            {semNumeros(i.texto) && i.visivel && <span className="sig-novo" title="Aperte Rodar para pôr no mapa">novo</span>}
            <i className={tipo === "palavra" ? "marca-palavra" : "marca-categoria"} aria-hidden />
            <button className="sig-apagar" onClick={() => onApagar(i.texto)} aria-label={`Apagar ${i.texto}`} title="Apagar">
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Mapa (telas 1, 4, 5 e o download 6 a 8) ---------------- */

function Mapa({
  itens,
  posicoes,
  resultados,
  selecao,
  onSelecionar,
  posicionando,
  modelo,
  aviso,
  tentarDeNovo,
}: {
  itens: Item[];
  posicoes: Record<string, Ponto>;
  resultados: Record<string, ResultadoTexto>;
  selecao: Selecao;
  onSelecionar: (s: Selecao) => void;
  posicionando: boolean;
  modelo: EstadoModelo;
  aviso: "baixando" | "vazio" | null;
  tentarDeNovo: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const noMapa = itens.filter((i) => posicoes[i.texto] && i.visivel);
  const temMapa = Object.keys(posicoes).length > 0;

  // passo 3 do Rodar: a Aqua coloca um ponto por vez, saindo do meio do mapa (GSAP)
  useLayoutEffect(() => {
    if (!posicionando || !svg.current) return;
    // gsap.context: ao sair (ou no efeito duplo do modo de desenvolvimento), revert() devolve os pontos ao lugar
    const ctx = gsap.context(() => {
      const pontos = svg.current!.querySelectorAll<SVGGElement>(".sig-ponto");
      const tl = gsap.timeline();
      pontos.forEach((g, k) => {
        const dx = LARGURA / 2 - Number(g.dataset.x);
        const dy = ALTURA / 2 - Number(g.dataset.y);
        tl.fromTo(g, { x: dx, y: dy, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, k * 0.35);
      });
    }, svg);
    return () => ctx.revert();
  }, [posicionando]);

  const ligacoes = useMemo(() => {
    if (!selecao || !resultados[selecao.texto]) return [];
    const outros = itens.filter((i) => i.tipo !== selecao.tipo && i.visivel && resultados[i.texto] && posicoes[i.texto]);
    return outros.map((o) => ({ de: posicoes[selecao.texto], para: posicoes[o.texto], nota: cosseno(resultados[selecao.texto].embedding, resultados[o.texto].embedding) }));
  }, [selecao, itens, resultados, posicoes]);

  return (
    <div className="sig-mapa">
      <p className="sig-titulo">
        {posicionando
          ? "Passo 3 · A Aqua coloca cada texto no mapa (PCA: 384 números viram 2)"
          : temMapa
            ? "Mapa · os 384 números de cada texto viram 2 (PCA)"
            : "Mapa · os pontos aparecem quando você aperta Rodar"}
      </p>
      <svg ref={svg} viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="sig-svg" role="img" aria-label="Mapa das palavras e categorias">
        {ligacoes.map((l, k) => (
          <g key={k}>
            <line x1={l.de.x} y1={l.de.y} x2={l.para.x} y2={l.para.y} stroke="#5ED3DB" strokeWidth={Math.max(1, l.nota * 12)} strokeLinecap="round" />
            <text x={(l.de.x + l.para.x) / 2 + 6} y={(l.de.y + l.para.y) / 2 - 6} className="sig-nota-linha">
              {virgula(l.nota)}
            </text>
          </g>
        ))}
        {noMapa.map((i) => {
          const p = posicoes[i.texto];
          const ativo = selecao?.texto === i.texto;
          return (
            <g
              key={i.texto}
              className="sig-ponto"
              data-x={p.x}
              data-y={p.y}
              onClick={() => onSelecionar(ativo ? null : { tipo: i.tipo, texto: i.texto })}
              role="button"
              aria-label={`${i.tipo === "palavra" ? "Palavra" : "Categoria"} ${i.texto}`}
            >
              {ativo && <circle cx={p.x} cy={p.y} r={17} fill="#E8FAFB" stroke="#5ED3DB" strokeWidth={2} />}
              {i.tipo === "palavra" ? (
                <circle cx={p.x} cy={p.y} r={9} fill="#5ED3DB" />
              ) : (
                <rect x={p.x - 10} y={p.y - 10} width={20} height={20} rx={2} fill="#06363A" />
              )}
              <text x={p.x + 18} y={p.y + 5} className={i.tipo === "palavra" ? "sig-rotulo" : "sig-rotulo categoria"} fontWeight={ativo ? 700 : undefined}>
                {i.texto}
              </text>
            </g>
          );
        })}
      </svg>

      {modelo.estado !== "pronto" && <CartaoDownload modelo={modelo} rodouAntes={aviso === "baixando"} tentarDeNovo={tentarDeNovo} />}

      {posicionando && (
        <div className="sig-aqua-canto" aria-hidden>
          <AquaAnimada momento="pensando" unidade={7} />
        </div>
      )}

      {temMapa && (
        <div className="canvas-legenda sig-legenda">
          <span>
            <i className="marca-palavra" /> palavra
          </span>
          <span>
            <i className="marca-categoria" /> categoria
          </span>
          <span className="legenda-dica">
            {posicionando
              ? "A posição é aproximada. No fim, clique num ponto para ver as ligações e as barras."
              : "Linha mais grossa = mais parecido. A posição é aproximada; a medida de verdade são as barras."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Download do modelo (telas 6, 7 e 8) ---------------- */

function CartaoDownload({ modelo, rodouAntes, tentarDeNovo }: { modelo: EstadoModelo; rodouAntes: boolean; tentarDeNovo: () => void }) {
  if (modelo.estado === "pronto") return null;
  const caiu = modelo.estado === "erro";
  const { carregado, total } = modelo;
  const fracao = total ? Math.min(1, carregado / total) : 0;
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <div className={`sig-download${caiu || rodouAntes ? " com-erro" : ""}`} role="status">
      <AquaAnimada momento="pensando" unidade={8} />
      <h3>{caiu ? (offline ? "A internet caiu" : "O download parou") : "Baixando o modelo"}</h3>
      <p>
        {caiu
          ? "O download do modelo parou no meio. O que você escreveu ao lado continua aqui."
          : "A Aqua é o modelo de embeddings (all-MiniLM-L6-v2). Ele baixa só na primeira vez; depois o navegador guarda (cache)."}
      </p>
      <div className="sig-trilho">
        <div className={`sig-barra${caiu ? " erro" : ""}`} style={{ width: `${fracao * 100}%` }} />
      </div>
      <b className={caiu ? "sig-mb erro" : "sig-mb"}>
        {total ? `${caiu ? "Parou em " : ""}${mb(carregado)} de ${mb(total)} MB` : "Começando…"}
      </b>
      {caiu ? (
        <button className="botao principal sig-tentar" onClick={tentarDeNovo}>
          ↻ Tentar de novo
        </button>
      ) : (
        rodouAntes && <p className="sig-erro">Ainda baixando. O Rodar precisa do modelo inteiro: aperte de novo quando terminar.</p>
      )}
      <p className="sig-dica-download">Enquanto isso, escreva palavras e categorias ao lado. Só em inglês: o modelo foi treinado em inglês.</p>
    </div>
  );
}

/* ---------------- Passo 1 do Rodar: tokens (tela 2) ---------------- */

function PassoTokens({ itens, resultados }: { itens: Item[]; resultados: Record<string, ResultadoTexto> }) {
  return (
    <div className="sig-passo">
      <p className="sig-titulo">Passo 1 · A Aqua corta cada texto em tokens</p>
      <div className="sig-tokens-area">
        <AquaAnimada momento="pensando" unidade={9} />
        <ul className="sig-tokens">
          {itens.map((i) => (
            <li key={i.texto}>
              {resultados[i.texto].tokens.map((t, k) => (
                <span key={k} className={t === "[CLS]" || t === "[SEP]" ? "ficha especial" : "ficha"}>
                  {t}
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Passo 2 do Rodar: Entrada → Aqua → Saída (telas 3 e 3b) ---------------- */

function PassoEntradaSaida({ emFoco, camadas, onCamadas }: { emFoco: ResultadoTexto | null; camadas: boolean; onCamadas: () => void }) {
  if (!emFoco) return <p className="sig-titulo">Escreva uma palavra para ver o que entra e o que sai da Aqua.</p>;
  // as barrinhas da saída são números de verdade: os primeiros 24 dos 384
  const amostra = emFoco.embedding.slice(0, 24);
  const maior = Math.max(...amostra.map(Math.abs)) || 1;
  return (
    <div className="sig-passo">
      <p className="sig-titulo">Passo 2 · o que entra e o que sai da Aqua</p>
      <div className="sig-fluxo">
        <section className="sig-bloco">
          <h3>Entrada</h3>
          <b className="sig-palavra">{emFoco.texto}</b>
          <span className="sig-cortador">↓ cortador</span>
          <div className="sig-fichas">
            {emFoco.tokens.map((t, k) => (
              <span key={k} className={t === "[CLS]" || t === "[SEP]" ? "ficha especial" : "ficha"}>
                {t}
              </span>
            ))}
          </div>
        </section>
        <span className="sig-seta" aria-hidden>
          →
        </span>
        <section className="sig-bloco sig-modelo">
          <h3>
            Modelo · a Aqua
            <button className={`sig-ver-camadas${camadas ? " ativo" : ""}`} onClick={onCamadas} aria-pressed={camadas}>
              {camadas ? "Ver a Aqua" : "Ver camadas"}
            </button>
          </h3>
          {camadas ? <Camadas tokens={emFoco.tokens} /> : <AquaAnimada momento="pensando" unidade={10} />}
          <span className="sig-selo">{camadas ? "neurônios por camada" : "6 camadas + média"}</span>
        </section>
        <span className="sig-seta" aria-hidden>
          →
        </span>
        <section className="sig-bloco">
          <h3>Saída</h3>
          <svg viewBox="0 0 240 60" className="sig-tira" aria-hidden>
            <line x1="0" y1="30" x2="240" y2="30" stroke="#C7C7CC" />
            {amostra.map((v, k) => {
              const h = (Math.abs(v) / maior) * 26;
              return <rect key={k} x={k * 10} y={v > 0 ? 30 - h : 30} width="6" height={Math.max(1.5, h)} rx="1" fill="#0E7C86" />;
            })}
          </svg>
          <b>384 números</b>
          <span className="sig-saida-nome">o nome dessa saída é embedding</span>
        </section>
      </div>
    </div>
  );
}

/** A rede da Aqua aberta (tela 3b): 6 camadas de 384 neurônios; os tokens passam por todas. Desenho, não as contas. */
function Camadas({ tokens }: { tokens: string[] }) {
  const xs = [30, 90, 150, 210, 270, 330];
  const ys = [30, 70, 110, 190, 230, 270];
  const mostrados = tokens.slice(0, 5);
  return (
    <svg viewBox="0 0 360 330" className="sig-camadas" role="img" aria-label="6 camadas de 384 neurônios">
      {xs.slice(0, -1).flatMap((x, k) =>
        ys.flatMap((a) => ys.map((b) => <line key={`${k}-${a}-${b}`} x1={x + 7} y1={a} x2={xs[k + 1] - 7} y2={b} stroke="#5ED3DB" strokeWidth="0.75" opacity="0.45" />)),
      )}
      {xs.map((x, k) => (
        <g key={x}>
          {ys.map((y) => (
            <circle key={y} cx={x} cy={y} r="7" fill="#fff" stroke="#5ED3DB" strokeWidth="2" />
          ))}
          {[143, 150, 157].map((y) => (
            <circle key={y} cx={x} cy={y} r="1.6" fill="#5ED3DB" />
          ))}
          <text x={x} y="300" textAnchor="middle" className="sig-384">
            384
          </text>
          {(k === 0 || k === 5) && (
            <text x={x} y="12" textAnchor="middle" className="sig-camada-nome">
              camada {k + 1}
            </text>
          )}
        </g>
      ))}
      {mostrados.map((t, k) => {
        const y = 150 + (k - (mostrados.length - 1) / 2) * 30;
        const especial = t === "[CLS]" || t === "[SEP]";
        return (
          <g key={k}>
            <circle cx="180" cy={y} r={especial ? 6 : 8} fill={especial ? "#AEAEB2" : "#5ED3DB"} stroke="#fff" strokeWidth="2" />
            <rect x="192" y={y - 9} width={t.length * 6.5 + 12} height="18" rx="9" fill={especial ? "#E5E5EA" : "#5ED3DB"} />
            <text x={198} y={y + 4} className="sig-etiqueta">
              {t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- Painel do Rodar (direita, passos 1 a 3) ---------------- */

const PASSOS = [
  {
    titulo: "Cortar em tokens",
    texto: "Cada palavra vira pedaços: os tokens. [CLS] e [SEP] o modelo põe sozinho, um par por texto.",
    selo: "Real: é o cortador do próprio modelo.",
    glossario: "O que é ##?",
  },
  {
    titulo: "Os 384 números",
    texto: "Entra a palavra, cortada em tokens. A Aqua faz as contas por dentro, como a rede das cores, só que com 6 camadas. Sai uma lista de 384 números: o embedding.",
    selo: "Real: os tokens e os 384 números.",
    glossario: "Como é por dentro?",
  },
  {
    titulo: "Posicionar no mapa",
    texto: "O PCA resume os 384 números em 2: a posição no mapa. Parecidos ficam perto.",
    selo: "Real: o PCA é feito no navegador.",
    glossario: "O que é PCA?",
  },
] as const;

function PainelRodar({ rodada, setRodada, onTerminar }: { rodada: Rodada; setRodada: (r: Rodada) => void; onTerminar: () => void }) {
  const passo = PASSOS[rodada.passo - 1];
  const ir = (p: 1 | 2 | 3) => setRodada({ passo: p, camadas: false });
  return (
    <>
      <div className="painel-topo">
        <h2>Rodar</h2>
        <span className="painel-passo">Passo {rodada.passo} de 3</span>
      </div>
      <div className="sig-navegar">
        <button className="botao" disabled={rodada.passo === 1} onClick={() => ir((rodada.passo - 1) as 1 | 2)}>
          ← Anterior
        </button>
        {rodada.passo < 3 ? (
          <button className="botao escuro" onClick={() => ir((rodada.passo + 1) as 2 | 3)}>
            Próximo →
          </button>
        ) : (
          <button className="botao escuro" onClick={onTerminar}>
            Terminar ✓
          </button>
        )}
      </div>
      <div className="sig-passos">
        {(["1 Tokens", "2 384 números", "3 Mapa"] as const).map((nome, k) => (
          <button key={nome} className={rodada.passo === k + 1 ? "ativo" : undefined} onClick={() => ir((k + 1) as 1 | 2 | 3)}>
            {nome}
          </button>
        ))}
      </div>
      <h3 className="sig-passo-titulo">{passo.titulo}</h3>
      <p className="sig-passo-texto">{passo.texto}</p>
      <p className="sig-selo-painel">{passo.selo}</p>
      {/* o glossário ainda não existe (ADR-0039): o link aparece, mas avisa */}
      <span className="sig-glossario" title="O glossário ainda está sendo feito (ADR-0039)">
        {passo.glossario} Ver no glossário (em breve)
      </span>
    </>
  );
}

/* ---------------- Barras (telas 1 e 5) ---------------- */

function Barras({ itens, selecao, resultados }: { itens: Item[]; selecao: NonNullable<Selecao>; resultados: Record<string, ResultadoTexto> }) {
  const base = resultados[selecao.texto];
  if (!base) return <p className="sig-vazio">Aperte Rodar para calcular {selecao.texto}.</p>;
  const outros = itens.filter((i) => i.tipo !== selecao.tipo && resultados[i.texto]);
  const visiveis = outros.filter((i) => i.visivel);
  const escondidos = outros.filter((i) => !i.visivel);
  const notas = visiveis
    .map((i) => ({ texto: i.texto, nota: cosseno(base.embedding, resultados[i.texto].embedding) }))
    .sort((a, b) => b.nota - a.nota);
  const palavra = selecao.tipo === "palavra";
  return (
    <>
      <h2 className="sig-barras-titulo">{selecao.texto}</h2>
      <p className="sig-barras-sub">Parecida com cada {palavra ? "categoria" : "palavra"}</p>
      <p className="sig-barras-legenda">
        Similaridade de cosseno: perto de 1 = parecido,
        <br />
        perto de 0 = nada a ver.
      </p>
      <ul className="sig-barras">
        {notas.map((n) => (
          <li key={n.texto}>
            <span>{n.texto}</span>
            <b>{virgula(n.nota)}</b>
            <div className="sig-trilho-barra">
              <div style={{ width: `${Math.max(0, n.nota) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {notas[0] && (
        <div className="sig-resultado">
          <b>Mais perto: {notas[0].texto}</b>
          <span>{palavra ? `${selecao.texto} vai para essa categoria, sem treino.` : "Das suas palavras, a mais parecida."}</span>
        </div>
      )}
      {escondidos.length > 0 && (
        <p className="sig-nota-escondido">
          {escondidos.map((e) => e.texto).join(", ")} {escondidos.length > 1 ? "estão escondidas" : "está escondida"}, por isso não{" "}
          {escondidos.length > 1 ? "têm" : "tem"} barra. A nota continua calculada.
        </p>
      )}
    </>
  );
}
