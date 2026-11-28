// Copia o motor do ONNX Runtime (o programa que roda o modelo no navegador) para public/,
// para o site servir tudo do próprio endereço, sem CDN (ADR-0037: rede da escola).
// Roda sozinho antes do `npm run dev` e do `npm run build` (predev/prebuild).
// Usa a versão simples (~14 MB), não a "asyncify" (~27 MB), que só faz falta com WebGPU.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, "node_modules", "onnxruntime-web", "dist");
const destino = join(raiz, "public", "modelos", "ort");

mkdirSync(destino, { recursive: true });
for (const arquivo of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  copyFileSync(join(origem, arquivo), join(destino, arquivo));
}
console.log("motor do ONNX copiado para public/modelos/ort/");
