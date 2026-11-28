// A conversa entre a aba Busca por significado e o Web Worker do modelo (ADR-0037).
// O modelo roda numa linha de execução separada para a tela não travar (ADR-0017).

/** O nome do modelo fica num lugar só: trocar pelo multilíngue é mudar esta linha (ADR-0037). */
export const MODELO = "Xenova/all-MiniLM-L6-v2";

/**
 * Onde os arquivos ficam no site (public/modelos/...), já com o basePath do GitHub Pages.
 * Caminho relativo ao site ("/modelos/"), não endereço completo: com "http://..." o
 * Transformers.js 4 pula a conferência dos arquivos locais e não acha o tokenizador.
 */
export function caminhoDosModelos(basePath: string): string {
  return `${basePath}/modelos/`;
}

/** O que sai do modelo para um texto: os tokens, 384 números por token e o embedding. */
export type ResultadoTexto = {
  texto: string;
  /** Os pedaços, com [CLS] e [SEP] (ex.: ["[CLS]", "key", "##ba", "##ord", "[SEP]"]). */
  tokens: string[];
  /** 384 números para cada token (a saída da última camada, antes da média). */
  porToken: number[][];
  /** A média dos tokens, normalizada: o embedding (384 números). */
  embedding: number[];
};

export type PedidoAoModelo =
  | { tipo: "carregar"; origem: string; basePath: string }
  | { tipo: "calcular"; id: number; textos: string[] };

export type RespostaDoModelo =
  | { tipo: "progresso"; carregado: number; total: number }
  | { tipo: "pronto" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "resultado"; id: number; itens: ResultadoTexto[] };
