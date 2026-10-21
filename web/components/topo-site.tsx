import Link from "next/link";
import { Aqua } from "@/components/mascote";

/** Barra das páginas do site (Home, Tutoriais): logo, menu e "Criar novo projeto". */
export function TopoSite({ ativo }: { ativo?: "laboratorio" | "tutoriais" | "sobre" }) {
  const itens = [
    { id: "laboratorio", href: "/laboratorio", rotulo: "Laboratório" },
    { id: "tutoriais", href: "/tutoriais", rotulo: "Tutoriais" },
    { id: "sobre", href: "/sobre", rotulo: "Sobre" },
  ] as const;
  return (
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
      <Link
        href="/novo-projeto"
        className="hidden rounded-full border border-black/10 bg-black/[.04] px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-black/[.07] sm:inline-block"
      >
        Criar novo projeto
      </Link>
    </header>
  );
}
