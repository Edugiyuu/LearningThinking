import Link from "next/link";
import { Aqua } from "@/components/mascote";
import { MenuCelular } from "@/components/menu-celular";

/**
 * Barra das páginas do site (Home, Tutoriais, Quiz ao vivo): logo, menu e "Criar novo projeto".
 * `fixo`: a barra fica presa no topo da tela enquanto a página rola (a Home, ADR-0038), para o
 * laboratório e os tutoriais estarem sempre a um clique, sem subir a página toda.
 */
export function TopoSite({ ativo, fixo = false }: { ativo?: "laboratorio" | "tutoriais" | "quiz"; fixo?: boolean }) {
  const itens = [
    { id: "laboratorio", href: "/projetos", rotulo: "Laboratório" }, // a lista "Meus projetos" (ADR-0035, B6)
    { id: "tutoriais", href: "/tutoriais", rotulo: "Tutoriais" },
    { id: "quiz", href: "/quiz", rotulo: "Quiz ao vivo" },
  ] as const;
  const barra = (
    <header className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 xl:px-0">
      <Link href="/" className="flex items-center gap-2" aria-label="LearningThinking, início">
        <Aqua unidade={4} />
        <span className="text-lg font-semibold">LearningThinking</span>
      </Link>
      <nav className="hidden gap-10 text-[15px] text-text-muted md:flex">
        {itens.map((i) =>
          i.id === ativo ? (
            <Link key={i.id} href={i.href} aria-current="page" className="relative font-semibold text-text">
              {i.rotulo}
              <span aria-hidden className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-aqua" />
            </Link>
          ) : (
            <Link key={i.id} href={i.href} className="hover:text-text">
              {i.rotulo}
            </Link>
          ),
        )}
      </nav>
      <MenuCelular itens={itens} ativo={ativo} />
      <Link
        href="/novo-projeto"
        className="hidden rounded-full border border-black/10 bg-black/[.04] px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-black/[.07] md:inline-block"
      >
        Criar novo projeto
      </Link>
    </header>
  );
  if (!fixo) return barra;
  return <div className="fixed inset-x-0 top-0 z-50 border-b border-black/[.06] bg-white/90">{barra}</div>;
}
