# 04 · Design System

> ✅ **Aceito pelo autor** como direção visual em 2026-10-19 ([ADR-0018](adr/0018-primeira-entrega-design.md)). As "cores por módulo" valem para os temas/abas do laboratório.

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

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0B` | Fundo da página |
| `--bg-subtle` | `#F5F5F7` | `#111113` | Seções alternadas, cards |
| `--surface` | `rgba(255,255,255,.72)` + blur | `rgba(22,22,24,.72)` + blur | Painéis flutuantes |
| `--border` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.08)` | Bordas de 1px |
| `--text` | `#1D1D1F` | `#F5F5F7` | Texto principal |
| `--text-muted` | `#6E6E73` | `#A1A1A6` | Texto secundário |
| `--focus` | `#0071E3` | `#2997FF` | Anel de foco |

### 2.2 Cores por módulo

| Módulo | Nome | Acento | Uso visual |
|---|---|---|---|
| 0 · Fundamentos | Grafite | `#8E8E93` | Neutro, introdutório |
| 1 · Redes neurais | Violeta | `#7C5CFF` | Neurônios, conexões |
| 2 · LLMs | Azul | `#2F7CF6` | Tokens, probabilidades |
| 3 · Embeddings | Ciano | `#14B8C4` | Pontos no espaço |
| 4 · RAG | Verde-água | `#10B981` | Documentos, recuperação |
| 5 · Deep thinking | Âmbar | `#F59E0B` | Traços de raciocínio |
| 6 · Aprendizado contínuo | Rosa | `#F43F5E` | Memória, esquecimento |

Cada acento gera uma escala (`50 … 900`) e um **gradiente de destaque** usado só em heróis e em estados "ativos" da visualização.

### 2.3 Cores semânticas de visualização

Consistentes em todo o site, para o aluno criar intuição:

| Significado | Cor | Exemplo |
|---|---|---|
| Valor positivo / peso positivo | Azul | Conexão que reforça |
| Valor negativo / peso negativo | Laranja | Conexão que inibe |
| Erro / perda | Vermelho | Barras de erro |
| Correto / recuperado | Verde | Chunk relevante |
| Incerto / probabilidade | Opacidade, não matiz | Barras mais transparentes |

Paleta azul × laranja é segura para daltonismo. **Nunca** usar só cor para transmitir significado — sempre acompanhar com forma, rótulo ou padrão.

### 2.4 Tipografia

- **Sans:** Geist Sans (ou Inter como fallback) — licença aberta.
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

| Componente | Descrição |
|---|---|
| `<LabShell>` | Layout de 3 zonas: controles (esq.), canvas (centro), inspetor (dir.). Colapsa em abas no celular. |
| `<ParamControl>` | Slider/select ligado a um parâmetro da simulação, com explicação curta. |
| `<Transport>` | Play · pausa · passo · reset · velocidade. |
| `<Inspector>` | Detalhes do elemento selecionado (neurônio, chunk, token). |
| `<PresetPicker>` | Cenários prontos ("XOR difícil", "chunk grande demais"). |
| `<ShareLink>` | Copia URL com o estado serializado. |

### 4.4 Gramática visual das simulações

Mesmos elementos sempre significam a mesma coisa:

| Elemento | Representação |
|---|---|
| Neurônio | Círculo; preenchimento = ativação |
| Peso | Linha; espessura = magnitude; cor = sinal |
| Dado em movimento | Pulso/partícula seguindo a conexão |
| Vetor / embedding | Ponto num plano; seta quando o ângulo importa |
| Documento / chunk | Cartão retangular com borda arredondada |
| Token | Pílula mono com cor por ID |
| Probabilidade | Barra horizontal com valor em mono |
| Pensamento | Texto em âmbar, recuável, com linha guia à esquerda |

## 5. Layouts de página

- **Home:** herói com animação viva (rede neural respirando), cartões de módulos com o acento de cada um, CTA "Começar pela aula 0.1".
- **Módulo:** herói com gradiente do acento, lista de aulas com duração e progresso.
- **Aula:** scrollytelling em tela cheia; barra de progresso fina no topo; índice de passos discreto na lateral.
- **Laboratório:** shell de ferramenta, fundo `--bg-subtle`, sem distrações.
- **Modo apresentação** (para sala de aula): `?apresentar=1` aumenta tipografia em 125%, avança passos com as setas do teclado e esconde navegação.

## 6. Voz e tom

- Segunda pessoa, frases curtas, verbos concretos ("a rede *ajusta*", não "ocorre um ajuste").
- Termo técnico sempre apresentado **depois** da intuição, e em `<Term>`.
- Sem hype ("revolucionário", "mágico"). Sem medo ("a IA vai substituir…").
