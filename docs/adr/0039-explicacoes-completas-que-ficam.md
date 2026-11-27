# ADR-0039 · Explicações completas e que ficam no site

- **Status:** Proposta. O problema e as regras vêm do autor; a forma no site (onde e como aparece) ainda está **em aberto**.
- **Data:** 2026-11-24
- **Decisores:** Eduardo (autor), com redação da IA
- **Usa:** [ADR-0010](0010-i18n-pt-br-primeiro.md) (termos técnicos e o glossário previsto em `content/pt-BR/glossario.yaml`), [design system](../04-design-system.md) (componente `<Term>`, palavra técnica com definição em popover), [roadmap](../06-roadmap.md) (item "Glossário navegável", fase 2), [guia de conteúdo](../07-guia-de-conteudo.md) (regras de escrita)

## Contexto

Durante a conversa da [ADR-0037](0037-aba-busca-por-significado.md), o autor disse:

> "eu sinceramente sinto que eu não sei nada, e olha, eu fiz o lab de cores lá. Deixa anotado isso pra os alunos não ficarem igual eu. Suas explicações estão boas, mas é fácil de esquecer. […] Isso dá a sensação de que eu estou aprendendo, mas que você nunca me fala tudo."

O autor **montou e treinou** a rede das cores e mesmo assim não sabia ligar o que fez aos nomes. Se acontece com ele, vai acontecer com o aluno. Os casos que apareceram na conversa:

| O que aconteceu | Por que é um problema |
|---|---|
| A IA disse "a diferença entre os modelos está no que sai deles" e mostrou só 3 tipos. | **Explicação parcial sem aviso.** O autor percebeu que deviam existir mais e ficou sem saber quantos nem quais. |
| Explicações boas no chat, esquecidas dias depois. | **A explicação some.** Não há um lugar no site para voltar e reler. |
| "Regressão logística é o nome da sigmoide?" e "a descida do gradiente é o forward e o backward pass?" | **Nomes parecidos se misturam.** O aluno usou as peças no lab, mas não sabe onde uma termina e a outra começa. |
| "Embedding" (o bloco do rascunho) e "384 números" pareciam coisas diferentes. | O **mesmo conceito com dois nomes** parece serem duas coisas. |

## Decisão (proposta)

Quatro regras para tudo o que o site explica (tutoriais, lab, quiz). Elas também valem para a IA quando explica ao autor.

1. **Mapa completo.** Ao apresentar um item de uma família, mostrar a família inteira e onde o item fica nela. Se a família for grande demais, dizer **com todas as letras** que existem outros e quais são, mesmo sem explicar cada um. Nunca deixar o aluno achar que viu tudo quando viu um pedaço.
2. **Separar os parecidos.** Quando dois nomes costumam se misturar, a diferença aparece numa linha, lado a lado (ex.: sigmoide × regressão logística).
3. **Fica escrito.** Toda explicação que aparece no lab ou num tutorial tem um **lugar fixo** no site para ser relida. É o glossário que já estava previsto (`<Term>` no design system, "Glossário navegável" no roadmap, `glossario.yaml` na ADR-0010) e que ainda não existe.
4. **Ligar ao que o aluno fez.** Cada termo diz **onde o aluno já usou** aquilo (ex.: "a sigmoide é a curva que você viu no bloco Camada").

## Em aberto (o autor decide; Figma antes do código)

- **Onde fica no site:** página de glossário, popover no próprio termo (`<Term>`), painel dentro do lab, ou uma mistura.
- **Quanto mapa mostrar** sem afogar o aluno: família inteira sempre, ou família inteira com os que não serão vistos só citados.
- **Por onde começar:** os termos abaixo já foram explicados ao autor e podem ser os primeiros.

## Material já levantado (para não se perder)

### Exemplo da regra 1: o mapa completo dos tipos de modelo

Não existe uma lista oficial. Há **três jeitos de agrupar**, e cada modelo tem um lugar em cada um.

**Jeito 1: pelo que sai do modelo (a tarefa)**

| Tipo | O que sai | Exemplo |
|---|---|---|
| Classificador | Uma classe ou uma chance | A rede das cores do lab; filtro de spam |
| Regressão | Um número qualquer | Prever o preço de uma casa |
| Modelo de embedding | Uma lista de números, para comparar | all-MiniLM-L6-v2 (ADR-0037) |
| Gerador de texto (LLM) | O próximo token, repetido | Claude, ChatGPT |
| Gerador de imagem | Uma imagem | Modelos de difusão (Stable Diffusion) |
| Fala e texto | Texto a partir de áudio, ou voz a partir de texto | Whisper (transcrição); TTS (voz sintética) |
| Visão | Onde estão os objetos numa imagem | YOLO (detecção) |
| Multimodal | Mistura entradas e saídas (texto + imagem…) | LLMs que leem imagens |
| Agente (política) | Uma **ação** | A IA que aprende a jogar (aprendizado por reforço) |

**Jeito 2: como é por dentro (a arquitetura)**

| Arquitetura | Bom para | Exemplo |
|---|---|---|
| MLP (camadas totalmente ligadas) | Entradas pequenas e fixas | A rede do lab das cores |
| CNN (rede convolucional) | Imagens | Reconhecer fotos |
| RNN (rede recorrente) | Sequências (hoje menos usada) | Tradutores antigos |
| Transformer | Texto e quase tudo hoje | MiniLM, Claude |
| Difusão | Gerar imagens | Stable Diffusion |

Nem todo modelo é rede neural: Naive Bayes, SVM, árvores de decisão e regressão linear também são modelos.

**Jeito 3: como aprendeu**

| Jeito de aprender | Tem resposta certa? | Exemplo |
|---|---|---|
| Supervisionado | Sim, alguém deu a resposta | Lab das cores (cada cor com seu rótulo) |
| Não supervisionado | Não; acha padrões sozinho | PCA, agrupamento |
| Auto-supervisionado | A resposta sai do próprio dado | LLM prevendo o próximo token |
| Contrastivo | Pares "perto" e "longe" | MiniLM, ajustado com cerca de 1 bilhão de pares |
| Por reforço | Não; só uma nota (recompensa ou punição) | IA dos jogos; RLHF nos LLMs |

### Exemplo da regra 2: nomes que se misturam

| Este | × | Aquele | Diferença em uma linha |
|---|---|---|---|
| Sigmoide | × | Regressão logística | A sigmoide é a **função** (curva em S, leva qualquer número para entre 0 e 1); a regressão logística é um **modelo**: soma ponderada + sigmoide. |
| Sigmoide | × | Função degrau | A sigmoide mantém as casas (2 → 0,88); o degrau **arredonda** para 0 ou 1. |
| Backward pass | × | Descida do gradiente | O backward pass **calcula** a culpa de cada peso (o gradiente); a descida do gradiente **ajusta** os pesos usando essa culpa. |
| Embedding | × | Modelo de embeddings | O embedding é o **resultado** (os 384 números); o modelo é **quem calcula**. |
| Treino | × | Uso (inferência) | No treino há perda e backward pass; no uso só há forward pass, com os pesos parados. |
| Ajuste fino | × | Aprendizado por reforço | O ajuste fino continua o treino com exemplos que têm a resposta certa; o reforço só recebe uma nota. |
| Encoder (ex.: BERT, MiniLM) | × | Decoder (ex.: GPT, Claude) | Os dois são Transformers. O encoder **lê o texto inteiro** e devolve números (serve para embeddings); o decoder **escreve**, um token por vez. |
| Modelo base | × | Modelo de chat | O base só **continua** o texto; o de chat é o mesmo modelo com **ajuste fino** para conversar (o ChatGPT é um GPT ajustado para chat). |
| k-NN classificador | × | k-NN busca | O classificador faz os vizinhos **votarem**; a busca devolve os vizinhos **em ordem**. |

### Termos já explicados ao autor (candidatos ao glossário)

Token · Vocabulário · Tokens especiais (`[CLS]`, `[SEP]`, `[PAD]`, `[UNK]`, `[MASK]`) · Cortadores de texto (WordPiece, BPE, SentencePiece) · Embedding · Modelo de embeddings · Mean pooling · Produto escalar · Norma e normalização · Similaridade de cosseno · Classificação zero-shot · Análise de sentimento · k-NN · PCA (redução de dimensionalidade) · Quantização · Inferência · Forward pass · Perda (*loss*) · Backward pass (*backpropagation*) · Gradiente · Descida do gradiente · Taxa de aprendizado · Sigmoide · Regressão logística · Função degrau · Ajuste fino (*fine-tuning*) · Aprendizado contrastivo · Aprendizado por reforço · RLHF

## Consequências

- Mais texto para escrever e manter: cada termo novo no lab precisa da sua entrada.
- O glossário deixa de ser um "extra" da fase 2 do roadmap e passa a ser parte de como o site ensina. A ordem disso no roadmap fica para o autor decidir.
- Os tutoriais e as telas novas (a começar pela aba Busca por significado) passam a ser revisados com as quatro regras.
