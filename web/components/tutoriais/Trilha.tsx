"use client";

import Link from "next/link";
import { useProgresso } from "@/lib/progresso-tutoriais";
import { totalDePassos, tutoriais } from "@/lib/tutoriais";
import { Miniatura } from "./visuais";

// A trilha de Redes neurais (frame "Tutoriais · Desktop"): cards ligados por fios, como blocos do
// laboratório. O progresso vem do navegador; no servidor, tudo aparece como "não começado".

export function ProgressoDaTrilha() {
  const progresso = useProgresso();
  const feitos = tutoriais.filter((t) => progresso[t.slug]?.concluido).length;
  return (
    <div className="w-full max-w-[200px]">
      <p className="text-right text-[13px] font-medium text-text-muted">
        {feitos} de {tutoriais.length} concluídos
      </p>
      <div
        className="mt-2 h-1.5 rounded-full bg-[#E5E5EA]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={tutoriais.length}
        aria-valuenow={feitos}
        aria-label="Tutoriais concluídos"
      >
        <div className="h-full rounded-full bg-aqua transition-[width] duration-500" style={{ width: `${(feitos / tutoriais.length) * 100}%` }} />
      </div>
    </div>
  );
}

export function Trilha() {
  const progresso = useProgresso();
  // O card "da vez" é o primeiro que ainda não foi concluído
  const daVez = tutoriais.find((t) => !progresso[t.slug]?.concluido)?.slug;
  return (
    <ol className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {tutoriais.map((t, i) => {
        const p = progresso[t.slug];
        const concluido = Boolean(p?.concluido);
        const comecado = !concluido && (p?.passo ?? 1) > 1;
        const total = totalDePassos(t);
        const atual = t.slug === daVez;
        const href = comecado ? `/tutoriais/${t.slug}?passo=${p!.passo}` : `/tutoriais/${t.slug}`;
        return (
          <li key={t.slug} className="relative">
            {/* fio até o próximo card, só quando estão lado a lado */}
            {i < tutoriais.length - 1 && (
              <span aria-hidden className="absolute top-[112px] -right-6 z-10 hidden w-6 items-center xl:flex">
                <span className="size-2.5 shrink-0 -translate-x-1/2 rounded-full bg-aqua" />
                <span className="h-0 flex-1 border-t-2 border-dashed border-[#8E8E93]" />
                <span className="size-2.5 shrink-0 translate-x-1/2 rounded-full bg-aqua" />
              </span>
            )}
            <Link
              href={href}
              className={`group flex h-full flex-col rounded-[var(--radius-card)] p-3 transition-colors ${
                atual ? "border-2 border-aqua bg-aqua-50" : "border border-black/[.06] bg-bg-subtle hover:border-black/15"
              }`}
            >
              <div className="overflow-hidden rounded-2xl border border-black/[.06] bg-white">
                <Miniatura slug={t.slug} />
              </div>
              <div className="flex flex-1 flex-col px-3 pt-6 pb-3">
                <p className="text-sm font-semibold text-aqua-ink">{t.numero}</p>
                <h3 className="mt-2 text-[22px] font-semibold">{t.titulo}</h3>
                <p className="mt-2 text-[15px] text-text-muted">{t.descricao}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <span className="text-[13px] text-text-subtle">
                    {t.minutos} min{comecado ? ` · passo ${p!.passo} de ${total}` : ""}
                  </span>
                  {concluido ? (
                    <span className="rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-semibold text-[#0B8A5F]">Concluído ✓</span>
                  ) : atual ? (
                    <span className="rounded-full bg-aqua px-3 py-1 text-xs font-semibold text-aqua-on">
                      {comecado ? "Continuar →" : "Começar →"}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
