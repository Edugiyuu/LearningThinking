import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Aula from "@/components/tutoriais/Aula";
import { buscarTutorial, totalDePassos, tutoriais } from "@/lib/tutoriais";

export function generateStaticParams() {
  return tutoriais.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tutoriais/[slug]">): Promise<Metadata> {
  const t = buscarTutorial((await params).slug);
  return { title: t ? `${t.titulo} · Tutoriais · LearningThinking` : "Tutoriais · LearningThinking" };
}

export default function Page({ params, searchParams }: PageProps<"/tutoriais/[slug]">) {
  // O passo vem da URL (?passo=3); a leitura fica atrás do Suspense, como pede o Cache Components
  return (
    <Suspense fallback={<Carregando />}>
      <AulaDaUrl params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AulaDaUrl({ params, searchParams }: Pick<PageProps<"/tutoriais/[slug]">, "params" | "searchParams">) {
  const tutorial = buscarTutorial((await params).slug);
  if (!tutorial) notFound();
  const bruto = Number((await searchParams).passo);
  const passo = Number.isInteger(bruto) ? Math.min(Math.max(1, bruto), totalDePassos(tutorial)) : 1;
  return <Aula tutorial={tutorial} passoInicial={passo} />;
}

/** Enquanto o passo da URL chega: a moldura da aula, sem nada que salve progresso. */
function Carregando() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="h-16 border-b border-black/[.06]" />
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="h-full min-h-[320px] rounded-[24px] bg-bg-subtle" />
      </div>
    </div>
  );
}
