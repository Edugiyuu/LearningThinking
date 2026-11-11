import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AulaDaUrl from "@/components/tutoriais/AulaDaUrl";
import { buscarTutorial, tutoriais } from "@/lib/tutoriais";

// Só as aulas daqui viram páginas (o site é estático, sem servidor para criar outras).
export function generateStaticParams() {
  return tutoriais.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tutoriais/[slug]">): Promise<Metadata> {
  const t = buscarTutorial((await params).slug);
  return { title: t ? `${t.titulo} · Tutoriais · LearningThinking` : "Tutoriais · LearningThinking" };
}

export default async function Page({ params }: PageProps<"/tutoriais/[slug]">) {
  const tutorial = buscarTutorial((await params).slug);
  if (!tutorial) notFound();
  // O passo vem da URL (?passo=3). O site é estático (GitHub Pages, ADR-0033), então quem lê
  // a URL é o navegador (AulaDaUrl); até lá aparece a moldura da aula.
  return (
    <Suspense fallback={<Carregando />}>
      <AulaDaUrl tutorial={tutorial} />
    </Suspense>
  );
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
