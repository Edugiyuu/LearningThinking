"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopoSimples } from "@/components/topo-simples";
import { criarProjeto, type Inicio, type Tema } from "@/lib/projetos";

// Tela "Novo projeto", igual ao frame "Novo projeto · Desktop" do Figma (ADR-0014 e ADR-0018).

const temas: { id: Tema; titulo: string; texto: string; disponivel: boolean; Icone: () => React.ReactElement }[] = [
  {
    id: "redes-neurais",
    titulo: "Redes neurais",
    texto: "Monte camadas de neurônios e veja, conta por conta, uma cor virar resposta.",
    disponivel: true,
    Icone: IconeRede,
  },
  {
    id: "busca-por-significado",
    titulo: "Busca por significado",
    texto: "Transforme frases em números e encontre textos parecidos.",
    disponivel: false,
    Icone: IconePontos,
  },
  {
    id: "rag",
    titulo: "RAG",
    texto: "Veja a IA consultar documentos antes de responder.",
    disponivel: false,
    Icone: IconeDocumentos,
  },
];

const inicios: { id: Inicio; titulo: string; texto: string; Miniatura: () => React.ReactElement }[] = [
  {
    id: "basico",
    titulo: "Básico pronto",
    texto: "Uma rede que já separa azul de laranja. Bom para o primeiro contato.",
    Miniatura: MiniaturaBasico,
  },
  {
    id: "vazio",
    titulo: "Vazio",
    texto: "Só o canvas e os blocos. Monte do seu jeito.",
    Miniatura: MiniaturaVazio,
  },
];

export default function NovoProjeto() {
  const router = useRouter();
  const [tema, setTema] = useState<Tema>("redes-neurais");
  const [inicio, setInicio] = useState<Inicio>("basico");
  const [nome, setNome] = useState("Meu primeiro projeto");

  function criar(e: React.FormEvent) {
    e.preventDefault();
    criarProjeto({ nome, tema, inicio });
    router.push("/laboratorio");
  }

  return (
    <>
      <TopoSimples />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 pt-8 pb-16 sm:px-6 lg:px-0">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-aqua/70 bg-aqua/15 px-7 py-1.5 text-[13px] text-aqua-ink">
            Novo projeto
          </span>
          <h1 className="mt-5 text-[32px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[44px]">
            O que você quer montar?
          </h1>
          <p className="mt-2 text-base text-text-muted">
            Escolha o tema e como começar. Dá para mudar tudo depois, no laboratório.
          </p>
        </div>

        <form onSubmit={criar} className="mt-12">
          <fieldset>
            <legend className="text-[13px] font-bold text-aqua-ink">1 · Tema</legend>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {temas.map(({ id, titulo, texto, disponivel, Icone }) => {
                const marcado = tema === id;
                return (
                  <label
                    key={id}
                    className={`relative flex min-h-[200px] flex-col justify-between rounded-[20px] border-2 p-7 transition-colors ${
                      marcado
                        ? "border-aqua bg-aqua-50"
                        : disponivel
                          ? "cursor-pointer border-black/[.08] hover:border-black/20"
                          : "cursor-not-allowed border-black/[.08]"
                    } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}
                  >
                    <input
                      type="radio"
                      name="tema"
                      value={id}
                      checked={marcado}
                      disabled={!disponivel}
                      onChange={() => setTema(id)}
                      className="sr-only"
                    />
                    {marcado && <Marca className="absolute top-5 right-5" />}
                    {!disponivel && (
                      <span className="absolute top-[18px] right-5 rounded-full bg-bg-subtle px-4 py-1 text-[11px] font-bold text-text-muted">
                        Em breve
                      </span>
                    )}
                    <Icone />
                    <span>
                      <span className={`block text-xl font-bold ${disponivel ? "" : "text-text-subtle"}`}>{titulo}</span>
                      <span
                        className={`mt-1.5 block max-w-[260px] text-[13px] leading-[1.4] ${
                          disponivel ? "text-text-muted" : "text-text-subtle"
                        }`}
                      >
                        {texto}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-9">
            <legend className="text-[13px] font-bold text-aqua-ink">2 · Como começar</legend>
            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
              {inicios.map(({ id, titulo, texto, Miniatura }) => {
                const marcado = inicio === id;
                return (
                  <label
                    key={id}
                    className={`relative flex cursor-pointer flex-col gap-6 rounded-[20px] border-2 p-[18px] transition-colors sm:flex-row sm:items-center ${
                      marcado ? "border-aqua bg-aqua-50" : "border-black/[.08] hover:border-black/20"
                    } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}
                  >
                    <input
                      type="radio"
                      name="inicio"
                      value={id}
                      checked={marcado}
                      onChange={() => setInicio(id)}
                      className="sr-only"
                    />
                    {marcado && <Marca className="absolute top-5 right-5" />}
                    <Miniatura />
                    <span className="pr-8">
                      <span className="block text-lg font-bold">{titulo}</span>
                      <span className="mt-2 block max-w-[220px] text-[13px] leading-[1.4] text-text-muted">{texto}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-11 flex flex-col gap-6 border-t border-black/[.08] pt-6 sm:flex-row sm:items-end sm:justify-between">
            <label className="block w-full max-w-[420px]">
              <span className="text-xs text-text-muted">Nome do projeto</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={60}
                className="mt-2.5 block h-12 w-full rounded-lg border border-black/15 px-4 text-[15px] outline-none focus:border-aqua-ink"
              />
            </label>
            <div className="flex items-center justify-end gap-6">
              <Link href="/" className="text-[15px] text-text-muted hover:text-text">
                Cancelar
              </Link>
              <button
                type="submit"
                className="h-12 rounded-full bg-aqua px-7 text-[15px] font-bold text-aqua-on transition-opacity hover:opacity-90"
              >
                Criar projeto →
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

function Marca({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#0E7C86" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeRede() {
  const entradas = [16, 38, 60];
  const meio = [28, 48];
  return (
    <svg width="104" height="64" viewBox="0 0 104 76" aria-hidden>
      {entradas.flatMap((y1) =>
        meio.map((y2) => <line key={`${y1}-${y2}`} x1={8} y1={y1} x2={48} y2={y2} stroke="#C7C7CC" strokeWidth={2} />),
      )}
      <line x1={8} y1={16} x2={48} y2={28} stroke="#5ED3DB" strokeWidth={3} />
      <line x1={48} y1={28} x2={88} y2={38} stroke="#5ED3DB" strokeWidth={3} />
      <line x1={48} y1={48} x2={88} y2={38} stroke="#C7C7CC" strokeWidth={2} />
      {entradas.map((y) => (
        <circle key={y} cx={8} cy={y} r={6} fill="#1D1D1F" />
      ))}
      {meio.map((y) => (
        <circle key={y} cx={48} cy={y} r={7} fill="#1D1D1F" />
      ))}
      <circle cx={88} cy={38} r={10} fill="#5ED3DB" stroke="#0E7C86" strokeWidth={2} />
    </svg>
  );
}

function IconePontos() {
  return (
    <svg width="104" height="64" viewBox="0 0 104 76" aria-hidden>
      <line x1={26} y1={20} x2={34} y2={36} stroke="#A1A1A6" strokeWidth={1.5} />
      {[
        [12, 30],
        [26, 20],
        [34, 36],
        [72, 10],
        [80, 44],
        [60, 52],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="#C7C7CC" />
      ))}
    </svg>
  );
}

function IconeDocumentos() {
  return (
    <svg width="104" height="64" viewBox="0 0 104 76" aria-hidden>
      <rect x={1} y={10} width={34} height={44} rx={5} fill="#F5F5F7" stroke="#C7C7CC" strokeWidth={1.5} />
      <rect x={18} y={18} width={34} height={44} rx={5} fill="#FFFFFF" stroke="#C7C7CC" strokeWidth={1.5} />
      {[32, 40, 48].map((y) => (
        <line key={y} x1={27} y1={y} x2={43} y2={y} stroke="#C7C7CC" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function MiniaturaBasico() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      className="h-auto w-full shrink-0 rounded-[14px] bg-white sm:w-[200px]"
      aria-hidden
    >
      <rect x={12} y={26} width={36} height={56} rx={6} fill="#fff" stroke="#C7C7CC" strokeWidth={1.5} />
      {[44, 58, 72].map((y) => (
        <circle key={y} cx={38} cy={y} r={4} fill={y === 44 ? "#5ED3DB" : "#fff"} stroke="#5ED3DB" strokeWidth={1.5} />
      ))}
      <path d="M48 34 Q60 34 68 48" stroke="#8E8E93" strokeDasharray="3 3" fill="none" strokeWidth={1.2} />
      <rect x={68} y={38} width={32} height={46} rx={6} fill="#fff" stroke="#5ED3DB" strokeWidth={2} />
      {[56, 72].map((y) => (
        <circle key={y} cx={84} cy={y} r={5} fill="#fff" stroke="#0E7C86" strokeWidth={1.5} />
      ))}
      <path d="M100 48 Q112 48 120 56" stroke="#8E8E93" strokeDasharray="3 3" fill="none" strokeWidth={1.2} />
      <rect x={120} y={52} width={28} height={28} rx={6} fill="#fff" stroke="#5ED3DB" strokeWidth={2} />
      <circle cx={134} cy={66} r={5} fill="#fff" stroke="#0E7C86" strokeWidth={1.5} />
      <path d="M148 64 H156" stroke="#8E8E93" strokeDasharray="3 3" strokeWidth={1.2} />
      <rect x={156} y={50} width={32} height={32} rx={6} fill="#fff" stroke="#C7C7CC" strokeWidth={1.5} />
      <rect x={164} y={58} width={16} height={16} rx={3} fill="#E8853A" />
    </svg>
  );
}

function MiniaturaVazio() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      className="h-auto w-full shrink-0 sm:w-[200px]"
      aria-hidden
    >
      <rect x={1} y={1} width={198} height={118} rx={8} fill="#F5F5F7" stroke="#C7C7CC" strokeDasharray="4 4" />
      <path d="M100 48 V72 M88 60 H112" stroke="#8E8E93" strokeWidth={1.5} />
    </svg>
  );
}
