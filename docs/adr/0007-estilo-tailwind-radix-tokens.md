# ADR-0007 · Estilo com Tailwind CSS + Radix + design tokens

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

> **Atualização (2026-10-19):** o [ADR-0017](0017-stack.md) confirmou **Tailwind CSS** (Radix ainda não foi decidido). O [ADR-0018](0018-primeira-entrega-design.md) definiu **só o tema claro** na v1 e o destaque **aqua claro `#5ED3DB`**. Por isso, a variante `[data-theme="dark"]` citada abaixo fica para o futuro.

## Contexto

O visual precisa ser premium (referências: Apple, ElevenLabs), consistente entre aula e laboratório, com tema claro/escuro e cores por módulo. Também precisamos de componentes acessíveis (sliders, popovers, diálogos) sem reinventar foco, teclado e ARIA.

## Opções consideradas

1. **Tailwind CSS (v4) + Radix Primitives + tokens em CSS custom properties** (com componentes no estilo shadcn/ui, copiados para o repo e customizados).
2. CSS Modules + biblioteca de componentes pronta (MUI, Chakra) — visual "de biblioteca", difícil de chegar ao nível desejado.
3. CSS-in-JS em runtime (styled-components) — custo de runtime e atrito com server components.

## Decisão

**Opção 1.**

- Tokens definidos em `src/design-system/tokens.css` como custom properties (cores, tipografia, espaço, raio, movimento), com variantes `[data-theme="dark"]` e `[data-module="rag"]`.
- Tailwind v4 lê os tokens via `@theme`, então classes como `bg-surface` ou `text-accent` respeitam tema e módulo automaticamente.
- Radix Primitives para comportamento acessível; estilo 100% nosso.
- Ícones: Lucide (linha fina, combina com a estética).
- Fontes: Geist Sans/Mono via `next/font` (self-hosted, sem layout shift).

## Consequências

**Positivas**
- Troca de tema e de módulo é só mudar um atributo.
- Componentes acessíveis por padrão.
- Nenhum CSS em runtime.

**Negativas**
- Classes utilitárias longas. Mitigação: componentes do design system encapsulam variantes (`cva`), páginas quase não usam classes cruas.

## Quando revisitar

Se o design system for reutilizado em outro projeto, extrair para um pacote separado.
