// Web Worker do modelo de embeddings (ADR-0037). Roda fora da tela para ela não travar.
// Tudo sai do próprio site: os arquivos do modelo e o motor do ONNX (nada de CDN nem Hugging Face).
import { AutoModel, AutoTokenizer, env, type PreTrainedModel, type PreTrainedTokenizer } from "@huggingface/transformers";
import { embeddingDosTokens } from "@/lib/significado";
import { MODELO, caminhoDosModelos, type PedidoAoModelo, type RespostaDoModelo, type ResultadoTexto } from "@/lib/significado-modelo";

let tokenizador: PreTrainedTokenizer | null = null;
let modelo: PreTrainedModel | null = null;

const enviar = (r: RespostaDoModelo) => self.postMessage(r);

async function carregar(origem: string, basePath: string) {
  const base = caminhoDosModelos(basePath);
  env.allowRemoteModels = false; // nunca buscar no Hugging Face
  env.allowLocalModels = true;
  env.localModelPath = base;
  const wasm = env.backends.onnx.wasm;
  if (wasm) {
    // o motor do ONNX precisa do endereço completo (ele carrega o .mjs com import())
    const motor = `${origem}${base}ort/`;
    wasm.wasmPaths = { mjs: `${motor}ort-wasm-simd-threaded.mjs`, wasm: `${motor}ort-wasm-simd-threaded.wasm` };
    wasm.numThreads = 1; // o GitHub Pages não manda os cabeçalhos que liberam várias linhas
  }

  const progresso = (info: { status: string; loaded?: number; total?: number }) => {
    if (info.status === "progress_total" && info.total) enviar({ tipo: "progresso", carregado: info.loaded ?? 0, total: info.total });
  };
  tokenizador = await AutoTokenizer.from_pretrained(MODELO, { progress_callback: progresso });
  modelo = await AutoModel.from_pretrained(MODELO, { dtype: "q8", device: "wasm", progress_callback: progresso });
  enviar({ tipo: "pronto" });
}

async function calcular(textos: string[]): Promise<ResultadoTexto[]> {
  if (!tokenizador || !modelo) throw new Error("o modelo ainda não carregou");
  const itens: ResultadoTexto[] = [];
  for (const texto of textos) {
    const tokens = tokenizador.tokenize(texto, { add_special_tokens: true });
    const entradas = tokenizador(texto);
    const { last_hidden_state } = await modelo(entradas);
    const [, n, d] = last_hidden_state.dims as number[];
    const dados = last_hidden_state.data as Float32Array;
    const porToken = Array.from({ length: n }, (_, t) => Array.from(dados.subarray(t * d, (t + 1) * d)));
    itens.push({ texto, tokens, porToken, embedding: embeddingDosTokens(porToken) });
  }
  return itens;
}

self.onmessage = async (e: MessageEvent<PedidoAoModelo>) => {
  const pedido = e.data;
  try {
    if (pedido.tipo === "carregar") await carregar(pedido.origem, pedido.basePath);
    else enviar({ tipo: "resultado", id: pedido.id, itens: await calcular(pedido.textos) });
  } catch (erro) {
    enviar({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
  }
};
