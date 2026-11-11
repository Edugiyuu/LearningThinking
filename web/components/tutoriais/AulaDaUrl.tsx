"use client";

import { useSearchParams } from "next/navigation";
import Aula from "@/components/tutoriais/Aula";
import { totalDePassos, type Tutorial } from "@/lib/tutoriais";

/** Lê o passo da URL (?passo=3) no navegador e abre a aula nele. Fica atrás de um Suspense. */
export default function AulaDaUrl({ tutorial }: { tutorial: Tutorial }) {
  const bruto = Number(useSearchParams().get("passo"));
  const passo = Number.isInteger(bruto) ? Math.min(Math.max(1, bruto), totalDePassos(tutorial)) : 1;
  return <Aula tutorial={tutorial} passoInicial={passo} />;
}
