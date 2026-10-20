import type { Montagem } from "@/lib/rede";

// Projetos salvos no navegador (localStorage), com número de versão do formato (ADR-0017).

export type Tema = "redes-neurais" | "busca-por-significado" | "rag";
export type Inicio = "basico" | "vazio";

export type Projeto = {
  versao: 1;
  id: string;
  nome: string;
  tema: Tema;
  inicio: Inicio;
  criadoEm: string;
};

const CHAVE_PROJETOS = "learningthinking:projetos";
const CHAVE_ABERTO = "learningthinking:projeto-aberto";

function ler(): Projeto[] {
  try {
    const bruto = localStorage.getItem(CHAVE_PROJETOS);
    const lista = bruto ? (JSON.parse(bruto) as Projeto[]) : [];
    return Array.isArray(lista) ? lista.filter((p) => p.versao === 1) : [];
  } catch {
    return [];
  }
}

export function listarProjetos(): Projeto[] {
  return ler();
}

export function criarProjeto(dados: Pick<Projeto, "nome" | "tema" | "inicio">): Projeto {
  const projeto: Projeto = {
    versao: 1,
    id: crypto.randomUUID(),
    nome: dados.nome.trim() || "Projeto sem nome",
    tema: dados.tema,
    inicio: dados.inicio,
    criadoEm: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CHAVE_PROJETOS, JSON.stringify([...ler(), projeto]));
    localStorage.setItem(CHAVE_ABERTO, projeto.id);
  } catch {
    // Sem localStorage (aba anônima, armazenamento cheio): o projeto vale só nesta visita.
  }
  return projeto;
}

export function projetoAberto(): Projeto | undefined {
  try {
    const id = localStorage.getItem(CHAVE_ABERTO);
    return ler().find((p) => p.id === id);
  } catch {
    return undefined;
  }
}

/* ---------- A montagem do laboratório de cada projeto ---------- */

const chaveMontagem = (id: string) => `learningthinking:montagem:${id}`;

export function lerMontagem(id: string): Montagem | null {
  try {
    const bruto = localStorage.getItem(chaveMontagem(id));
    const salvo = bruto ? JSON.parse(bruto) : null;
    return salvo?.versao === 1 ? (salvo.montagem as Montagem) : null;
  } catch {
    return null;
  }
}

/** Guarda só o que importa: sem seleção nem estado de arraste. */
export function salvarMontagem(id: string, m: Montagem): boolean {
  const nodes = m.nodes.map(({ selected, dragging, ...n }) => (void selected, void dragging, n));
  const fios = m.fios.map(({ selected, ...f }) => (void selected, f));
  try {
    localStorage.setItem(chaveMontagem(id), JSON.stringify({ versao: 1, montagem: { nodes, fios, pesos: m.pesos } }));
    return true;
  } catch {
    return false;
  }
}
