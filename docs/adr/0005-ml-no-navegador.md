# ADR-0005 · ML roda no navegador: mini-engine própria + Transformers.js em Web Workers

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

Os laboratórios precisam treinar redes pequenas, gerar embeddings e buscar por similaridade. Requisitos: custo zero de servidor, privacidade (texto não sai do navegador), funcionar em notebook comum, e — para fins didáticos — **expor os detalhes internos** (cada peso, cada gradiente, cada passo do backprop).

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| A. Servidor Python (PyTorch) | Poderoso, "real" | Custo, latência, não funciona offline, privacidade |
| B. TensorFlow.js | Maduro, GPU via WebGL/WebGPU | Pesado; abstrai justamente o que queremos mostrar |
| C. **Mini-engine própria** (estilo *micrograd*) em TS | Totalmente transparente, minúscula, determinística | Lenta para redes grandes |
| D. **Transformers.js / ONNX Runtime Web** | Modelos reais de embeddings; WebGPU com fallback WASM | Download de modelo (~25 MB) |

## Decisão

**C + D**, sempre em **Web Workers** (comunicação tipada com Comlink):

- **`src/engine/`** — mini-engine em TypeScript com autograd escalar/vetorial, camadas densas, ativações, perdas (MSE, entropia cruzada), otimizadores (SGD, momentum, Adam) e hooks para inspecionar gradientes. Usada nos laboratórios L1 e L5. Operações vetorizadas com `Float32Array` para aguentar redes de até alguns milhares de parâmetros a 60 fps.
- **Transformers.js** — embeddings (modelo pequeno quantizado, ex.: `all-MiniLM-L6-v2`), usado em L2 e L3. Baixado sob demanda e guardado no Cache API.
- **Busca vetorial** — exata (produto escalar em vetores normalizados). Suficiente para < 5 mil chunks.

## Consequências

**Positivas**
- Nenhum custo de servidor para ML; funciona offline após o primeiro carregamento.
- A engine própria é ela mesma material didático ("ver por dentro" pode mostrar o código).
- Gradientes verificáveis numericamente em testes.

**Negativas**
- Não dá para treinar algo do tamanho de um LLM — e não queremos. Conceitos de escala usam *replays* ([ADR-0006](0006-llm-replay-e-ao-vivo.md)).
- Download inicial do modelo de embeddings. Mitigação: coleções prontas com embeddings pré-calculados; barra de progresso clara; só baixa quando o aluno digita texto novo.

## Quando revisitar

- Se precisarmos de redes convolucionais/transformers treináveis maiores, avaliar um backend WebGPU para a engine ou adotar TF.js só para esses casos.
- Se coleções passarem de ~10 mil chunks, adotar índice aproximado (HNSW em WASM).
