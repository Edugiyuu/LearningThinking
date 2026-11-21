"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import { TopoSite } from "@/components/topo-site";
import { abrirProjeto, apagarProjeto, idDoAberto, listarProjetos, type Projeto } from "@/lib/projetos";

// Meus projetos (ADR-0035, B6; frame "Meus projetos · Desktop" no Figma): os projetos guardados
// neste navegador. "Laboratório" no menu chega aqui.

const NOME_TEMA: Record<Projeto["tema"], string> = { "redes-neurais": "Classificar", "busca-por-significado": "Busca por significado", rag: "RAG" };
const NOME_INICIO: Record<Projeto["inicio"], string> = { basico: "básico pronto", vazio: "vazio" };

function ListaDeProjetos() {
  const router = useRouter();
  const lerLista = () => listarProjetos().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const [lista, setLista] = useState<Projeto[]>(lerLista);
  const [aberto, setAberto] = useState<string | null>(idDoAberto);
  const recarregar = () => {
    setLista(lerLista());
    setAberto(idDoAberto());
  };

  // o último aberto vem primeiro
  const ordenada = [...lista].sort((a, b) => Number(b.id === aberto) - Number(a.id === aberto));

  const abrir = (id: string) => {
    abrirProjeto(id);
    router.push("/laboratorio");
  };
  const apagar = (p: Projeto) => {
    if (!window.confirm(`Apagar "${p.nome}"? A montagem e os pesos dele somem deste navegador, e não dá para desfazer.`)) return;
    apagarProjeto(p.id);
    recarregar();
  };

  return (
    <>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[44px]">Meus projetos</h1>
            <p className="mt-2 text-base text-text-muted">Ficam guardados neste navegador. Em outro computador, a lista começa vazia.</p>
          </div>
          <Link href="/novo-projeto" className="rounded-full bg-text px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90">
            Criar novo projeto
          </Link>
        </div>

        {ordenada.length === 0 && (
          <p className="mt-12 rounded-[20px] bg-bg-subtle p-8 text-text-muted">
            Nenhum projeto ainda. Clique em <b>Criar novo projeto</b> para montar a sua primeira rede.
          </p>
        )}

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ordenada.map((p) => {
            const ultimo = p.id === aberto;
            return (
              <li key={p.id} className={`flex flex-col rounded-[20px] border-2 p-7 ${ultimo ? "border-aqua bg-aqua-50" : "border-black/[.08]"}`}>
                {ultimo && <p className="text-[11px] font-bold tracking-[0.06em] text-aqua-ink">ÚLTIMO ABERTO</p>}
                <h2 className={`text-xl font-bold ${ultimo ? "mt-1" : ""}`}>{p.nome}</h2>
                <p className="mt-1.5 text-[13px] text-text-muted">
                  {NOME_TEMA[p.tema]} · {NOME_INICIO[p.inicio]} · criado em {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => abrir(p.id)}
                    className={`rounded-full px-6 py-2.5 text-sm font-semibold ${ultimo ? "bg-text text-white" : "border border-black/15 bg-white"}`}
                  >
                    Abrir →
                  </button>
                  <button type="button" onClick={() => apagar(p)} className="text-sm text-text-subtle hover:text-text">
                    Apagar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
    </>
  );
}

// a lista vem do localStorage, que só existe no navegador
const Lista = dynamic(() => Promise.resolve(ListaDeProjetos), { ssr: false });

export default function MeusProjetos() {
  return (
    <>
      <TopoSite ativo="laboratorio" />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-12 pb-20 sm:px-6 xl:px-0">
        <Lista />
      </main>
    </>
  );
}
