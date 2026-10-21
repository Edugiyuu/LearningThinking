# 05 · Laboratório (Sandbox)

## ✅ Decidido pelo autor

Fontes: [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md), [ADR-0014](adr/0014-laboratorio-abas-projetos-e-erros.md), [ADR-0015](adr/0015-aba-redes-neurais-montagem.md), [ADR-0017](adr/0017-stack.md) e [ADR-0018](adr/0018-primeira-entrega-design.md). Telas no Figma: "Novo projeto · Desktop" e "Laboratório · Desktop". Teste técnico funcionando: [`spikes/camada-react-flow/`](../spikes/camada-react-flow/README.md).

- O laboratório é o **produto principal**: uma área de trabalho estilo Tinkercad, onde o aluno arrasta blocos, liga os blocos com fios e roda a montagem. O cálculo é feito no navegador.
- **Uma aba por tema**, cada uma com o próprio conjunto de blocos. Projetos que usam os mesmos blocos ficam na mesma aba.
- **v1 com duas abas:**
  - **Redes neurais:** projetos *Rede neural do zero* e *Esquecimento*.
  - **Busca por significado.**
- Dentro da aba, os blocos são **ligados livremente**.
- **Criar novo projeto** (tela "Novo projeto"): (1) escolher o tema; (2) escolher **vazio** ou **básico pronto** (uma montagem simples que já funciona); dar um nome ao projeto.
- **Ligação sem sentido:** gera um erro **ao clicar em Rodar**, destacando **o lugar exato** na montagem (borda vermelha no bloco), não só uma mensagem.
- **Projetos salvos no navegador** (localStorage, com número de versão); sem contas nem servidor na v1 ([ADR-0017](adr/0017-stack.md)).
- Os tutoriais ficam em **páginas separadas** e levam ao laboratório.

### Aba Redes neurais ([ADR-0015](adr/0015-aba-redes-neurais-montagem.md), [ADR-0018](adr/0018-primeira-entrega-design.md))

**Blocos**
- **Entrada:** o aluno escolhe o que entra: **Cor** (vira R, G, B de 0 a 1) ou **Números** livres (nome + valor). O laboratório é um sandbox e não só sobre cores.
- **Camada** com **neurônios** dentro: o aluno arrasta um por um **ou** digita a quantidade.
- **Saída:** mostra **o número e a cor da resposta**. Ao clicar, o aluno personaliza o **objetivo** (nome e cor das respostas 0 e 1; nome+cor é proposta da IA).

**Fios e pesos**
- **Fios:** o aluno liga Entrada → Camada → ... → Saída. **A ordem vem do fio, não da posição na tela.** Um fio liga todos os neurônios de um bloco com todos do próximo (camada densa).
- **Peso na linha:** cada linha mostra o número do peso, além da espessura (força) e da cor (sinal). **Duplo clique** edita.
- **Ajuste manual de pesos sempre ligado**, em redes pequenas e grandes. É opcional; o Treinar continua sendo o caminho para redes grandes.

**Montagem básica pronta**
- Entrada (cor) → Camada 1 (2 neurônios: um "detector de laranja" e um "detector de azul") → Camada 2 (1 neurônio) → Saída. Responde **azul (0) ou laranja (1)**, já com pesos que funcionam (laranja `#FF8C00` → 0,97; azul `#378ADD` → 0,12). Vem com **exemplos prontos**.

**Rodar: contas passo a passo (forward pass)**
- Ao clicar em **Rodar**, a montagem é conferida; se algo estiver errado, os blocos com problema ficam em vermelho e a mensagem aparece no painel.
- **Camada solta** (sem fio vindo da Entrada) **não é erro, é só um aviso** *(decidido pelo autor em 2026-10-19)*: ela fica com borda tracejada âmbar, o painel avisa que ficou de fora das contas, e a rodada continua.
- As contas aparecem **uma multiplicação de cada vez**. A **linha da vez fica destacada** (aqua), as já feitas ficam normais e as que ainda não vieram ficam apagadas. O painel mostra só aquela parcela (ex.: `0,55 × 0,50 = 0,28`), depois a próxima, e **só no fim a soma**.
- Depois da soma: nas camadas do meio, positivo **acende** e passa adiante, negativo **apaga** e passa 0 (ReLU). Na camada ligada à Saída, a soma passa pela **sigmoide**, que a deixa entre 0 e 1: o painel mostra uma curva em S pequena com o ponto da soma e a conta em 3 passos (troca o sinal, e elevado a isso, 1 ÷ (1 + …)); a fórmula geral fica no tutorial 03 ([ADR-0023](adr/0023-sigmoide-em-passos-e-tutorial-01-com-o-lab.md)). Por fim, a Saída decide: abaixo de 0,50 é 0, a partir de 0,50 é 1.
- O usuário avança **manualmente** (Anterior/Próximo) ou no modo **automático**.
- Mexer na montagem (bloco, fio, peso, entrada) cancela a rodada; é preciso rodar de novo.

**Treinar**
- Botão **"Treinar"**, do zero (pesos aleatórios) **ou** a partir de uma rede já treinada (pesos salvos).
- O usuário escolhe **quantas repetições** (ex.: 1000), e o treino corre até lá **em alta velocidade** (~x100): cálculo real → gravação → reprodução.
- Mostra tudo passando rápido; no fim, mostra as saídas registradas durante o treinamento.
- Detalhes (exemplos editáveis, erro ao vivo, gráfico + tabela antes/depois, passinho pequeno/médio/grande): [ADR-0024](adr/0024-treinar-com-backpropagation.md).
- **Backward pass passo a passo** (modo "debug"): **depois da v1**, ver [ADR-0016](adr/0016-modo-debug-backward-pass.md).

**O que já funciona no teste técnico:** Entrada (cor e números), Camada, Neurônio, Saída com objetivo, fios, peso na linha com duplo clique, Rodar com erros (vermelho) e avisos (âmbar) marcados e contas passo a passo (manual e automático). **No site real (`web/`, [ADR-0020](adr/0020-laboratorio-em-codigo.md)):** tudo isso, mais o layout do Figma, abas (só Redes neurais ativa) e o projeto salvo no navegador. Também o **Treinar** ([ADR-0024](adr/0024-treinar-com-backpropagation.md)): exemplos editáveis, passinho, reprodução x1/x10/x100 com o erro caindo e a janela de resultado; a conta fica em `web/lib/treino.ts`, com testes em `npm test`. **Ainda não:** a lista de projetos.

### Em aberto

- Busca por significado: o [ADR-0014](adr/0014-laboratorio-abas-projetos-e-erros.md) coloca a aba na v1, mas a Home e a tela Novo projeto a mostram como "Em breve" porque ela ainda não foi desenhada. Faltam os blocos e a montagem básica.
- Mover um neurônio de uma camada para outra.
- *Bias* (um número extra somado em cada neurônio): ainda não entrou.
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
