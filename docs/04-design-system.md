# 04 · Design System

> ✅ **Aceito pelo autor** como direção visual em 2026-10-19 ([ADR-0018](adr/0018-primeira-entrega-design.md)). As "cores por módulo" valem para os temas/abas do laboratório.
>
> **Decisões do autor já refletidas aqui (2026-10-19):**
> - ☀️ **Tema claro** é o único da v1. O escuro fica guardado para o futuro.
> - **Cor de destaque: aqua claro `#5ED3DB`**, no lugar do violeta (seção 2.2).
> - **Logo: Aqua**, um mascote em pixel (seção 7). O desenho foi escolhido com o nome provisório "Bloquinho"; o nome **Aqua** foi dado pelo autor em 2026-10-19.
>
> **Telas no Figma:** Home · Desktop, Novo projeto · Desktop, Laboratório · Desktop. A Home tem uma segunda versão, **Home · Desktop · mascote** (à esquerda da original), com a Aqua ilustrando as seções (seção 7.1), aguardando a escolha do autor. Ao lado dela, o frame **Mascote · versões** compara opções do card "Aprenda o conceito". Também há os frames de apoio Logo · opções e Cor de destaque · comparação.

> Inspiração: Apple (clareza, tipografia, scrollytelling, espaço), ElevenLabs (superfícies suaves, gradientes discretos, controles elegantes), Linear/Vercel (precisão, densidade controlada no modo laboratório).

## 1. Princípios visuais

1. **Calma por padrão, vida sob demanda.** Telas limpas; a cor e o movimento ficam para o que está sendo explicado.
2. **Tipografia faz o trabalho pesado.** Títulos grandes, curtos e confiantes; corpo de texto confortável.
3. **Uma cor de acento por módulo.** O resto é neutro.
4. **Profundidade sutil.** Camadas com blur e bordas de 1px em vez de sombras pesadas.
5. **Movimento com significado.** Cada animação responde: *o que causou isso?*
6. **Dois modos de densidade.** Aula = editorial e espaçosa. Laboratório = ferramenta, mais densa e precisa.

## 2. Tokens

Tokens são a fonte única de verdade, definidos como CSS custom properties e expostos ao Tailwind ([ADR-0007](adr/0007-estilo-tailwind-radix-tokens.md)).

### 2.1 Cores neutras

O **claro é o padrão**. O escuro fica guardado para uma opção futura e não é usado na v1.

| Token | Claro (padrão) | Uso |
|---|---|---|
| `--bg` | `#FFFFFF` | Fundo da página, barras e painéis do laboratório |
| `--bg-subtle` | `#F5F5F7` | Cards, seções alternadas, **canvas do laboratório** |
| `--surface` | `rgba(255,255,255,.72)` + blur | Painéis flutuantes |
| `--border` | `rgba(0,0,0,.08)` | Bordas de 1px (cards usam `.06`, campos `.15`) |
| `--text` | `#1D1D1F` | Texto principal; botão principal da Home (fundo) |
| `--text-muted` | `#6E6E73` | Texto secundário |
| `--text-subtle` | `#86868B` | Legendas, rodapé |
| `--focus` | `#0071E3` | Anel de foco |

<details><summary>Escuro (futuro, fora da v1)</summary>

| Token | Escuro |
|---|---|
| `--bg` | `#0A0A0B` |
| `--bg-subtle` | `#111113` |
| `--surface` | `rgba(22,22,24,.72)` + blur |
| `--border` | `rgba(255,255,255,.08)` |
| `--text` | `#F5F5F7` |
| `--text-muted` | `#A1A1A6` |
| `--focus` | `#2997FF` |

</details>

### 2.2 Cores por módulo

> ✅ **Cor de destaque do site: aqua claro `#5ED3DB`** (escolhida pelo autor em 2026-10-19, no lugar do violeta). Vale para a marca (logo Aqua), os botões principais, a "linha da vez" e a aba Redes neurais.
>
> | Papel | Cor |
> |---|---|
> | Destaque (preenchimento, linhas, portas) | `#5ED3DB` |
> | Texto sobre branco | `#0E7C86` |
> | Fundo bem claro (chips, neurônio) | `#E8FAFB` |
> | Texto sobre o destaque (botões, chips) | `#06363A` |
>
> Cuidado: por ser claro, o aqua some em traços finos sobre o branco. Linhas e bordas no destaque devem ter pelo menos 2px, e o texto pequeno usa `#0E7C86`, nunca o `#5ED3DB`.

**Botões:**
- **Principal** (Rodar, Criar projeto, Treinar N vezes): fundo aqua `#5ED3DB`, texto `#06363A`.
- **Escuro** (Criar novo projeto na Home, Próximo): fundo `#1D1D1F`, texto branco.
- **Secundário:** fundo branco, borda `rgba(0,0,0,.15)`.

Como a cor foi escolhida: a ideia era fugir do roxo comum em sites gerados por IA. O ciano `#14B8C4` foi testado primeiro, e o autor achou pesado. No frame "Cor de destaque · comparação" foram comparados ciano `#14B8C4`, aqua claro `#5ED3DB`, menta `#2DD4BF` e menta claro `#6EE7D3`, e o autor escolheu o aqua claro.

| Módulo | Nome | Acento | Uso visual |
|---|---|---|---|
| 0 · Fundamentos | Grafite | `#8E8E93` | Neutro, introdutório |
| 1 · Redes neurais | Aqua claro (antes Violeta `#7C5CFF`) | `#5ED3DB` | Neurônios, conexões |
| 2 · LLMs | Azul | `#2F7CF6` | Tokens, probabilidades |
| 3 · Embeddings (Busca por significado) | Ciano ⚠️ | `#14B8C4` | Pontos no espaço |
| 4 · RAG | Verde-água | `#10B981` | Documentos, recuperação |
| 5 · Deep thinking | Âmbar | `#F59E0B` | Traços de raciocínio |
| 6 · Aprendizado contínuo | Rosa | `#F43F5E` | Memória, esquecimento |

> ⚠️ **Em aberto:** o ciano de Embeddings ficou parecido demais com o aqua da marca. Quando a aba Busca por significado for desenhada, ela precisa de outra cor.

Cada acento gera uma escala (`50 … 900`) e um **gradiente de destaque** usado só em heróis e em estados "ativos" da visualização.

No fundo claro, o acento puro é fraco para **texto pequeno**. Por isso cada acento tem um tom escuro para texto:

| Acento | Fundo / preenchimento | Texto sobre branco | Fundo bem claro | Texto sobre o acento |
|---|---|---|---|---|
| Aqua claro (marca, Redes neurais) | `#5ED3DB` | `#0E7C86` | `#E8FAFB` | `#06363A` |
| Ciano (Embeddings) | `#14B8C4` | `#0E8A93` | `#E3F7F9` | `#06363A` |
| Verde-água (RAG) | `#10B981` | `#0B8A5F` | — | — |

### 2.3 Cores semânticas de visualização

Consistentes em todo o site, para o aluno criar intuição:

| Significado | Cor | Exemplo |
|---|---|---|
| Valor positivo / peso positivo | Verde `#16A34A` (número do peso em `#15803D`) | Conexão que reforça; bolinha com resultado positivo ([ADR-0021](adr/0021-bolinhas-cores-e-espremer.md)) |
| Valor negativo / peso negativo | Vermelho `#DC2626` (número do peso em `#B91C1C`) | Conexão que inibe; bolinha com resultado negativo |
| Passo da vez (conta passo a passo) | Aqua `#5ED3DB`, linha de 2,5px, sem brilho; o número do peso vira "× 0,50" em texto escuro | Linha e parcela sendo calculadas agora |
| Passo ainda não feito | A cor normal da linha com 20% de opacidade | Linhas que a conta ainda não usou |
| Fio entre blocos | Cinza `#8E8E93`, tracejado | Entrada → Camada → Camada → Saída |
| Erro na montagem (ao clicar em Rodar) | Vermelho `#E5484D`, borda de 2px | Bloco com problema; a rodada não começa |
| Aviso na montagem (ao clicar em Rodar) | Âmbar `#F5A524`, borda tracejada de 2px, bloco a 75% de opacidade; texto do aviso `#8A5A00` | Camada solta; a rodada continua |
| Erro / perda | Vermelho `#E5484D` | Barras de erro |
| Correto / recuperado / conta feita | Verde `#10B981` | Chunk relevante, ✓ da parcela já calculada |
| Incerto / probabilidade | Opacidade, não matiz | Barras mais transparentes |

Paleta azul × laranja é segura para daltonismo. **Nunca** usar só cor para transmitir significado — sempre acompanhar com forma, rótulo ou padrão.

### 2.4 Tipografia

- **Sans:** **Inter**, a fonte usada nas telas do Figma (decisão no código: [ADR-0019](adr/0019-projeto-real-home.md)). Antes a proposta era Geist Sans.
- **Mono:** Geist Mono — tokens, números, código.
- Números tabulares (`font-variant-numeric: tabular-nums`) em todo valor que muda ao vivo.

| Token | Tamanho / altura | Peso | Uso |
|---|---|---|---|
| `display` | clamp(48px, 7vw, 96px) / 1.02 | 600 | Herói da home e de módulo |
| `h1` | clamp(36px, 4.5vw, 56px) / 1.08 | 600 | Título de aula |
| `h2` | 32px / 1.15 | 600 | Seções |
| `h3` | 22px / 1.3 | 600 | Subtítulos, cards |
| `body-lg` | 21px / 1.5 | 400 | Texto do scrollytelling |
| `body` | 17px / 1.55 | 400 | Texto geral |
| `caption` | 13px / 1.4 | 500 | Rótulos de visualização |
| `mono-sm` | 13px / 1.4 | 450 | Valores, tokens |

Títulos com `letter-spacing` levemente negativo (−0,02em). Largura de linha máxima ~68 caracteres.

### 2.5 Espaço, raio e elevação

- Escala de espaço base 4: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
- Raios: `--r-sm 8px` (inputs), `--r-md 14px` (cards), `--r-lg 24px` (painéis), `--r-full` (pílulas, sliders).
- Elevação: preferir borda + blur. Sombra única e difusa só para painéis flutuantes.

## 3. Movimento

| Token | Duração | Curva | Uso |
|---|---|---|---|
| `instant` | 100ms | ease-out | Hover, pressionar |
| `quick` | 200ms | `cubic-bezier(.2,.8,.2,1)` | Entradas de UI |
| `smooth` | 400ms | `cubic-bezier(.22,1,.36,1)` | Transição entre passos |
| `story` | 600–1200ms | spring (stiffness 120, damping 20) | Fluxo de dados na visualização |

Regras:

- **Causa antes do efeito:** o elemento que provoca a mudança se move primeiro (≥ 80ms antes).
- **Uma coisa por vez** no modo aula; no laboratório pode haver movimento simultâneo.
- **Controle de velocidade** global: 0,5× · 1× · 2× · pausa.
- **`prefers-reduced-motion`:** transições viram *crossfade* curto ou troca direta; nada de partículas ou parallax ([ADR-0011](adr/0011-acessibilidade-e-movimento.md)).

## 4. Componentes

### 4.1 Primitivos (base Radix)

Button (primário, secundário, ghost, pílula) · IconButton · Slider · Toggle · SegmentedControl · Select · Tooltip · Popover · Dialog · Tabs · Badge · Kbd.

### 4.2 Componentes de aula

| Componente | Descrição |
|---|---|
| `<Scrolly>` | Layout com visualização *sticky* e passos rolando. No celular, a visualização fica no topo e os passos embaixo. |
| `<Step>` | Um passo do roteiro: texto + ação na simulação. |
| `<Callout kind="metafora-quebra">` | Caixa "onde a metáfora quebra". |
| `<TryIt>` | Mini-interação embutida no texto. |
| `<OpenInLab>` | Botão que leva o estado atual ao laboratório. |
| `<Checkpoint>` | Perguntas com feedback explicado. |
| `<DeepDive>` | Seção recolhível "ver por dentro" (fórmulas com KaTeX). |
| `<Term>` | Palavra técnica com definição em popover (glossário). |

### 4.3 Componentes de laboratório

Desenhado no Figma ("Laboratório · Desktop") e testado no teste técnico:

| Componente | Descrição |
|---|---|
| `<LabShell>` | 3 zonas: **paleta de blocos** (esq., 220–240px), **canvas** (centro, fundo `--bg-subtle`), **painel de contas** (dir., ~300px). Barra superior com logo, nome do projeto, abas dos temas, Treinar e Rodar. |
| Paleta de blocos | Cards arrastáveis: **Entrada** (cor ou números), **Camada**, **Neurônio**, **Saída**. O quadro "Como montar" saiu ([ADR-0021](adr/0021-bolinhas-cores-e-espremer.md)). |
| Bloco Entrada | Escolhe o tipo (Cor / Números). Cor vira R, G, B (0 a 1); Números são linhas com nome e valor, até 6. Cada número é uma bolinha de onde saem as linhas. |
| Bloco Camada | Título, campo "neurônios", neurônios empilhados. Portas do fio à esquerda e à direita (bolinhas aqua). |
| Bloco Saída | Número + quadrado com a cor da resposta + rótulo ("laranja (1)"); "aguardando" antes da conta. Selecionado, mostra o objetivo (nome e cor das respostas 0 e 1). |
| Número do peso | Etiqueta na linha; duplo clique edita. Na linha da vez, fica com fundo aqua. |
| Painel de contas | Botão Rodar, "Passo N de M", chip do neurônio da vez, uma linha por parcela (feita ✓ / agora / próxima), soma só no fim, resultado (acende/apaga ou espremer 0–1), Anterior/Próximo e Passo a passo/Automático. Erros do Rodar aparecem aqui. |
| Seção Treinar (no painel) | Repetições, velocidade (x100), começar do zero/já treinada, botão "Treinar N vezes". Só no design; ainda não programado. |

Propostas antigas da IA, ainda não usadas: `<ParamControl>`, `<PresetPicker>` e `<ShareLink>` (link com o estado).

### 4.4 Gramática visual das simulações

Mesmos elementos sempre significam a mesma coisa:

| Elemento | Representação |
|---|---|
| Neurônio | Círculo com borda aqua; preenchimento = ativação; o valor aparece dentro; o da vez ganha um anel de brilho |
| Peso | Linha; espessura = magnitude; cor = sinal; **número do peso** escrito na linha |
| Fio | Linha cinza tracejada entre as portas dos blocos; define a ordem das camadas |
| Linha da vez | Aqua com brilho; as outras ficam apagadas até a vez delas |
| Dado em movimento | Pulso/partícula seguindo a conexão |
| Vetor / embedding | Ponto num plano; seta quando o ângulo importa |
| Documento / chunk | Cartão retangular com borda arredondada |
| Token | Pílula mono com cor por ID |
| Probabilidade | Barra horizontal com valor em mono |
| Pensamento | Texto em âmbar, recuável, com linha guia à esquerda |

## 5. Layouts de página

Desenhados no Figma:
- **Home:** barra com logo e "Criar novo projeto"; herói "Veja a IA aprender." com uma rede neural clean (caminho aqua destacado); seções "Como funciona" (3 passos), "Explore" (Redes neurais disponível; Busca por significado e RAG em breve) e um CTA final.
- **Novo projeto:** (1) tema: Redes neurais / Busca por significado / RAG; (2) como começar: **Básico pronto** (com miniatura da montagem) ou **Vazio**; campo "Nome do projeto"; botões Cancelar e Criar projeto. A escolha marcada tem borda aqua e ✓.
- **Laboratório:** ver 4.3.

Propostas antigas da IA, ainda não desenhadas:
- **Módulo:** herói com gradiente do acento, lista de aulas com duração e progresso.
- **Aula / tutorial:** scrollytelling em tela cheia; barra de progresso fina no topo; índice de passos discreto na lateral.
- **Modo apresentação** (para sala de aula): `?apresentar=1` aumenta tipografia em 125%, avança passos com as setas do teclado e esconde navegação.

## 6. Voz e tom

- Segunda pessoa, frases curtas, verbos concretos ("a rede *ajusta*", não "ocorre um ajuste").
- Termo técnico sempre apresentado **depois** da intuição, e em `<Term>`.
- Sem hype ("revolucionário", "mágico"). Sem medo ("a IA vai substituir…").

## 7. Marca

**Logo: Aqua** (desenho escolhido pelo autor em 2026-10-19 com o nome provisório "Bloquinho", entre Bloquinho, Neurônio e Rede em seta; ver o frame "Logo · opções" no Figma).

- Um mascote em pixel (grade de 10 × 6), no espírito do mascote quadradinho do Claude. É **um bloco do laboratório com olhos**: corpo aqua `#5ED3DB`, dois olhos verticais `#06363A`, uma "porta" de cada lado em `#0E7C86` (onde entram e saem os fios) e duas perninhas.
- Uso: à esquerda do nome "LearningThinking" (Inter 15px, peso 600), com cerca de 30 × 18px na barra do site.
- Por ser pixel art, ele só é ampliado em múltiplos inteiros, sem suavizar.

### 7.1 Mascote: Aqua

**Nome: Aqua** (decidido pelo autor em 2026-10-19; antes, "Bloquinho"). Aqua não é só o logo: é o **mascote** do site e aparece nas telas como personagem. A ideia é representar **o aluno aprendendo** (e, ao mesmo tempo, um bloco do laboratório), então as poses mostram o que está acontecendo naquela parte da página.

**Poses** (todas na grade de 10 × 6, mesmas cores do logo):

| Pose | O que muda | Onde aparece na Home |
|---|---|---|
| Normal | Igual ao logo | Logo, rodapé (20 × 12px) |
| Contente | Olhos normais + bochechas rosa `#F4A3B5` | Card "Aprenda o conceito", card Redes neurais, saída da rede no herói, CTA final |
| Com a lâmpada | Contente, com uma lâmpada em pixel acesa em cima (amarelo `#FFD54A`, raios `#F59E0B`): "aprendeu" | Card "Aprenda o conceito" |
| Montando | Bracinhos levantados segurando um bloco de montar aqua, prestes a encaixar numa pilha (cinza, azul, laranja), com uma seta tracejada; sem desenhar camadas | Card "Monte com as mãos" |
| Dormindo | Olhos fechados (traço horizontal) e "z z" em cinza | Cards "Em breve" (Busca por significado, RAG) |
| Pulando | Contente, com pixels soltos dos lados | CTA final "Pronto para ver por dentro?" |
| Saída da rede | Ligado por fio aqua ao último neurônio do herói, com o valor `0,97` em cima | Herói |

**Com o mascote do Claude.** No card **"Veja por dentro"**, o mascote em pixel do Claude aparece **de lado, digitando num notebook**, num painel claro, como os outros cards (o fundo escuro foi testado e o autor pediu claro), seguindo uma referência enviada pelo autor. Corpo terracota `#D97757` com o lado direito na sombra `#B9603F`, olhos `#111113`, um bracinho no teclado; a tela do notebook solta uma luz aqua. Da cabeça dele sai um **balão de pensamento com a Aqua dentro**: a IA "por dentro" está pensando no que o aluno montou. Ele aparece de novo no CTA final, ao lado da Aqua.

**Versões do "Aprenda o conceito".** O autor aprovou a lâmpada em cima e pediu outras opções para comparar, no frame **Mascote · versões**: A · lâmpada em cima (atual), B · lendo um livro com a ideia chegando, C · formado (capelo), D · lousa com `w·x + b = 0,97` e a lâmpada num balão, E · a lâmpada acendendo em três tempos (dá para virar animação). Aguardando a escolha.

> ⚠️ **Em aberto:** o mascote do Claude é da Anthropic. Usar como homenagem num projeto de estudo é diferente de usar num site público; antes de publicar, rever se ele fica, troca por um personagem próprio ou ganha um aviso.

**Regras de uso**
- No máximo **uma Aqua por bloco de conteúdo** (card, seção), e nunca competindo com a visualização principal: ela ilustra, não explica.
- Pixel art só em múltiplos inteiros da grade (unidades de 2, 4, 5, 7 ou 8px já usadas), sem suavizar nem girar.
- Aqua **não fala** em balões com texto longo; o texto fica na página.
- Na Home, as ilustrações ficam num painel branco (raio 16px, borda `rgba(0,0,0,.06)`) no topo dos cards de "Como funciona", que passaram de 240 para 440px de altura.

