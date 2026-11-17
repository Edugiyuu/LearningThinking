"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Menu do topo no celular (ADR-0035, A6; frame "Celular · Menu do topo aberto" no Figma).
// No computador o menu fica na barra; no celular ele abre um painel embaixo dela.

type Item = { id: string; href: string; rotulo: string };

export function MenuCelular({ itens, ativo }: { itens: readonly Item[]; ativo?: string }) {
  const [aberto, setAberto] = useState(false);

  // Esc fecha o menu
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls="menu-celular"
        className="rounded-full border border-black/10 bg-black/[.04] px-4 py-2 text-sm font-medium"
      >
        {aberto ? "Fechar ✕" : "Menu ☰"}
      </button>
      {aberto && (
        <>
          <div aria-hidden className="fixed inset-x-0 top-20 bottom-0 z-40 bg-black/25" onClick={() => setAberto(false)} />
          <nav id="menu-celular" className="fixed inset-x-0 top-20 z-50 bg-white px-6 pt-2 pb-6 shadow-sm">
            <ul>
              {itens.map((i) => (
                <li key={i.id} className="border-b border-black/[.08]">
                  <Link
                    href={i.href}
                    aria-current={i.id === ativo ? "page" : undefined}
                    className={`block py-3.5 text-lg ${i.id === ativo ? "font-semibold text-aqua-ink" : "font-medium"}`}
                    onClick={() => setAberto(false)}
                  >
                    {i.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/novo-projeto"
              className="mt-6 block rounded-full bg-text py-4 text-center text-base font-semibold text-white"
              onClick={() => setAberto(false)}
            >
              Criar novo projeto
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
