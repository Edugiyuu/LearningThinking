"use client";

import { useEffect, useRef, useState } from "react";
import { formatar, type Pesos } from "@/lib/rede";
import { sortearPesos, treinar, type Exemplo, type Gravacao, type Passinho, type RedeLida } from "@/lib/treino";

// Treinar (ADR-0024; frames "Laboratório · Treinar · 1 antes / 2 durante / 3 fim" no Figma).
// O treino calcula tudo de uma vez (lib/treino.ts) e a tela reproduz a gravação na velocidade
// escolhida: as linhas do canvas mostram os pesos de cada repetição e o painel, o erro caindo.

export type Velocidade = "x1" | "x10" | "x100";
const REPETICOES_POR_SEGUNDO: Record<Velocidade, number> = { x1: 5, x10: 50, x100: 500 };
const QUADRO_MS = 50;

const NOME_PASSINHO: Record<Passinho, string> = { pequeno: "Pequeno", medio: "Médio", grande: "Grande" };

type Fase = "pronto" | "treinando" | "pausado" | "fim";
type Config = { repeticoes: number; velocidade: Velocidade; passinho: Passinho; doZero: boolean };

export type Treino = ReturnType<typeof useTreino>;

/**
 * O estado do treino. `ler` devolve a rede pronta para treinar (ou a mensagem do que falta);
 * `aplicar` guarda os pesos novos no projeto quando o treino termina.
 */
export function useTreino({ ler, aplicar, exemplos }: { ler: () => RedeLida | string; aplicar: (p: Pesos) => void; exemplos: Exemplo[] }) {
  const [fase, setFase] = useState<Fase>("pronto");
  const [config, setConfig] = useState<Config>({ repeticoes: 1000, velocidade: "x100", passinho: "medio", doZero: true });
  const [gravacao, setGravacao] = useState<Gravacao | null>(null);
  const [quadro, setQuadro] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultadoAberto, setResultadoAberto] = useState(false);
  const [usada, setUsada] = useState<Config>(config); // a configuração do treino que está passando
  const [exemplosUsados, setExemplosUsados] = useState<Exemplo[]>([]); // a tabela do fim não muda se a lista mudar depois

  const comecar = () => {
    const lida = ler();
    if (typeof lida === "string") {
      setAviso(lida);
      return;
    }
    if (exemplos.length === 0) {
      setAviso("Coloque pelo menos uma cor nos Dados.");
      return;
    }
    setAviso(null);
    const pesos = config.doZero ? sortearPesos(lida.rede, exemplos, Date.now() % 100000) : lida.pesos;
    setUsada(config);
    quadroAtual.current = 0;
    setExemplosUsados(exemplos);
    setGravacao(treinar({ rede: lida.rede, pesos, exemplos, repeticoes: config.repeticoes, passinho: config.passinho, semente: Date.now() % 100000 }));
    setQuadro(0);
    setResultadoAberto(false);
    setFase("treinando");
  };

  // reprodução: avança as repetições na velocidade escolhida (dá para trocar no meio).
  // Na última, os pesos novos ficam no projeto e o resultado abre.
  const quadroAtual = useRef(0);
  const acumulado = useRef(0);
  useEffect(() => {
    if (fase !== "treinando" || !gravacao) return;
    const ultimo = gravacao.quadros.length - 1;
    const t = setInterval(() => {
      acumulado.current += (REPETICOES_POR_SEGUNDO[config.velocidade] * QUADRO_MS) / 1000;
      const passo = Math.floor(acumulado.current);
      if (passo < 1) return;
      acumulado.current -= passo;
      quadroAtual.current = Math.min(ultimo, quadroAtual.current + passo);
      setQuadro(quadroAtual.current);
      if (quadroAtual.current >= ultimo) {
        clearInterval(t);
        aplicar(gravacao.depois.pesos);
        setFase("fim");
        setResultadoAberto(true);
      }
    }, QUADRO_MS);
    return () => clearInterval(t);
  }, [fase, gravacao, config.velocidade, aplicar]);

  const emAndamento = fase === "treinando" || fase === "pausado";
  return {
    fase,
    config,
    setConfig: (c: Partial<Config>) => setConfig((atual) => ({ ...atual, ...c })),
    usada,
    gravacao,
    exemplosUsados,
    quadro,
    aviso,
    resultadoAberto,
    setResultadoAberto,
    comecar,
    pausar: () => setFase((f) => (f === "treinando" ? "pausado" : f === "pausado" ? "treinando" : f)),
    /** Parar no meio desfaz o treino: os pesos voltam a ser os de antes. */
    parar: () => {
      setFase("pronto");
      setGravacao(null);
    },
    /** Voltar à tela de antes (Treinar de novo). */
    reiniciar: () => {
      setFase("pronto");
      setResultadoAberto(false);
    },
    /** Os pesos da repetição que está na tela, enquanto o treino passa. */
    pesosAoVivo: emAndamento && gravacao ? gravacao.quadros[quadro]?.pesos : null,
    emAndamento,
  };
}

/* ---------- O painel ---------- */

type Rotulos = { rotulo0: string; rotulo1: string };

/**
 * O painel durante e depois do treino. Antes do treino, os controles e os Dados ficam no
 * bloco Backward pass (ADR-0025): sem o bloco, não há Treinar.
 */
export function SecaoTreinar({ treino, exemplos, rodarAgora }: { treino: Treino; exemplos: Exemplo[]; rodarAgora: () => void }) {
  if (treino.fase === "pronto") return null;
  return (
    <section className="treinar treinar-sozinho" aria-labelledby="treinar-titulo">
      <div className="treinar-topo">
        <h2 id="treinar-titulo">Treinar</h2>
        {treino.emAndamento && (
          <span className="treinar-selo">
            <i /> {treino.fase === "pausado" ? "pausado" : "treinando"}
          </span>
        )}
        {treino.fase === "fim" && <span className="treinar-selo concluido">✓ concluído</span>}
      </div>
      {treino.emAndamento && <Durante treino={treino} exemplos={exemplos.length} />}
      {treino.fase === "fim" && <Fim treino={treino} rodarAgora={rodarAgora} />}
    </section>
  );
}

/* ---------- No bloco Backward pass (ADR-0025) ---------- */

/**
 * Os Dados: recolhidos (amostras), ou abertos para editar. "+ cor da Entrada" pega a cor que
 * está na Entrada agora, sem digitar RGB, e o aluno diz de que lado ela é.
 */
export function DadosDoBloco({
  dados,
  setDados,
  rotulos,
  corDaEntrada,
}: {
  dados: Exemplo[];
  setDados: (e: Exemplo[]) => void;
  rotulos: Rotulos;
  corDaEntrada: string | null;
}) {
  const [editando, setEditando] = useState(false);
  const de = (c: 0 | 1) => dados.filter((e) => e.objetivo === c).length;
  const jaTem = !!corDaEntrada && dados.some((d) => d.cor.toUpperCase() === corDaEntrada);
  return (
    <div className="dados">
      <div className="dados-topo">
        <span>
          <b>Dados</b> · {dados.length} {dados.length === 1 ? "cor" : "cores"}
        </span>
        <button className="exemplos-editar" aria-expanded={editando} onClick={() => setEditando(!editando)}>
          {editando ? "pronto ▾" : "editar ▸"}
        </button>
      </div>
      {!editando ? (
        <>
          <div className="exemplos-amostras" aria-label="Cores dos Dados">
            {[1, 0].flatMap((c) =>
              dados.filter((e) => e.objetivo === c).map((e, i) => <span key={`${c}-${i}`} style={{ background: e.cor }} title={`${e.cor} · ${c === 1 ? rotulos.rotulo1 : rotulos.rotulo0}`} />),
            )}
          </div>
          <p className="backward-nota">
            {rotulos.rotulo1} (1): {de(1)} · {rotulos.rotulo0} (0): {de(0)}
          </p>
        </>
      ) : (
        <>
          <ul className="exemplos-lista">
            {dados.map((e, i) => (
              <li key={i}>
                <input
                  type="color"
                  value={e.cor.toLowerCase()}
                  aria-label={`Cor ${i + 1} dos Dados`}
                  onChange={(ev) => setDados(dados.map((x, j) => (j === i ? { ...x, cor: ev.target.value.toUpperCase() } : x)))}
                />
                <button
                  className={`exemplos-marca marca-${e.objetivo}`}
                  title="Trocar a marcação"
                  onClick={() => setDados(dados.map((x, j) => (j === i ? { ...x, objetivo: x.objetivo === 1 ? 0 : 1 } : x)))}
                >
                  {e.objetivo === 1 ? rotulos.rotulo1 : rotulos.rotulo0} · {e.objetivo}
                </button>
                <button className="exemplos-tirar" aria-label={`Tirar a cor ${i + 1} dos Dados`} onClick={() => setDados(dados.filter((_, j) => j !== i))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          {corDaEntrada && !jaTem ? (
            <div className="dados-mais">
              <span>
                <i style={{ background: corDaEntrada }} /> + cor da Entrada como
              </span>
              {([0, 1] as const).map((o) => (
                <button key={o} className="botao" onClick={() => setDados([...dados, { cor: corDaEntrada, objetivo: o }])}>
                  {o === 1 ? rotulos.rotulo1 : rotulos.rotulo0} · {o}
                </button>
              ))}
            </div>
          ) : (
            <p className="backward-nota">{corDaEntrada ? "A cor da Entrada já está nos Dados." : "Para acrescentar, use a Entrada de cor."}</p>
          )}
          <p className="backward-nota">Clique na marcação para trocar 0 ↔ 1.</p>
        </>
      )}
    </div>
  );
}

/** Os controles do treino, compactos, dentro do bloco. Durante o treino, o painel mostra o erro caindo. */
export function ControlesDoTreino({ treino }: { treino: Treino }) {
  const { config, setConfig } = treino;
  return (
    <div className="treino-bloco">
      <b className="treino-bloco-titulo">Treinar</b>
      <span className="treino-bloco-rotulo">Passinho</span>
      <div className="alternar tres">
        {(Object.keys(NOME_PASSINHO) as Passinho[]).map((p) => (
          <button key={p} className={config.passinho === p ? "ativo" : ""} onClick={() => setConfig({ passinho: p })} title="Quanto cada peso muda por vez. Grande demais: a rede pode travar.">
            {NOME_PASSINHO[p]}
          </button>
        ))}
      </div>
      <div className="treinar-campos">
        <label>
          <span>Repetições</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={config.repeticoes}
            onChange={(e) => setConfig({ repeticoes: Math.max(1, Math.min(10000, Number(e.target.value) || 1)) })}
          />
        </label>
        <label>
          <span>Velocidade</span>
          <select value={config.velocidade} onChange={(e) => setConfig({ velocidade: e.target.value as Velocidade })}>
            <option>x1</option>
            <option>x10</option>
            <option>x100</option>
          </select>
        </label>
      </div>
      <span className="treino-bloco-rotulo">Começar de</span>
      <div className="alternar">
        <button className={config.doZero ? "ativo" : ""} onClick={() => setConfig({ doZero: true })} title="Sorteia os pesos">
          Do zero
        </button>
        <button className={!config.doZero ? "ativo" : ""} onClick={() => setConfig({ doZero: false })} title="Continua dos pesos atuais">
          Já treinada
        </button>
      </div>
      {treino.aviso && <p className="erros">{treino.aviso}</p>}
      <button className="botao principal" onClick={treino.comecar} disabled={treino.fase !== "pronto"}>
        Treinar {config.repeticoes.toLocaleString("pt-BR")} {config.repeticoes === 1 ? "vez" : "vezes"}
      </button>
      {treino.fase !== "pronto" && <p className="backward-nota">O treino aparece no painel da direita.</p>}
    </div>
  );
}

function Durante({ treino, exemplos }: { treino: Treino; exemplos: number }) {
  const g = treino.gravacao!;
  const total = g.quadros.length;
  const atual = g.quadros[treino.quadro];
  return (
    <>
      <div className="treinar-rotulo">Repetição</div>
      <p className="treinar-contador">
        {atual.repeticao.toLocaleString("pt-BR")} <span>de {total.toLocaleString("pt-BR")}</span>
      </p>
      <div className="treinar-progresso" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={atual.repeticao}>
        <i style={{ width: `${(atual.repeticao / total) * 100}%` }} />
      </div>
      <div className="treinar-grafico">
        <div className="treinar-grafico-topo">
          <span>erro</span>
          <b>{formatar(atual.erro)}</b>
        </div>
        <GraficoErro gravacao={g} ate={treino.quadro} altura={110} />
      </div>
      <div className="treinar-rotulo">Velocidade</div>
      <div className="alternar tres">
        {(["x1", "x10", "x100"] as Velocidade[]).map((v) => (
          <button key={v} className={treino.config.velocidade === v ? "ativo" : ""} onClick={() => treino.setConfig({ velocidade: v })}>
            {v}
          </button>
        ))}
      </div>
      <div className="navegar">
        <button className="botao" onClick={treino.pausar}>
          {treino.fase === "pausado" ? "▶ Continuar" : "❚❚ Pausar"}
        </button>
        <button className="botao treinar-parar" onClick={treino.parar}>
          ■ Parar
        </button>
      </div>
      <div className="treinar-explica">
        <b>O que está acontecendo</b>
        <p>
          A cada repetição a rede vê as {exemplos} cores, mede o erro, volta a culpa e ajusta cada peso um passinho. Repare nas linhas mudando de cor e
          espessura.
        </p>
      </div>
      <p className="treinar-nota esquerda">
        Passinho: {NOME_PASSINHO[treino.usada.passinho]} · {treino.usada.doZero ? "começou do zero" : "continuou da rede atual"}
      </p>
    </>
  );
}

function Fim({ treino, rodarAgora }: { treino: Treino; rodarAgora: () => void }) {
  const g = treino.gravacao!;
  const certas = (respostas: number[]) => respostas.filter((r, i) => (r >= 0.5 ? 1 : 0) === treino.exemplosUsados[i]?.objetivo).length;
  return (
    <>
      <div className="treinar-resumo">
        <p className="treinar-nota esquerda">
          {g.quadros.length.toLocaleString("pt-BR")} repetições · passinho {NOME_PASSINHO[treino.usada.passinho]}
        </p>
        <span className="treinar-rotulo">erro</span>
        <p className="treinar-erros">
          {formatar(g.antes.erro)} <span>→</span> <b>{formatar(g.depois.erro)}</b>
        </p>
        <p className="treinar-nota esquerda">
          {certas(g.depois.respostas)} de {g.depois.respostas.length} cores certas (antes: {certas(g.antes.respostas)})
        </p>
      </div>
      <button className="botao treinar-ver" onClick={() => treino.setResultadoAberto(true)}>
        Ver resultado
      </button>
      <button className="botao escuro" onClick={rodarAgora}>
        ▶ Rodar com os pesos novos
      </button>
      <button className="treinar-de-novo" onClick={treino.reiniciar}>
        Treinar de novo
      </button>
      <p className="treinar-nota esquerda">Os pesos novos ficaram salvos no projeto.</p>
    </>
  );
}

/* ---------- Gráfico do erro ---------- */

function GraficoErro({ gravacao, ate, altura }: { gravacao: Gravacao; ate: number; altura: number }) {
  const largura = 240;
  const total = gravacao.quadros.length;
  const max = Math.max(0.05, gravacao.antes.erro, ...gravacao.quadros.map((q) => q.erro));
  const px = (i: number) => 28 + (total <= 1 ? 0 : (i / (total - 1)) * (largura - 36));
  const py = (e: number) => 8 + (1 - e / max) * (altura - 28);
  // no máximo ~200 pontos, para o caminho continuar leve com muitas repetições
  const passo = Math.max(1, Math.floor(total / 200));
  const pontos: string[] = [];
  for (let i = 0; i <= ate; i += passo) pontos.push(`${px(i).toFixed(1)},${py(gravacao.quadros[i].erro).toFixed(1)}`);
  pontos.push(`${px(ate).toFixed(1)},${py(gravacao.quadros[ate].erro).toFixed(1)}`);
  return (
    <svg className="grafico-erro" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={`Erro ao longo das repetições: de ${formatar(gravacao.antes.erro)} para ${formatar(gravacao.quadros[ate].erro)}.`}>
      <line x1={28} y1={py(0)} x2={largura - 8} y2={py(0)} className="grafico-eixo" />
      <line x1={28} y1={8} x2={28} y2={py(0)} className="grafico-eixo" />
      <text x={24} y={py(max) + 3} textAnchor="end">
        {formatar(max)}
      </text>
      <text x={24} y={py(0) + 3} textAnchor="end">
        0
      </text>
      <text x={28} y={altura - 4}>
        1
      </text>
      <text x={largura - 8} y={altura - 4} textAnchor="end">
        {total.toLocaleString("pt-BR")}
      </text>
      <polyline points={pontos.join(" ")} className="grafico-linha" />
      <circle cx={px(ate)} cy={py(gravacao.quadros[ate].erro)} r={3.5} className="grafico-ponto" />
    </svg>
  );
}

/* ---------- A janela flutuante do resultado ---------- */

export function ResultadoTreino({ treino, rotulos, rodarAgora }: { treino: Treino; rotulos: Rotulos; rodarAgora: () => void }) {
  const [minimizada, setMinimizada] = useState(false);
  const g = treino.gravacao;
  if (!g || !treino.resultadoAberto || treino.fase !== "fim") return null;
  const exemplos = treino.exemplosUsados;
  const obj = exemplos.map((e) => e.objetivo);
  const certas = (respostas: number[]) => respostas.filter((r, i) => (r >= 0.5 ? 1 : 0) === obj[i]).length;
  const nome = (c: 0 | 1) => (c === 1 ? rotulos.rotulo1 : rotulos.rotulo0);
  return (
    <section className={`resultado ${minimizada ? "minimizada" : ""}`} aria-labelledby="resultado-titulo">
      <header className="resultado-topo">
        <h2 id="resultado-titulo">Resultado do treino</h2>
        <span>
          {g.quadros.length.toLocaleString("pt-BR")} repetições · passinho {NOME_PASSINHO[treino.usada.passinho]} · {treino.usada.doZero ? "do zero" : "da rede atual"}
        </span>
        <button onClick={() => setMinimizada(!minimizada)} aria-label={minimizada ? "Abrir" : "Minimizar"}>
          {minimizada ? "▴" : "—"}
        </button>
        <button onClick={() => treino.setResultadoAberto(false)} aria-label="Fechar">
          ×
        </button>
      </header>
      {!minimizada && (
        <div className="resultado-corpo">
          <div className="resultado-grafico">
            <div className="treinar-grafico-topo">
              <span>erro a cada repetição</span>
              <span>
                {formatar(g.antes.erro)} → <b>{formatar(g.depois.erro)}</b>
              </span>
            </div>
            <GraficoErro gravacao={g} ate={g.quadros.length - 1} altura={190} />
          </div>
          <div className="resultado-tabela">
            <table>
              <thead>
                <tr>
                  <th>cor</th>
                  <th>objetivo</th>
                  <th>antes</th>
                  <th>depois</th>
                </tr>
              </thead>
              <tbody>
                {obj.map((o, i) => {
                  const antes = g.antes.respostas[i];
                  const depois = g.depois.respostas[i];
                  const certo = (r: number) => (r >= 0.5 ? 1 : 0) === o;
                  return (
                    <tr key={i}>
                      <td>
                        <i style={{ background: exemplos[i]?.cor }} /> {exemplos[i]?.cor}
                      </td>
                      <td className={`marca-${o}`}>
                        {nome(o)} · {o}
                      </td>
                      <td className={certo(antes) ? "certo" : "errado"}>
                        {formatar(antes)} {certo(antes) ? "✓" : "✕"}
                      </td>
                      <td className={certo(depois) ? "certo forte" : "errado forte"}>
                        {formatar(depois)} {certo(depois) ? "✓" : "✕"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="resultado-rodape">
              certas: <b>{certas(g.antes.respostas)} de {obj.length}</b> antes → <b className="certo">{certas(g.depois.respostas)} de {obj.length}</b> depois
              <span>só os pesos mudaram</span>
            </p>
            <button className="botao escuro resultado-rodar" onClick={rodarAgora}>
              ▶ Rodar agora
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
