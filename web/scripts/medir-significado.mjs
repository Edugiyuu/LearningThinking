// Mede o modelo de verdade, no Node, com os mesmos arquivos de public/modelos (ADR-0037).
// Confere: (1) os tokens; (2) se a média com [CLS] e [SEP] bate com o pooling do modelo;
// (3) as notas reais (cosseno) entre as palavras e as categorias do Figma.
// Rodar com: node scripts/medir-significado.mjs
import { AutoModel, AutoTokenizer, env, pipeline } from "@huggingface/transformers";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = join(raiz, "public", "modelos") + "/";
const MODELO = "Xenova/all-MiniLM-L6-v2";

const tok = await AutoTokenizer.from_pretrained(MODELO);
const modelo = await AutoModel.from_pretrained(MODELO, { dtype: "q8" });
const extrair = await pipeline("feature-extraction", MODELO, { dtype: "q8" });

const norma = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0));
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0) / (norma(a) * norma(b));
async function nosso(texto) {
  const { last_hidden_state: h } = await modelo(tok(texto));
  const [, n, d] = h.dims;
  const media = new Array(d).fill(0);
  for (let t = 0; t < n; t++) for (let i = 0; i < d; i++) media[i] += h.data[t * d + i] / n;
  const m = norma(media);
  return media.map((x) => x / m);
}
const doModelo = async (texto) => Array.from((await extrair(texto, { pooling: "mean", normalize: true })).data);

for (const t of ["keyboard", "keybaord", "red keyboard", "teclado", "nintendo"])
  console.log(t.padEnd(14), tok.tokenize(t, { add_special_tokens: true }).join(" "));

const k1 = await nosso("keyboard");
const k2 = await doModelo("keyboard");
console.log("\nnossa média (com [CLS]/[SEP]) × pooling do modelo, cosseno:", cos(k1, k2).toFixed(6), "| tamanho:", k1.length);

const palavras = ["keyboard", "mouse", "nintendo", "apple", "pizza", "teclado"];
const categorias = ["electronics", "food", "games"];
const emb = {};
for (const t of [...palavras, ...categorias]) emb[t] = await nosso(t);
console.log("\ncosseno".padEnd(14), categorias.map((c) => c.padStart(12)).join(""));
for (const p of palavras) console.log(p.padEnd(14), categorias.map((c) => cos(emb[p], emb[c]).toFixed(2).padStart(12)).join(""));
