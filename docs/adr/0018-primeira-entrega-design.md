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
3. **Direção visual:** a proposta do [04-design-system.md](../04-design-system.md) (cores, tipografia, claro/escuro, movimento).

### Teste técnico antes da tela do laboratório *(decidido em 2026-10-19)*
- Antes de desenhar a tela 3, faz-se um **teste técnico rápido** (sem design) do **bloco Camada com neurônios arrastáveis no React Flow**.
- O autor testa o resultado; só depois o visual da tela do laboratório é desenhado.

### Home *(decidido em 2026-10-19)*
- A IA tem liberdade criativa para a Home, que influencia pouco o objetivo principal.
- Hero com uma **rede neural clean e cibernética**.
- **Seções abaixo do hero** explicando o projeto; o conteúdo delas pode mudar a qualquer momento.

## Em aberto

- Escopo exato do teste técnico.

## Consequências

- O risco de começar pelo design é ter que **redesenhar** a tela do laboratório se o React Flow não permitir algo do jeito desenhado. O teste técnico em aberto existe para reduzir esse risco.
