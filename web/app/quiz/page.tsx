"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aqua } from "@/components/mascote";
import { TopoSite } from "@/components/topo-site";
import { codigoValido, normalizarCodigo } from "@/lib/quiz/quiz";

// Quiz ao vivo (ADR-0034): uma aba própria, sem nada do laboratório ("quiz é quiz e lab é lab").
// P0: dois caminhos, Criar sala (professor) e Entrar numa sala (aluno).

const QuizProfessor = dynamic(() => import("@/components/quiz/QuizProfessor"), { ssr: false, loading: () => <div className="min-h-dvh" /> });

export default function Quiz() {
  const [professor, setProfessor] = useState(false);
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  if (professor) return <QuizProfessor onVoltar={() => setProfessor(false)} />;

  return (
    <>
      <TopoSite ativo="quiz" />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-10 pb-20 sm:px-6 xl:px-0">
        <p className="text-sm font-semibold text-aqua-ink">Quiz em sala</p>
        <h1 className="mt-2 text-[clamp(40px,5vw,56px)] leading-tight font-semibold tracking-[-0.02em]">Quiz ao vivo</h1>
        <p className="mt-3 max-w-[760px] text-lg text-text-muted">
          O professor abre uma sala e a turma responde no computador, todos ao mesmo tempo. Os números e as cores mudam a cada quiz: não dá para decorar.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="flex flex-col rounded-[24px] border border-black/[.08] bg-bg-subtle p-8">
            <p className="text-xs font-semibold tracking-[0.1em] text-text-muted">PROFESSOR</p>
            <h2 className="mt-3 text-3xl font-semibold">Criar sala</h2>
            <p className="mt-3 text-text-muted">
              Escolha o tema, quantas perguntas e o tempo. A sala abre nesta aba, com o código para projetar.
            </p>
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4">
              <Aqua unidade={5} />
              <span className="text-sm text-text-muted">código da sala</span>
              <span className="ml-auto font-mono text-2xl font-bold tracking-[0.15em] text-black/20">K7M2QX</span>
            </div>
            <button type="button" onClick={() => setProfessor(true)} className="mt-6 self-start rounded-full bg-text px-10 py-4 font-semibold text-white hover:opacity-90">
              Criar sala
            </button>
          </section>

          <section className="flex flex-col rounded-[24px] border border-aqua bg-aqua-50 p-8">
            <p className="text-xs font-semibold tracking-[0.1em] text-aqua-ink">ALUNO</p>
            <h2 className="mt-3 text-3xl font-semibold">Entrar numa sala</h2>
            <p className="mt-3 text-text-muted">Digite o código da sala que aparece no projetor.</p>
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/quiz/entrar/?codigo=${codigo}`);
              }}
            >
              <input
                aria-label="Código da sala"
                value={codigo}
                onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
                placeholder="Código da sala"
                autoCapitalize="characters"
                autoComplete="off"
                className="h-14 min-w-0 flex-1 rounded-2xl border-[1.5px] border-black/15 bg-white px-4 font-mono text-2xl font-bold tracking-[0.2em] uppercase outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:border-aqua-ink focus:ring-4 focus:ring-aqua/30"
              />
              <button type="submit" disabled={!codigoValido(codigo)} className="h-14 rounded-full bg-text px-10 font-semibold text-white hover:opacity-90 disabled:opacity-30">
                Entrar
              </button>
            </form>
          </section>
        </div>

        <p className="mt-8 text-sm text-text-subtle">Nada fica guardado: quando a sala fecha, as respostas somem.</p>
      </main>
    </>
  );
}
