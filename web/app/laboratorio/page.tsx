"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { projetoAberto } from "@/lib/projetos";

// O laboratório lê o projeto e a montagem do localStorage, que só existe no navegador.
const Lab = dynamic(() => import("@/components/laboratorio/Lab"), {
  ssr: false,
  loading: () => <div className="h-screen bg-bg-subtle" />,
});

export default function Laboratorio() {
  // lido uma vez só: o mesmo objeto durante toda a visita
  const [projeto] = useState(() => (typeof window === "undefined" ? null : (projetoAberto() ?? null)));
  return <Lab projeto={projeto} />;
}
