"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Aqua } from "@/components/mascote";
import { TopoSimples } from "@/components/topo-simples";
import { projetoAberto, type Projeto } from "@/lib/projetos";

// Provisório: o laboratório em código é a próxima etapa (ADR-0019).
// Por enquanto mostra que o projeto criado na tela Novo projeto foi salvo.

const nada = () => () => {};
// O snapshot precisa ser estável entre chamadas, por isso volta como texto.
const lerAberto = () => JSON.stringify(projetoAberto() ?? null);

export default function Laboratorio() {
  const projeto = JSON.parse(useSyncExternalStore(nada, lerAberto, () => "null")) as Projeto | null;

  return (
    <>
      <TopoSimples />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <Aqua pose="contente" unidade={8} />
        <h1 className="text-3xl font-bold tracking-[-0.02em]">
          {projeto ? `“${projeto.nome}” foi criado.` : "Nenhum projeto aberto."}
        </h1>
        <p className="max-w-[460px] text-text-muted">
          O laboratório ainda está sendo construído em código. Seu projeto já está salvo neste navegador e vai abrir
          aqui assim que o laboratório chegar.
        </p>
        <Link href="/novo-projeto" className="rounded-full border border-black/15 px-7 py-3 text-[15px] font-medium">
          Criar outro projeto
        </Link>
      </main>
    </>
  );
}
