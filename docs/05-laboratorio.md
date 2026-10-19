# 05 · Laboratório (Sandbox)

## ✅ Decidido pelo autor

Fontes: [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md) e [ADR-0014](adr/0014-laboratorio-abas-projetos-e-erros.md).

- O laboratório é o **produto principal**: uma área de trabalho estilo Tinkercad, onde o aluno arrasta blocos, liga os blocos com fios e roda a montagem. O cálculo é feito no navegador.
- **Uma aba por tema**, cada uma com o próprio conjunto de blocos. Projetos que usam os mesmos blocos ficam na mesma aba.
- **v1 com duas abas:**
  - **Redes neurais:** projetos *Rede neural do zero* e *Esquecimento*.
  - **Busca por significado.**
- Dentro da aba, os blocos são **ligados livremente**.
- **Criar novo projeto:** *vazio* ou *básico pronto* (uma montagem bem simples que já funciona).
- **Ligação sem sentido:** gera um erro **ao clicar em rodar**, destacando **o lugar exato** na montagem, não só uma mensagem.
- Os tutoriais ficam em **páginas separadas** e levam ao laboratório.

### Aba Redes neurais ([ADR-0015](adr/0015-aba-redes-neurais-montagem.md))

- **Bloco Camada** com **neurônios** dentro: o aluno arrasta um por um **ou** digita a quantidade.
- **Montagem básica pronta:** entrada → camada oculta → saída. A rede **recebe uma cor** e responde **azul (0) ou laranja (1)**. Vem com **exemplos prontos**.
- **Treino:** botão **"Treinar"**, do zero (pesos aleatórios) **ou** com rede já treinada (pesos salvos).
- **Resultado:** os valores (ex.: 0,3) aparecem de forma **visual** na própria tela da rede, **passo a passo**, até a saída.
- **Passos:** o usuário avança **manualmente** (um por vez) ou no modo **automático**.
- **Treinar:** o usuário escolhe **quantas repetições** (ex.: 1000), e o treino corre até lá **em alta velocidade** (~x100).
- **Forward pass na tela:** cor → 3 números (R, G, B) → cada neurônio oculto faz sua soma ponderada (a conta aparece) → saída → "espremer" entre 0 e 1 → resposta. As linhas têm espessura **bem contrastada** conforme o peso.
- **Treino acelerado:** mostra tudo passando rápido; no fim, mostra as saídas registradas durante o treinamento.
- **Backward pass passo a passo** (modo "debug"): **depois da v1**, ver [ADR-0016](adr/0016-modo-debug-backward-pass.md).

### Em aberto

- Aba Redes neurais: formato da tela de saídas no fim do treino.
- Aba Busca por significado: blocos e montagem básica.
- Onde os projetos ficam salvos?
- Como o tutorial "mostra" o laboratório?

---

> ⚠️ **Daqui para baixo: proposta antiga da IA**, anterior ao ADR-0013/0014. A lista L1 a L5 e o contrato `Simulation` compartilhado com aulas **não valem mais**. Partes úteis (ex.: requisitos de desempenho e privacidade) serão revistas com o autor.

## Requisitos comuns

- **R1** Abre sem login, sem chave, sem instalar nada.
- **R2** Todo laboratório tem *presets* que contam uma história ("isso funciona", "isso quebra").
- **R3** Estado compartilhável por URL (`?s=` comprimido).
- **R4** Controles de transporte: play, pausa, um passo, reset, velocidade.
- **R5** Cada parâmetro tem uma explicação de uma linha e um link para a aula onde ele aparece.
- **R6** Funciona em notebook comum sem GPU dedicada; em celular com recursos reduzidos (menos neurônios / menor dataset).
- **R7** Nada que o aluno digita sai do navegador, exceto no modo LLM ao vivo (com aviso).

## Laboratórios do MVP

### L1 · Playground Neural *(módulo 1)*

| | |
|---|---|
| **Entrada** | Dataset 2D (círculos, XOR, espiral, gaussianas; ou desenhar pontos) |
| **Parâmetros** | Nº de camadas (0–4), neurônios por camada (1–8), ativação (ReLU, tanh, sigmoide), taxa de aprendizado, tamanho do lote, ruído, regularização L2 |
| **Visual** | Grafo da rede (pesos como linhas), fronteira de decisão em heatmap, curva de perda treino/validação |
| **Interações** | Clicar em neurônio → ver o que ele "detecta"; modo passo-a-passo do backprop |
| **Engine** | Mini-engine própria com autograd ([ADR-0005](adr/0005-ml-no-navegador.md)) em worker |

### L2 · Mapa de Significados *(módulo 3)*

| | |
|---|---|
| **Entrada** | Frases do aluno ou coleções prontas (animais, emoções, comidas) |
| **Parâmetros** | Método de projeção (PCA, UMAP), métrica (cosseno, euclidiana) |
| **Visual** | Pontos num plano 2D, linhas para os k vizinhos, matriz de similaridade |
| **Engine** | Transformers.js em worker (WebGPU → WASM) |

### L3 · Monte seu RAG *(módulo 4)*

| | |
|---|---|
| **Entrada** | Coleção pronta ("Manual de uma escola fictícia", "Regras de um jogo") ou textos colados |
| **Parâmetros** | Tamanho do chunk, sobreposição, estratégia (caracteres, frases, parágrafos), k, limiar de similaridade, com/sem RAG |
| **Visual** | Documentos → chunks → pontos; pergunta → vizinhos destacados; prompt final montado; resposta com citações |
| **Comparação** | Lado a lado "sem RAG" × "com RAG" para a mesma pergunta |
| **Geração** | Replay (padrão) ou ao vivo ([ADR-0006](adr/0006-llm-replay-e-ao-vivo.md)) |

### L4 · Orçamento de Pensamento *(módulo 5)*

| | |
|---|---|
| **Entrada** | Problemas curados (lógica, aritmética, planejamento, pegadinhas) |
| **Parâmetros** | Orçamento de raciocínio (nenhum, baixo, médio, alto) |
| **Visual** | Traço de raciocínio com ramos, linha do tempo de tokens, resposta final, acerto |
| **Geração** | Replays gravados de modelos com *extended thinking*; ao vivo opcional |

### L5 · Não Esqueça *(módulo 6)*

| | |
|---|---|
| **Entrada** | Sequência de tarefas (ex.: classificar dígitos 0–4, depois 5–9; ou datasets 2D diferentes) |
| **Parâmetros** | Épocas por tarefa, replay (tamanho do buffer), força da regularização (estilo EWC) |
| **Visual** | Acurácia por tarefa ao longo do tempo, pesos que mais mudaram |
| **Engine** | Mesma mini-engine do L1 |

## Laboratórios futuros

- **Tokenizador & Amostragem** (módulo 2) — fase 2.
- **Atenção visualizada** (módulo 2) — fase 2, usando um transformer minúsculo treinado em texto simples.
- **Agente com ferramentas** (módulo 7) — fase 3.

## Formato de replay de LLM

```jsonc
{
  "version": 1,
  "model": "claude-sonnet-5-5",          // modelo que gerou o replay
  "recordedAt": "2026-10-18",
  "input": { "system": "...", "messages": [ /* ... */ ], "params": { "thinkingBudget": 4000 } },
  "events": [
    { "t": 0,   "type": "thinking", "text": "Vamos ver..." },
    { "t": 120, "type": "text",     "text": "A resposta", "topK": [["A", 0.82], ["Uma", 0.11]] },
    { "t": 980, "type": "done",     "usage": { "input": 812, "output": 145 } }
  ]
}
```

`topK` é opcional (só quando o provedor expõe probabilidades ou quando é gerado por um modelo local didático). A interface **nunca** inventa probabilidades que não foram registradas.
