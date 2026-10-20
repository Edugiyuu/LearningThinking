import { useSyncExternalStore } from "react";

// Progresso nos tutoriais, guardado no navegador (localStorage), com versão do formato (ADR-0017).
// Passo 1 = primeira tela. Sem localStorage (aba anônima), o progresso vale só nesta visita.

export type ProgressoTutorial = { passo: number; concluido: boolean };
type Salvo = { versao: 1; tutoriais: Record<string, ProgressoTutorial> };

const CHAVE = "learningthinking:tutoriais";
const EVENTO = "learningthinking:tutoriais";

function lerBruto(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function interpretar(bruto: string | null): Record<string, ProgressoTutorial> {
  try {
    const salvo = bruto ? (JSON.parse(bruto) as Salvo) : null;
    return salvo?.versao === 1 ? salvo.tutoriais : {};
  } catch {
    return {};
  }
}

export function salvarProgresso(slug: string, p: ProgressoTutorial) {
  const atual = interpretar(lerBruto());
  // Concluído fica concluído, mesmo se o aluno voltar para rever um passo
  const novo = { ...p, concluido: p.concluido || Boolean(atual[slug]?.concluido) };
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ versao: 1, tutoriais: { ...atual, [slug]: novo } } satisfies Salvo));
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    // sem armazenamento: segue sem salvar
  }
}

function assinar(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar); // outra aba
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

/** Progresso de todos os tutoriais. No servidor (e na primeira pintura) é vazio. */
export function useProgresso(): Record<string, ProgressoTutorial> {
  const bruto = useSyncExternalStore(assinar, lerBruto, () => null);
  return interpretar(bruto);
}
