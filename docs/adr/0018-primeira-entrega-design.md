# ADR-0018 · Primeira entrega: design das telas principais no Figma

- **Status:** Aceita
- **Data:** 2026-10-19
- **Decisores:** autor do projeto

## Contexto

Com o produto ([ADR-0013](0013-formato-tutoriais-e-laboratorio.md) a [ADR-0016](0016-modo-debug-backward-pass.md)) e a stack ([ADR-0017](0017-stack.md)) definidos, faltava escolher por onde começar.

## Decisão

1. **Começar pelo frontend**, com o design das telas feito **no Figma** e visual premium e limpo.
2. A primeira entrega está **pronta** quando existirem estas três telas:
   1. **Home** em estilo *hero page*, bem trabalhada em UI/UX, com um botão **"Criar novo projeto"**.
   2. **Escolha do tipo de projeto:** Redes neurais (e, no futuro, outros, como RAG).
   3. **Laboratório:** a tela onde o aluno arrasta neurônios e camadas, vê as linhas e o peso de cada linha.
3. **Direção visual:** o [04-design-system.md](../04-design-system.md), com **tema claro** e destaque **aqua claro `#5ED3DB`** (ver abaixo).

## Situação da entrega (2026-10-19)

| Tela | Frame no Figma | Situação |
|---|---|---|
| Home | Home · Desktop | ✅ Desenhada (tema claro, aqua, logo Bloquinho) |
| Escolha do tipo de projeto | Novo projeto · Desktop | ✅ Desenhada |
| Laboratório | Laboratório · Desktop | ✅ Desenhada (passo a passo das contas) |

Frames de apoio: "Logo · opções", "Cor de destaque · comparação" e "Laboratório · Desktop · violeta (antigo)", guardado só para comparação.

Teste técnico do laboratório: [`spikes/camada-react-flow/`](../../spikes/camada-react-flow/README.md), funcionando (ver "Teste técnico" abaixo).

## Decisões ao longo do caminho (todas em 2026-10-19)

### Teste técnico antes da tela do laboratório
- Antes de desenhar a tela 3, foi feito um **teste técnico rápido** (sem design) do **bloco Camada com neurônios arrastáveis no React Flow**. O autor testa; só depois o visual é desenhado.

### Home
- A IA tem liberdade criativa para a Home, que influencia pouco o objetivo principal.
- Hero com uma **rede neural clean e cibernética**.
- **Seções abaixo do hero** explicando o projeto; o conteúdo delas pode mudar a qualquer momento.

### Tema
- **Tema claro** é o tema do site (fundo branco, canvas do laboratório em `#F5F5F7`). O escuro fica para o futuro.

### Fios e ordem das camadas
- O primeiro teste ordenava as camadas pela **posição na tela**, e uma camada solta perto de outra gerava ligações estranhas.
- Decisão: **a ordem vem dos fios que o aluno liga**, como no Tinkercad.
- **O fio liga bloco com bloco** (Entrada → Camada → Camada → Saída), e todos os neurônios das duas pontas se ligam sozinhos (camada densa). Não existe ligação neurônio por neurônio.

### Pesos
- **Cada linha mostra o número do peso**, além da espessura e da cor. **Duplo clique** edita.
- **Ajuste manual sempre ligado**, em redes pequenas e grandes, e opcional. Observação do autor: com 2 camadas, mexer à mão ajuda a entender; com 3 ou mais, fica confuso ajustar um por um. Por isso o Treinar continua sendo o caminho principal em redes maiores.

### Entrada e Saída
- **Bloco Entrada:** o aluno escolhe o que entra (**cor** ou **números livres**). O laboratório é um sandbox e não só sobre cores.
- **Bloco Saída**, ligado por fio: mostra **o número e a cor da resposta**. Ao clicar, o aluno **personaliza o objetivo**. *Proposta da IA, em uso no teste:* objetivo = nome e cor das respostas 0 e 1.

### Contas passo a passo
- **Uma parcela de cada vez.** A linha da vez fica **destacada** no canvas e o painel mostra só aquela multiplicação (ex.: `1,00 × −0,34`). Depois vem a próxima, e a soma só no fim. O autor aprovou no Figma ("ajuda muito").
- A conta começa ao clicar em **Rodar**. O aluno avança no **Passo a passo** (Anterior/Próximo) ou no **Automático**.
- **Camada solta** (sem fio vindo da Entrada) dá só um **aviso**, não erro: borda tracejada âmbar, fica de fora das contas e a rodada continua.

### Cor de destaque
- Para fugir do roxo comum em sites gerados por IA, o violeta saiu. O ciano `#14B8C4` foi testado e achado pesado. Na comparação entre ciano, **aqua claro `#5ED3DB`**, menta `#2DD4BF` e menta claro `#6EE7D3`, o autor escolheu o **aqua claro**.
- Por ser claro, ele precisa de traços de pelo menos 2px e de texto pequeno no tom escuro `#0E7C86`. Os botões aqua usam texto `#06363A`. Detalhes no [04-design-system.md](../04-design-system.md).

### Logo
- **Bloquinho:** um mascote em pixel, que é um bloco do laboratório com dois olhos, uma "porta" de cada lado (onde entram e saem os fios) e duas perninhas. Escolhido entre Bloquinho, Neurônio e Rede em seta. Corpo `#5ED3DB`, olhos `#06363A`, portas `#0E7C86`. Fica antes do nome "LearningThinking".

## As telas

### Novo projeto (tela 2)
1. **Tema:** Redes neurais (marcado), Busca por significado e RAG ("Em breve").
2. **Como começar:** **Básico pronto** (com miniatura Entrada → Camada → Camada → Saída) ou **Vazio**.
3. **Nome do projeto**, mais os botões Cancelar e **Criar projeto**.

A escolha marcada tem borda aqua e ✓.

### Laboratório (tela 3)
- **Barra superior:** logo, nome do projeto, abas Redes neurais / Busca por significado, botões Treinar e Rodar.
- **Paleta (esquerda):** Entrada, Camada, Neurônio, Saída e um "Como montar".
- **Canvas (centro):** Entrada (cor) → Camada 1 (2 neurônios) → Camada 2 (1) → Saída, ligados por fios tracejados. A linha da vez (G → neurônio 1) fica destacada em aqua, com a conta `0,55 × 0,38 = 0,21` ao lado; as já feitas ficam normais e as próximas, apagadas. Legenda das cores dos pesos embaixo.
- **Painel de contas (direita):** uma parcela por vez (feita ✓ / agora / próxima), soma só no fim, Anterior/Próximo, Passo a passo/Automático e a seção Treinar (repetições, velocidade, do zero/já treinada).

## Teste técnico

Código em [`spikes/camada-react-flow/`](../../spikes/camada-react-flow/README.md) (Next.js + TypeScript + React Flow, descartável). Verificado no navegador:

**Primeira versão**
- Camada com neurônios dentro (cada neurônio é um nó "filho").
- Arrastar neurônios ou digitar a quantidade.
- Linhas automáticas com espessura e cor do peso.

**Versão atual**
- Tema claro e aqua.
- Blocos **Entrada** (cor e números), Camada, Neurônio e **Saída** (com objetivo).
- **Fios** com regras: sem círculo, um fio por porta, e Entrada direto na Saída não liga.
- **Número do peso** na linha, editado com duplo clique.
- **Rodar:** confere a montagem, marca em vermelho os blocos com erro e em âmbar a camada solta (só aviso). Em seguida mostra as **contas passo a passo**: a linha da vez é destacada e o painel mostra uma parcela de cada vez, depois a soma, a ativação e a resposta. Funciona no modo manual e no automático.
- A **montagem básica** já vem com pesos que funcionam: laranja dá 0,97 e azul dá 0,12.

**Achados**
- Um neurônio **não passa** de uma camada para outra arrastando.
- Com pesos sorteados, a montagem básica pode travar em 0,50 (os dois neurônios do meio apagam). Por isso ela vem com pesos prontos.

## Em aberto

- *Proposta da IA:* ao clicar num neurônio do meio, o painel diria em palavras o que ele detecta (ex.: "acende para cores com muito vermelho").
- Mover um neurônio de uma camada para outra.
- Mais de um fio chegando na mesma camada (no teste, cada bloco recebe um fio só).
- A cor de Embeddings (ciano) ficou parecida demais com o aqua da marca; rever quando a aba Busca por significado for desenhada.

## Consequências

- Começar pelo design trazia o risco de ter que **redesenhar** o laboratório se o React Flow não permitisse algo. O teste técnico mostrou que o desenho atual é possível.
- O teste técnico vai além de um protótipo descartável: as regras de `lib/rede.ts` (fios, rodada, passo a passo) são uma boa base para o projeto real.
