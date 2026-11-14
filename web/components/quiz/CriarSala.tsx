"use client";

import { useState } from "react";
import { ASSUNTOS, TEMAS, type Assunto } from "@/lib/quiz/perguntas";
import { QUANTIDADE, TEMPOS_ALTERNATIVAS, TEMPOS_CONTAS, minutosEstimados, montarPlano, type Config } from "@/lib/quiz/quiz";

// P1 · Criar sala: tema, quantas perguntas, como os números são sorteados e o tempo.

const TEMAS_UI = [
  { id: "geral", titulo: "Geral", texto: "Tudo o que o laboratório tem: forward, erro, backward e treino." },
  { id: "forward", titulo: "Só forward", texto: "Para a turma que ainda não viu backpropagation." },
  { id: "escolher", titulo: "Escolher assuntos", texto: "Marque os assuntos um por um." },
] as const;

const SORTEIOS = [
  { id: "por-aluno", titulo: "Cada aluno com os seus", texto: "Mesma pergunta, com cor e pesos diferentes. Ninguém copia do vizinho." },
  { id: "por-turma", titulo: "Os mesmos para a turma", texto: "Todos veem a mesma rede. Fácil de corrigir junto no quadro." },
] as const;

export const CONFIG_INICIAL: Config = {
  tema: "geral",
  assuntos: TEMAS.geral,
  quantidade: 10,
  sorteio: "por-aluno",
  tempoAlternativas: 20,
  tempoContas: 60,
};

export function CriarSala({ onAbrir, abrindo, erro, onVoltar }: { onAbrir: (c: Config) => void; abrindo: boolean; erro: string | null; onVoltar: () => void }) {
  const [c, setC] = useState<Config>(CONFIG_INICIAL);
  const mudar = (parte: Partial<Config>) => setC((x) => ({ ...x, ...parte }));
  const minutos = minutosEstimados(montarPlano(c.assuntos, c.quantidade, 1), c);
  const pronto = c.assuntos.length > 0;

  return (
    <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-10">
        <div>
          <button type="button" onClick={onVoltar} className="text-sm text-text-muted hover:text-text">
            ← Quiz ao vivo
          </button>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Criar sala</h1>
        </div>

        <Secao numero={1} titulo="Tema">
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMAS_UI.map((t) => (
              <Cartao
                key={t.id}
                ativo={c.tema === t.id}
                titulo={t.titulo}
                texto={t.texto}
                onClick={() => mudar({ tema: t.id, assuntos: t.id === "escolher" ? c.assuntos : TEMAS[t.id] })}
              />
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-bg-subtle p-4">
            <p className="text-sm font-semibold text-text-muted">
              Assuntos que entram ({c.assuntos.length} de {ASSUNTOS.length}):
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ASSUNTOS.map((a) => {
                const marcado = c.assuntos.includes(a.id);
                return (
                  <li key={a.id}>
                    <label className={`flex items-center gap-2 text-[15px] ${c.tema === "escolher" ? "cursor-pointer" : ""} ${marcado ? "" : "text-text-subtle"}`}>
                      <input
                        type="checkbox"
                        checked={marcado}
                        disabled={c.tema !== "escolher"}
                        onChange={() =>
                          mudar({ assuntos: marcado ? c.assuntos.filter((x) => x !== a.id) : ASSUNTOS.map((x) => x.id).filter((x): x is Assunto => x === a.id || c.assuntos.includes(x)) })
                        }
                        className="size-4 accent-[#0E7C86]"
                      />
                      {a.longo}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </Secao>

        <Secao numero={2} titulo="Quantas perguntas">
          <div className="flex items-center gap-4">
            <Botao onClick={() => mudar({ quantidade: Math.max(QUANTIDADE.min, c.quantidade - 1) })} rotulo="Menos uma pergunta">
              −
            </Botao>
            <span className="w-12 text-center text-3xl font-bold tabular-nums">{c.quantidade}</span>
            <Botao onClick={() => mudar({ quantidade: Math.min(QUANTIDADE.max, c.quantidade + 1) })} rotulo="Mais uma pergunta">
              +
            </Botao>
            <span className="text-sm text-text-muted">
              de {QUANTIDADE.min} a {QUANTIDADE.max}
            </span>
          </div>
        </Secao>

        <Secao numero={3} titulo="Números sorteados">
          <div className="grid gap-3 sm:grid-cols-2">
            {SORTEIOS.map((s) => (
              <Cartao key={s.id} ativo={c.sorteio === s.id} titulo={s.titulo} texto={s.texto} onClick={() => mudar({ sorteio: s.id })} />
            ))}
          </div>
        </Secao>

        <Secao numero={4} titulo="Tempo por pergunta">
          <div className="flex flex-wrap gap-6">
            <Escolha rotulo="Alternativas" valor={c.tempoAlternativas} opcoes={TEMPOS_ALTERNATIVAS} onChange={(v) => mudar({ tempoAlternativas: v })} />
            <Escolha rotulo="Contas" valor={c.tempoContas} opcoes={TEMPOS_CONTAS} onChange={(v) => mudar({ tempoContas: v })} />
          </div>
          <p className="mt-3 text-sm text-text-muted">Acertou = 1000 pontos. Responder rápido não dá bônus.</p>
        </Secao>
      </div>

      <aside className="h-fit rounded-[24px] border border-black/[.08] bg-[#FAFAFA] p-6 lg:sticky lg:top-6">
        <p className="text-xs font-semibold tracking-[0.1em] text-text-muted">RESUMO</p>
        <p className="mt-4 text-xl font-semibold">
          {c.quantidade} perguntas · {TEMAS_UI.find((t) => t.id === c.tema)!.titulo}
        </p>
        <p className="mt-2 text-[15px] text-text-muted">{c.sorteio === "por-aluno" ? "Cada aluno com os seus números" : "Os mesmos números para a turma"}</p>
        <p className="mt-1 text-[15px] text-text-muted">Cerca de {minutos} minutos</p>
        <p className="mt-6 text-sm text-text-subtle">A sala abre nesta aba. Se ela fechar, o quiz acaba para todos.</p>
        {erro && <p className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm font-semibold text-[#B84040]">{erro}</p>}
        <button
          type="button"
          disabled={!pronto || abrindo}
          onClick={() => onAbrir(c)}
          className="mt-6 h-14 w-full rounded-full bg-text text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {abrindo ? "Abrindo…" : "Abrir sala"}
        </button>
        {!pronto && <p className="mt-2 text-sm text-text-muted">Marque pelo menos um assunto.</p>}
      </aside>
    </div>
  );
}

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold tracking-[0.1em] text-text-muted">
        {numero} · {titulo.toUpperCase()}
      </h2>
      {children}
    </section>
  );
}

function Cartao({ ativo, titulo, texto, onClick }: { ativo: boolean; titulo: string; texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-2xl border p-4 text-left transition-colors ${ativo ? "border-aqua-ink bg-aqua-50 ring-1 ring-aqua-ink" : "border-black/10 hover:bg-black/[.02]"}`}
    >
      <span className="block text-[17px] font-semibold">{titulo}</span>
      <span className="mt-1 block text-sm text-text-muted">{texto}</span>
    </button>
  );
}

function Botao({ onClick, rotulo, children }: { onClick: () => void; rotulo: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={rotulo} className="grid size-11 place-items-center rounded-full border border-black/15 text-xl font-semibold hover:bg-black/[.03]">
      {children}
    </button>
  );
}

function Escolha({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: number; opcoes: readonly number[]; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 text-[15px] font-semibold">
      {rotulo}
      <select value={valor} onChange={(e) => onChange(Number(e.target.value))} className="h-11 rounded-xl border border-black/15 bg-white px-3 font-semibold">
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o} s
          </option>
        ))}
      </select>
    </label>
  );
}
