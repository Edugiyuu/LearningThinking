# ADR-0019 · Início do projeto real: pasta `web/` e a Home em código

- **Status:** Aceita (autor) para começar pelas telas; detalhes técnicos são *proposta da IA*
- **Data:** 2026-10-19
- **Decisores:** autor do projeto

## Contexto

Com as telas da primeira entrega prontas no Figma ([ADR-0018](0018-primeira-entrega-design.md)), o autor pediu para fazer as telas em código, **começando pela Home e depois a tela Novo projeto, iguais ao Figma**. A stack já estava decidida ([ADR-0017](0017-stack.md)).

## Decisão

1. **Ordem (autor):** Home → Novo projeto → (depois) Laboratório.
2. **A Home segue o frame "Home · Desktop · mascote"**, com a Aqua nas seções. No card "Aprenda o conceito" fica a versão A (lâmpada em cima) até o autor escolher entre A e E no frame "Mascote · versões".
3. *Proposta da IA:*
   - **O projeto real fica em `web/`** (Next.js 16 + TypeScript + Tailwind CSS 4, criado com `create-next-app`, App Router). O teste técnico continua separado em `spikes/`.
   - **Fonte Inter**, porque as telas no Figma usam Inter. Geist Mono continua para números e código. O design system dizia "Geist Sans, ou Inter como reserva"; agora vale o que está no Figma.
   - **Tokens do design system como variáveis CSS** em `web/app/globals.css`, expostas ao Tailwind (`bg-aqua`, `text-aqua-ink`, `bg-bg-subtle`, ...).
   - **A Aqua e o mascote do Claude são componentes React** (`web/components/mascote.tsx`), desenhados por uma lista de células da grade. Assim cada pose (normal, contente, dormindo) muda só os olhos e as bochechas.
   - **A rede do herói é montada a partir dos dados** (`web/components/rede-heroi.tsx`: posições das camadas e os dois caminhos destacados), em vez de colar o SVG do Figma, que tinha milhares de linhas achatadas. Fica leve e pronta para animar com GSAP.
   - **As ilustrações dos três cards** de "Como funciona" são **arquivos SVG** em `web/public/ilustracoes/`, exportados do mesmo desenho do Figma.
   - Os links **Tutoriais, Laboratório e Sobre** apontam para páginas que ainda não existem.
   - Para rodar: no preview do Claude Code, o servidor **"web"** (`.claude/launch.json`, porta 3100).

## Tela Novo projeto *(2026-10-19)*

- Em código em `web/app/novo-projeto/`, igual ao frame "Novo projeto · Desktop": tema (só Redes neurais disponível; Busca por significado e RAG "Em breve", sem clique), Básico pronto ou Vazio, e o nome do projeto.
- *Proposta da IA:*
  - As escolhas são **botões de rádio de verdade** (escondidos, dentro de cada card), para funcionar com teclado e leitor de tela.
  - **Criar projeto salva o projeto no navegador** (`web/lib/projetos.ts`: `localStorage`, formato com `versao: 1`, como pede o [ADR-0017](0017-stack.md)) e abre `/laboratorio`.
  - Enquanto o laboratório não existe em código, **`/laboratorio` é uma página provisória** com a Aqua, dizendo que o projeto foi salvo.
  - A barra das telas internas (logo + "← Voltar para a Home") virou o componente `TopoSimples`.

## Consequências

- A Home roda e foi conferida no navegador: em 1440px bate com o Figma e em 375px (celular) não tem rolagem lateral. No celular, o botão "Criar novo projeto" da barra some e fica só o do herói.
- Ainda não há animação (GSAP) na Home.
- Se o autor trocar a versão do card "Aprenda o conceito", basta substituir `web/public/ilustracoes/aprenda-o-conceito.svg`.
