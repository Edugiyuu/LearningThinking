"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Aqua } from "@/components/mascote";
import { projetoAberto } from "@/lib/projetos";

// O laboratório lê o projeto e a montagem do localStorage, que só existe no navegador.
const Lab = dynamic(() => import("@/components/laboratorio/Lab"), {
  ssr: false,
  loading: () => <div className="h-screen bg-bg-subtle" />,
});

const TELA_PEQUENA = "(max-width: 767px)";

export default function Laboratorio() {
  // lido uma vez só: o mesmo objeto durante toda a visita
  const [projeto] = useState(() => (typeof window === "undefined" ? null : (projetoAberto() ?? null)));
  // o lab é só para computador (ADR-0020): no celular, um aviso antes (ADR-0035, A6)
  const [pequena, setPequena] = useState(false);
  const [mesmoAssim, setMesmoAssim] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(TELA_PEQUENA);
    const ver = () => setPequena(m.matches);
    ver();
    m.addEventListener("change", ver);
    return () => m.removeEventListener("change", ver);
  }, []);

  if (pequena && !mesmoAssim) return <AvisoComputador onMesmoAssim={() => setMesmoAssim(true)} />;
  return <Lab projeto={projeto} />;
}

/** Frame "Celular · Laboratório: melhor no computador" no Figma. */
function AvisoComputador({ onMesmoAssim }: { onMesmoAssim: () => void }) {
  return (
    <>
      <header className="flex h-20 items-center px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="LearningThinking, início">
          <Aqua unidade={4} />
          <span className="text-lg font-semibold">LearningThinking</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center px-6 pt-20 pb-12 text-center">
        <Aqua pose="contente" unidade={8} />
        <h1 className="mt-8 text-[26px] leading-[1.2] font-bold">O laboratório é feito para o computador</h1>
        <p className="mt-4 text-base text-text-muted">
          Ele precisa de espaço para a rede, os blocos e as contas lado a lado. Abra este endereço num computador. No celular, dá para ver os
          tutoriais.
        </p>
        <Link href="/tutoriais" className="mt-8 block w-full rounded-full bg-aqua py-4 text-base font-semibold text-aqua-on">
          Ver tutoriais
        </Link>
        <Link href="/" className="mt-3 block w-full rounded-full border border-black/15 py-4 text-base font-medium">
          Voltar para o início
        </Link>
        <button type="button" onClick={onMesmoAssim} className="mt-6 text-sm font-medium text-aqua-ink underline-offset-4 hover:underline">
          Abrir o laboratório mesmo assim
        </button>
      </main>
    </>
  );
}
