import Link from "next/link";
import { Aqua } from "@/components/mascote";

/** Barra das telas internas: logo à esquerda e "Voltar para a Home" à direita. */
export function TopoSimples() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-black/[.06] px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2" aria-label="LearningThinking, início">
        <Aqua unidade={4} />
        <span className="text-[15px] font-bold">LearningThinking</span>
      </Link>
      <Link href="/" className="text-sm text-text-muted hover:text-text">
        ← Voltar para a Home
      </Link>
    </header>
  );
}
