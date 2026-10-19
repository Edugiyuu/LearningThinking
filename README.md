# LearningThinking

**Entenda IA vendo ela funcionar.** Aulas visuais e um laboratório interativo para qualquer pessoa entender redes neurais, LLMs, embeddings, RAG, deep thinking e aprendizado contínuo — sem precisar programar.

> Status: fase de documentação e arquitetura. Ainda não há código.

## A ideia

- **Laboratório** (produto principal): uma área de trabalho no estilo do Tinkercad, onde você monta e roda coisas de IA.
- **Tutoriais** em páginas separadas: explicam o conceito e como usar cada ferramenta, e depois levam você ao laboratório.
- O cálculo roda **no navegador**.

Veja o [ADR-0013](docs/adr/0013-formato-tutoriais-e-laboratorio.md). O resto da documentação é uma proposta inicial em revisão.

## Stack planejada

Next.js · TypeScript · MDX · Tailwind CSS · Radix · Motion · Web Workers · mini-engine neural própria · Transformers.js · Claude API (modo ao vivo opcional)

## Documentação

Comece por [docs/README.md](docs/README.md). Destaques:

- [Visão do produto](docs/01-visao-produto.md)
- [Currículo](docs/02-curriculo.md)
- [Arquitetura](docs/03-arquitetura.md)
- [Design system](docs/04-design-system.md)
- [Decisões de arquitetura (ADRs)](docs/adr/README.md)
