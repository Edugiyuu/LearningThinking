# ADR-0031 · Painéis dos lados recolhíveis no laboratório

- **Status:** Aceita (autor), telas no Figma e código feito (2026-11-09)
- **Data:** 2026-11-09
- **Decisores:** Eduardo (autor), com propostas da IA

## Contexto

No laboratório, o painel **Blocos** (paleta, à esquerda, 240 px) e o painel **Contas** (à direita, 320 px) ficam sempre abertos. Quando o aluno só quer olhar a rede, eles tiram espaço do canvas (a área de desenho, onde fica a rede).

## Decisão

Cada painel ganha uma **setinha fina e alta** (14 × 64 px), **no meio da altura**, na borda do painel que encosta no canvas:

- **Aberto:** `‹` no Blocos e `›` no Contas. Clicar recolhe o painel.
- **Fechado:** o painel encolhe até virar um **trilho** (faixa de 24 px) e a seta gira para o outro lado. Clicar abre de novo.
- O canvas cresce para ocupar o espaço livre.
- **Movimento com GSAP** (componente `LadoRecolhivel`): uma timeline encolhe ou estica a largura, faz o conteúdo sumir ou aparecer (`autoAlpha`) e gira a seta 180°, tudo ao mesmo tempo (0,35 s, `power2.inOut`). Seguimos a regra de animar sempre com timeline do GSAP, sem keyframes de CSS.
- Com o painel fechado, o conteúdo fica `inert` (o Tab e o leitor de tela não entram nele).

Acessibilidade:

- As setas são `<button>` de verdade: funcionam com Tab e Enter/Espaço.
- Cada uma tem `aria-label` ("Recolher painel de blocos", "Abrir painel de contas"…) e `aria-expanded`, para o leitor de tela dizer se o painel está aberto ou fechado.
- Contorno visível no foco do teclado (`:focus-visible`).

O estado (aberto ou fechado) vale só enquanto a página estiver aberta. Começa sempre com os dois painéis abertos.

## Figma

- "Laboratório · Painéis recolhíveis · 1 abertos (setinhas na borda)"
- "Laboratório · Painéis recolhíveis · 2 fechados (canvas maior)"

Na mesma limpeza, foram apagadas do Figma as telas que não aparecem no app: quadros de animação, rascunhos de ideias, roteiros e versões repetidas do Modo Foco.

## Consequências

- Mais espaço para a rede quando o aluno quer.
- A rede não se reposiciona sozinha quando o canvas cresce. O aluno usa o zoom ou arrasta.
