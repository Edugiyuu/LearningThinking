"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { Aqua } from "@/components/mascote";
import { abrirSala } from "@/lib/quiz/conexao";
import { nomeAssunto, textoDaCerta, textoDaResposta, type Pergunta } from "@/lib/quiz/perguntas";
import { SalaDoProfessor, type AlunoNaSala, type EstadoDoProfessor } from "@/lib/quiz/professor";
import { classificar, gerarCodigo, juntarNomes, montarPlano, type Config } from "@/lib/quiz/quiz";
import { ChipAssunto, CronometroRedondo, LETRAS, QrCode, linkDoAluno, ordinal, segundosAte, useAgora } from "./comum";
import { CriarSala } from "./CriarSala";
import { VisualDaPergunta } from "./Responder";
import { RedeDesenho } from "./RedeDesenho";

// Quiz ao vivo (ADR-0034): a aba do professor, ligada ao projetor (telas P1–P6 do Figma).
// A sala vive na memória desta aba: fechou a aba, acabou a sala, e nada fica guardado.

type Aberta = { prof: SalaDoProfessor; fechar: () => void };

export default function QuizProfessor({ onVoltar }: { onVoltar: () => void }) {
  const [sala, setSala] = useState<Aberta | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [instavel, setInstavel] = useState(false);

  const abrir = async (config: Config) => {
    setAbrindo(true);
    setErro(null);
    const semente = Math.floor(Math.random() * 2 ** 31);
    const plano = montarPlano(config.assuntos, config.quantidade, semente);
    let prof: SalaDoProfessor | null = null;
    try {
      const aberta = await abrirSala(() => gerarCodigo(), {
        conectou: (c) => prof?.conectou(c),
        recebeu: (id, m) => prof?.recebeu(id, m),
        saiu: (id) => prof?.saiu(id),
        instavel: setInstavel,
      });
      prof = new SalaDoProfessor(aberta.codigo, config, plano, semente);
      setSala({ prof, fechar: aberta.fechar });
    } catch {
      setErro("Não deu para abrir a sala. Confira a internet: a sala usa um serviço público (PeerJS) para apresentar os aparelhos, e algumas redes de escola bloqueiam.");
    } finally {
      setAbrindo(false);
    }
  };

  if (!sala) return <CriarSala onAbrir={abrir} abrindo={abrindo} erro={erro} onVoltar={onVoltar} />;
  return (
    <SalaAberta
      prof={sala.prof}
      instavel={instavel}
      onFechar={() => {
        sala.prof.fechar();
        setTimeout(sala.fechar, 300); // dá tempo do aviso "fechada" chegar nos aparelhos
        setSala(null);
        onVoltar();
      }}
    />
  );
}

function SalaAberta({ prof, instavel, onFechar }: { prof: SalaDoProfessor; instavel: boolean; onFechar: () => void }) {
  const e = useSyncExternalStore(prof.assinar, prof.estado, prof.estado);

  // o relógio da sala: acabou o tempo, encerra a pergunta
  useEffect(() => {
    const id = setInterval(() => prof.tique(), 250);
    return () => clearInterval(id);
  }, [prof]);

  // fechar a aba fecha a sala para todos: o navegador pergunta antes
  useEffect(() => {
    const aviso = (ev: BeforeUnloadEvent) => {
      if (prof.estado().fase !== "fim") ev.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [prof]);

  const fechar = () => {
    if (e.fase === "fim" || window.confirm("A sala vai acabar para todos. Fechar?")) onFechar();
  };

  return (
    <>
      {instavel && (
        <p className="bg-[#FFF4E8] px-4 py-2 text-center text-sm font-semibold text-[#CE6A1F]">
          A conexão com o serviço que apresenta os aparelhos caiu. Quem já está na sala continua; ninguém novo entra até voltar.
        </p>
      )}
      {e.fase === "espera" && <Espera e={e} onComecar={() => prof.comecar()} onFechar={fechar} />}
      {e.fase === "pergunta" && <PerguntaAoVivo e={e} prof={prof} />}
      {e.fase === "resultado" && <ResultadoDaPergunta e={e} prof={prof} />}
      {e.fase === "fim" && <Fim e={e} prof={prof} onFechar={fechar} />}
    </>
  );
}

/* ---------- Topo das telas projetadas ---------- */

function Topo({ children, direita }: { children?: React.ReactNode; direita?: React.ReactNode }) {
  return (
    <header className="border-b border-black/[.06]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
        <span className="flex items-center gap-2">
          <Aqua unidade={4} />
          <span className="hidden text-[15px] font-bold lg:inline">LearningThinking</span>
        </span>
        {children}
        <span className="ml-auto flex items-center gap-4">{direita}</span>
      </div>
    </header>
  );
}

/* ---------- P2 · Sala de espera ---------- */

function Espera({ e, onComecar, onFechar }: { e: EstadoDoProfessor; onComecar: () => void; onFechar: () => void }) {
  const link = linkDoAluno(e.codigo);
  const enderecoCurto = link.replace(/^https?:\/\//, "").replace(/\/\?codigo=.*$/, "").replace(/\/entrar$/, "");
  const presentes = e.alunos.filter((a) => a.conectado);
  const ultimo = presentes[presentes.length - 1]?.id;
  const lista = useRef<HTMLUListElement>(null);

  // quem entra aparece com um pulinho (GSAP)
  useLayoutEffect(() => {
    const novo = lista.current?.querySelector(`[data-id="${ultimo}"]`);
    if (!novo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // context + revert: ao limpar, o GSAP devolve o estilo original (senão o item fica preso invisível)
    const ctx = gsap.context(() => {
      gsap.timeline().from(novo, { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" });
    });
    return () => ctx.revert();
  }, [ultimo]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Topo
        direita={<span className="hidden text-[13px] text-text-subtle md:inline">Não feche esta aba: a sala acaba para todos.</span>}
      >
        <span className="flex items-center gap-2 rounded-full border border-aqua-ink bg-aqua-50 px-4 py-1.5 text-sm font-semibold text-aqua-on">
          <span className="size-2.5 rounded-full bg-[#1E9E5A]" /> Quiz ao vivo · sala aberta
        </span>
      </Topo>
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div>
            <p className="text-xl text-text-muted">Entre em</p>
            <p className="mt-1 text-2xl font-semibold break-all sm:text-[26px]">{enderecoCurto}</p>
            <p className="mt-3 text-xl text-text-muted">e digite o código da sala:</p>
            <p className="mt-4 font-mono text-[clamp(64px,11vw,128px)] leading-none font-bold tracking-[0.12em]">{e.codigo}</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-[20px] border border-black/10 bg-white p-3">
              <QrCode texto={link} tamanho={250} />
            </div>
            <p className="text-[15px] text-text-muted">ou aponte a câmera do celular</p>
          </div>
        </div>
        <div className="mt-10 border-t border-black/[.08] pt-8">
          <p className="flex flex-wrap items-baseline gap-x-4">
            <span className="text-2xl font-semibold">{presentes.length} na sala</span>
            <span className="text-[15px] text-text-subtle">os apelidos aparecem aqui quando cada um entra</span>
          </p>
          <ul ref={lista} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {presentes.map((a) => (
              <li key={a.id} data-id={a.id} className={`truncate rounded-full px-6 py-3 text-[17px] font-semibold ${a.id === ultimo ? "border border-aqua bg-aqua-50" : "bg-bg-subtle"}`}>
                {a.apelido}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <footer className="border-t border-black/[.08] bg-[#FAFAFA]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <div className="flex-1">
            <p className="text-[17px] font-semibold">
              {e.config.tema === "forward" ? "Só forward" : e.config.tema === "geral" ? "Geral" : "Assuntos escolhidos"} · {e.plano.length} perguntas
            </p>
            <p className="text-sm text-text-muted">
              {e.config.sorteio === "por-aluno" ? "Cada aluno com os seus números" : "Os mesmos números para a turma"} · alternativas {e.config.tempoAlternativas} s · contas {e.config.tempoContas} s
            </p>
          </div>
          <button type="button" onClick={onFechar} className="h-13 rounded-full border border-black/15 bg-white px-8 py-3 font-medium hover:bg-black/[.03]">
            Fechar sala
          </button>
          <button
            type="button"
            onClick={onComecar}
            disabled={presentes.length === 0}
            className="rounded-full bg-text px-10 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            Começar →
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------- P3 · A pergunta ao vivo ---------- */

/** No projetor, o neurônio onde o aluno digita aparece com "?" (sem campo). */
function desenhoProjetado(p: Pergunta) {
  if (!p.desenho) return null;
  const f = p.forma;
  if (f.tipo === "numero" && f.alvo?.tipo === "neuronio") return { ...p.desenho, textos: { ...p.desenho.textos, [f.alvo.id]: "?" }, destaque: [...p.desenho.destaque, f.alvo.id] };
  return p.desenho;
}

function PerguntaAoVivo({ e, prof }: { e: EstadoDoProfessor; prof: SalaDoProfessor }) {
  const agora = useAgora();
  const item = e.plano[e.indice];
  const porAluno = e.config.sorteio === "por-aluno";
  const p = prof.perguntaDe(e.indice); // por turma: a de todos; por aluno: só o formato (sem números)
  const restante = segundosAte(e.prazo, agora);
  const total = p.forma.tipo === "numero" ? e.config.tempoContas : e.config.tempoAlternativas;
  const desenho = desenhoProjetado(p);
  const f = p.forma;

  return (
    <div className="flex min-h-dvh flex-col">
      <Topo
        direita={
          <>
            <span className="hidden items-center gap-3 sm:flex">
              <span className="h-2 w-36 overflow-hidden rounded-full bg-black/[.08]">
                <span className="block h-full bg-aqua" style={{ width: `${e.participando ? (e.responderam / e.participando) * 100 : 0}%` }} />
              </span>
              <span className="text-[15px] text-text-muted tabular-nums">
                {e.responderam} de {e.participando} responderam
              </span>
            </span>
            <CronometroRedondo restante={restante} total={total} />
          </>
        }
      >
        <span className="font-semibold">
          Pergunta {e.indice + 1} de {e.plano.length}
        </span>
        <ChipAssunto assunto={item.assunto} />
      </Topo>
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-[clamp(22px,2.6vw,32px)] leading-snug font-semibold">{porAluno ? p.geral : p.enunciado}</h1>
        {porAluno && <p className="-mt-3 text-text-muted">Cada aluno tem os seus números: a pergunta completa está no aparelho de cada um.</p>}
        <div className={`grid gap-6 ${f.tipo === "alternativas" && !porAluno ? "lg:grid-cols-[1.5fr_1fr]" : ""}`}>
          <div className="flex flex-col gap-4">
            <VisualDaPergunta p={p} semNumeros={porAluno} />
            {desenho && (
              <div className="rounded-[24px] border border-black/[.08] bg-[#FAFAFA] p-4">
                <RedeDesenho desenho={desenho} semNumeros={porAluno} linhaDaPergunta={f.tipo === "linha" ? f.linha : undefined} desligado />
                <p className="mt-2 text-center text-[13px] text-text-subtle">Linha verde: peso positivo · vermelha: negativo · mais grossa: peso maior.</p>
              </div>
            )}
          </div>
          {f.tipo === "alternativas" && !porAluno && (
            <ol className="flex flex-col gap-3">
              {f.opcoes.map((o, i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-5 py-4 text-xl font-semibold">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-base font-bold text-text-muted">{LETRAS[i]}</span>
                  {o.texto}
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-4 pb-8 sm:px-6">
        <span className="rounded-full bg-aqua-50 px-6 py-3 text-lg font-semibold text-aqua-on">Responda no celular ou no computador</span>
        <span className="ml-auto flex gap-3">
          <button type="button" onClick={() => prof.maisTempo(15)} className="rounded-full border border-black/15 bg-white px-6 py-3 font-semibold hover:bg-black/[.03]">
            +15 s
          </button>
          <button type="button" onClick={() => prof.encerrar()} className="rounded-full border border-black/15 bg-white px-6 py-3 font-semibold hover:bg-black/[.03]">
            Encerrar agora
          </button>
        </span>
      </footer>
    </div>
  );
}

/* ---------- P4 · O resultado da pergunta ---------- */

function ResultadoDaPergunta({ e, prof }: { e: EstadoDoProfessor; prof: SalaDoProfessor }) {
  const r = e.resultado!;
  const item = e.plano[e.indice];
  const { pergunta: p, deQuem } = prof.exemplo(e.indice);
  const ultima = e.indice + 1 >= e.plano.length;
  const maior = Math.max(1, ...r.grupos.map((g) => g.quantos));
  const top = r.placar.slice(0, 5);
  const empatadosNoPrimeiro = r.placar.filter((x) => x.posicao === 1);
  const placar = useRef<HTMLDivElement>(null);

  // as linhas do placar entram uma de cada vez (GSAP)
  useLayoutEffect(() => {
    if (!placar.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline().from("[data-linha]", { x: 24, opacity: 0, duration: 0.3, stagger: 0.07, ease: "power2.out" });
    }, placar);
    return () => ctx.revert();
  }, [e.indice]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Topo direita={<span className="text-[15px] text-text-muted">Tempo esgotado</span>}>
        <span className="font-semibold">
          Pergunta {e.indice + 1} de {e.plano.length}
        </span>
        <ChipAssunto assunto={item.assunto} />
      </Topo>
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6">
        <p className="text-text-muted">{e.config.sorteio === "por-aluno" ? p.geral : p.enunciado}</p>
        <h1 className="mt-1 text-[clamp(36px,4vw,52px)] font-bold tracking-[-0.02em]">
          {r.acertaram} de {r.participaram} acertaram
        </h1>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr_0.9fr]">
          {/* o que a turma respondeu */}
          <section className="rounded-[24px] border border-black/[.08] bg-[#FAFAFA] p-6">
            <h2 className="text-xs font-semibold tracking-[0.1em] text-text-muted">O QUE A TURMA RESPONDEU</h2>
            <ul className="mt-5 flex flex-col gap-4">
              {r.grupos.slice(0, 5).map((g) => (
                <li key={g.texto}>
                  <p className="flex items-baseline gap-2">
                    <span className={`min-w-0 flex-1 truncate ${g.texto === "sem resposta" || (e.config.sorteio === "por-aluno" && !g.certa) ? "text-[15px] text-text-muted" : "text-lg font-bold"}`}>
                      {g.texto === "certa" ? "acertaram" : g.texto}
                      {g.certa && <span className="ml-2 text-sm font-semibold text-[#1E9E5A]">✓ certa</span>}
                    </span>
                    <span className="text-lg font-bold tabular-nums">{g.quantos}</span>
                  </p>
                  <span className="mt-1.5 block h-3 rounded-full bg-black/[.08]">
                    <span className={`block h-full rounded-full ${g.certa ? "bg-[#1E9E5A]" : g.texto === "sem resposta" ? "bg-[#D2D2D7]" : "bg-[#AEAEB2]"}`} style={{ width: `${(g.quantos / maior) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            {r.erroMaisComum && e.config.sorteio === "por-turma" && (
              <div className="mt-6 rounded-2xl bg-[#FFF4E8] p-4">
                <p className="text-sm font-semibold text-[#CE6A1F]">Erro mais comum: {r.erroMaisComum.texto}</p>
                {r.erroMaisComum.erro && <p className="mt-1 text-[13px] text-text-muted">{r.erroMaisComum.erro}</p>}
              </div>
            )}
          </section>

          {/* a conta certa explicada (só aqui, decisão 10) */}
          <section className="rounded-[24px] border border-aqua bg-aqua-50 p-6">
            <h2 className="text-xs font-semibold tracking-[0.1em] text-aqua-ink">A CONTA CERTA{deQuem ? ` · NA REDE DE ${deQuem.toUpperCase()}` : ""}</h2>
            <ol className="mt-5 flex flex-col gap-4">
              {p.conta.map((passo, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-aqua-ink text-sm font-bold text-white">{i + 1}</span>
                  <span className="text-[17px] leading-snug">
                    {passo.rotulo}
                    <br />
                    <b>{passo.conta}</b>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[15px]">
              A certa: <b>{textoDaCerta(p)}</b>
            </p>
            {p.porque && (
              <div className="mt-5 border-t border-aqua pt-4 text-sm text-aqua-on">
                <p className="font-semibold">Por quê?</p>
                <p className="mt-1">{p.porque}</p>
              </div>
            )}
          </section>

          {/* o placar, com +1000 e quem subiu ou desceu (decisão 13) */}
          <section ref={placar} className="rounded-[24px] border border-black/[.08] bg-[#FAFAFA] p-6">
            <h2 className="flex justify-between text-xs font-semibold tracking-[0.1em] text-text-muted">
              PLACAR <span className="font-normal tracking-normal text-text-subtle">nesta pergunta · total</span>
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {top.map((x) => (
                <li key={x.id} data-linha className="flex items-center gap-3 text-base">
                  <span className={`w-8 font-bold ${x.posicao === 1 ? "text-aqua-ink" : ""}`}>{ordinal(x.posicao)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{x.apelido}</span>
                  <Ganho valor={x.ganhou} />
                  <span className="w-12 text-right font-bold tabular-nums">{x.pontos}</span>
                </li>
              ))}
            </ul>
            {empatadosNoPrimeiro.length > top.length && (
              <p className="mt-3 text-xs text-text-subtle">
                + {juntarNomes(empatadosNoPrimeiro.slice(top.length, top.length + 2).map((x) => x.apelido))}
                {empatadosNoPrimeiro.length > top.length + 2 ? ` e mais ${empatadosNoPrimeiro.length - top.length - 2}` : ""}: {empatadosNoPrimeiro.length} empatados em 1º. Empate divide a posição.
              </p>
            )}
            {r.mexeu.length > 0 && (
              <>
                <h3 className="mt-5 border-t border-black/[.08] pt-4 text-xs font-semibold tracking-[0.1em] text-text-muted">QUEM SE MEXEU</h3>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {r.mexeu.map((m) => (
                    <li key={m.id} data-linha className="flex items-center gap-2 text-base">
                      <span className={`w-5 font-bold ${m.depois < m.antes ? "text-[#1E9E5A]" : "text-[#E5736F]"}`} aria-label={m.depois < m.antes ? "subiu" : "desceu"}>
                        {m.depois < m.antes ? "▲" : "▼"}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{m.apelido}</span>
                      <span className="text-sm whitespace-nowrap text-text-muted">
                        {ordinal(m.antes)} → {ordinal(m.depois)}
                      </span>
                      <Ganho valor={m.ganhou} />
                      <span className="w-12 text-right font-bold tabular-nums">{m.pontos}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pb-8 sm:flex-row sm:items-center sm:px-6">
        <p className="flex-1 text-sm text-text-subtle">No celular ou no computador, cada aluno vê só se acertou e os pontos. A explicação fica aqui.</p>
        <button type="button" onClick={() => prof.proxima()} className="rounded-full bg-text px-8 py-3.5 font-semibold text-white hover:opacity-90">
          {ultima ? "Ver o resultado final →" : "Próxima pergunta →"}
        </button>
      </footer>
    </div>
  );
}

function Ganho({ valor }: { valor: number }) {
  return (
    <span className={`w-16 rounded-full py-0.5 text-center text-[13px] font-bold tabular-nums ${valor > 0 ? "bg-[#E3F5EA] text-[#1E7A47]" : "bg-bg-subtle text-text-subtle"}`}>
      +{valor}
    </span>
  );
}

/* ---------- P5 e P6 · Fim: Pódio e Turma ---------- */

function Fim({ e, prof, onFechar }: { e: EstadoDoProfessor; prof: SalaDoProfessor; onFechar: () => void }) {
  const [aba, setAba] = useState<"podio" | "turma">("podio");
  return (
    <div className="flex min-h-dvh flex-col">
      <Topo direita={<button type="button" onClick={onFechar} className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black/[.03]">Fechar sala</button>}>
        <span className="font-semibold">
          Fim do quiz · {e.plano.length} perguntas
        </span>
      </Topo>
      <div className="mx-auto mt-6 flex rounded-full bg-bg-subtle p-1" role="tablist">
        {(["podio", "turma"] as const).map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            type="button"
            onClick={() => setAba(a)}
            className={`rounded-full px-8 py-2 text-[15px] ${aba === a ? "border border-black/10 bg-white font-semibold" : "text-text-muted"}`}
          >
            {a === "podio" ? "Pódio" : "Turma"}
          </button>
        ))}
      </div>
      {aba === "podio" ? <Podio e={e} prof={prof} /> : <Turma e={e} prof={prof} />}
    </div>
  );
}

const acertosDe = (a: AlunoNaSala) => a.respostas.filter((r) => r?.certo).length;

function Podio({ e, prof }: { e: EstadoDoProfessor; prof: SalaDoProfessor }) {
  const lista = classificar(e.alunos.map((a) => ({ ...a, acertos: acertosDe(a) })));
  // até 3 degraus: cada posição diferente vira um degrau, com todos os empatados nele
  const posicoes = [...new Set(lista.map((x) => x.posicao))].filter((p) => p <= 3).slice(0, 3);
  const degraus = posicoes.map((pos) => ({ pos, quem: lista.filter((x) => x.posicao === pos) }));
  const ordemVisual = [degraus[1], degraus[0], degraus[2]];
  const altura = [180, 240, 140];
  const raiz = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!raiz.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline().from("[data-degrau]", { scaleY: 0, transformOrigin: "bottom", duration: 0.5, stagger: 0.15, ease: "power2.out" });
    }, raiz);
    return () => ctx.revert();
  }, []);

  const maisErradas = useMemo(
    () =>
      e.plano
        .map((item, i) => {
          const vieram = e.alunos.filter((a) => a.respostas[i]);
          return { i, item, acertos: vieram.filter((a) => a.respostas[i]!.certo).length, de: vieram.length };
        })
        .filter((x) => x.de > 0)
        .sort((a, b) => a.acertos / a.de - b.acertos / b.de)
        .slice(0, 3),
    [e],
  );

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
      <div ref={raiz} className="flex items-end justify-center gap-4">
        {ordemVisual.map((d, i) =>
          d ? (
            <div key={`degrau-${d.pos}`} className="flex w-[30%] max-w-64 flex-col items-center text-center">
              <p className="text-lg font-bold break-words">{juntarNomes(d.quem.slice(0, 3).map((x) => x.apelido))}{d.quem.length > 3 ? ` e mais ${d.quem.length - 3}` : ""}</p>
              <p className="mb-2 text-sm text-text-muted">
                {d.quem[0].acertos} de {e.plano.length} · {d.quem[0].pontos}
              </p>
              <div data-degrau className={`grid w-full place-items-center rounded-t-2xl text-4xl font-bold ${d.pos === 1 ? "bg-aqua text-aqua-on" : "bg-aqua-50 text-aqua-ink"}`} style={{ height: altura[i] }}>
                {ordinal(d.pos)}
              </div>
            </div>
          ) : (
            <div key={`vazio-${i}`} className="w-[30%] max-w-64" />
          ),
        )}
      </div>
      {degraus.some((d) => d.quem.length > 1) && (
        <p className="mt-4 text-center text-sm text-text-muted">Empate divide a posição: quem tem os mesmos pontos fica no mesmo degrau.</p>
      )}
      <section className="mt-10">
        <h2 className="text-xs font-semibold tracking-[0.1em] text-text-muted">AS PERGUNTAS QUE A TURMA MAIS ERROU</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {maisErradas.map(({ i, item, acertos, de }) => (
            <li key={i} className="rounded-2xl border border-black/[.08] bg-[#FAFAFA] p-4">
              <p className="text-sm font-semibold text-aqua-ink">
                {i + 1} · {nomeAssunto(item.assunto)}
              </p>
              <p className="mt-1 text-[15px]">{prof.perguntaDe(i).geral}</p>
              <p className="mt-2 text-sm text-text-muted">
                {acertos} de {de} acertaram
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Turma({ e, prof }: { e: EstadoDoProfessor; prof: SalaDoProfessor }) {
  const [ordem, setOrdem] = useState<"acertos" | "erros" | "apelido">("acertos");
  const [aberto, setAberto] = useState<string | null>(null);
  const alunos = [...e.alunos].sort((a, b) =>
    ordem === "apelido" ? a.apelido.localeCompare(b.apelido, "pt-BR") : ordem === "acertos" ? acertosDe(b) - acertosDe(a) : acertosDe(a) - acertosDe(b),
  );
  const piores = [...e.alunos].sort((a, b) => acertosDe(a) - acertosDe(b)).slice(0, 2).filter((a) => acertosDe(a) < e.plano.length);
  const escolhido = e.alunos.find((a) => a.id === aberto) ?? null;

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="rounded-xl bg-[#FFF4E8] px-5 py-3 text-[15px] font-semibold text-[#CE6A1F]">⚠ Esta aba mostra os erros de cada aluno. Cuidado ao projetar.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {piores.length > 0 && <span className="text-[15px] font-semibold">Quem errou mais:</span>}
          {piores.map((a) => (
            <span key={a.id} className="rounded-full bg-[#FDECEC] px-4 py-1.5 text-sm font-semibold text-[#B84040]">
              {a.apelido} · {acertosDe(a)} de {e.plano.length}
            </span>
          ))}
          <label className="ml-auto text-sm text-text-muted">
            Ordem:{" "}
            <select value={ordem} onChange={(ev) => setOrdem(ev.target.value as typeof ordem)} className="rounded-lg border border-black/10 bg-white px-2 py-1">
              <option value="acertos">mais acertos</option>
              <option value="erros">mais erros</option>
              <option value="apelido">apelido</option>
            </select>
          </label>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {alunos.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setAberto(a.id === aberto ? null : a.id)}
                className={`w-full rounded-2xl border p-5 text-left ${a.id === aberto ? "border-2 border-aqua-ink bg-aqua-50" : "border-black/[.08] bg-[#FAFAFA] hover:bg-black/[.02]"}`}
              >
                <span className="block truncate text-lg font-bold">{a.apelido}</span>
                <span className="block text-[13px] text-text-muted">
                  {acertosDe(a)} de {e.plano.length} · {a.pontos}
                </span>
                <span className="mt-4 flex flex-wrap gap-1" aria-label="Cada quadradinho é uma pergunta: verde acertou, vermelho errou, cinza não respondeu">
                  {e.plano.map((_, i) => {
                    const r = a.respostas[i];
                    return <span key={i} className={`size-4 rounded ${!r ? "bg-black/[.08]" : r.certo ? "bg-[#1E9E5A]" : "bg-[#E5736F]"}`} />;
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-text-subtle">Cada quadradinho é uma pergunta, da 1 à {e.plano.length}: verde acertou, vermelho errou, cinza não estava. Clique no card para ver as respostas.</p>
      </div>
      {escolhido && <DetalheDoAluno aluno={escolhido} e={e} prof={prof} onFechar={() => setAberto(null)} />}
    </main>
  );
}

function DetalheDoAluno({ aluno, e, prof, onFechar }: { aluno: AlunoNaSala; e: EstadoDoProfessor; prof: SalaDoProfessor; onFechar: () => void }) {
  const primeiroErro = aluno.respostas.findIndex((r) => r && !r.certo);
  const [aberta, setAberta] = useState<number | null>(primeiroErro >= 0 ? primeiroErro : null);
  return (
    <aside className="h-fit rounded-[24px] border border-black/[.08] bg-white p-6 lg:sticky lg:top-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{aluno.apelido}</h2>
          <p className="text-sm text-text-muted">
            {acertosDe(aluno)} de {e.plano.length} · {aluno.pontos}
          </p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="text-xl text-text-subtle hover:text-text">
          ×
        </button>
      </div>
      <ul className="mt-4 flex flex-col border-t border-black/[.08] pt-3">
        {e.plano.map((item, i) => {
          const r = aluno.respostas[i];
          const p = r ? prof.perguntaDe(i, aluno.id) : null;
          return (
            <li key={i}>
              <button type="button" disabled={!r} onClick={() => setAberta(aberta === i ? null : i)} className="flex w-full items-center gap-2 py-2 text-left text-sm disabled:text-text-subtle">
                <span className={`flex-1 ${aberta === i ? "font-bold" : ""}`}>
                  {i + 1} · {nomeAssunto(item.assunto)}
                </span>
                <span className={`font-bold ${!r ? "" : r.certo ? "text-[#1E9E5A]" : "text-[#E5736F]"}`}>{!r ? "—" : r.certo ? "✓" : "✗"}</span>
                <span className="w-12 text-right text-text-subtle">{r?.segundos != null ? `${Math.round(r.segundos)} s` : ""}</span>
              </button>
              {aberta === i && r && p && (
                <div className="mb-2 rounded-xl border border-black/[.08] bg-[#FAFAFA] p-4 text-[13px]">
                  <p className="text-text-muted">{p.enunciado}</p>
                  <p className={`mt-3 font-semibold ${r.certo ? "text-[#1E7A47]" : "text-[#B84040]"}`}>Respondeu: {textoDaResposta(p, r.resposta)}</p>
                  {!r.certo && <p className="mt-1 font-semibold text-[#1E7A47]">A certa: {textoDaCerta(p)}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-text-subtle">O tempo é só para o professor ver; não muda os pontos.</p>
    </aside>
  );
}
