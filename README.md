# LearningThinking

**Entenda IA vendo ela funcionar.** Um laboratório visual, no estilo do Tinkercad, para qualquer pessoa montar e rodar uma rede neural e ver cada conta acontecer, sem precisar programar.

> Status: design da primeira entrega pronto no Figma (Home, Novo projeto, Laboratório) e um teste técnico do laboratório em [`spikes/camada-react-flow/`](spikes/camada-react-flow/README.md). O projeto real começou em [`web/`](web/README.md): a Home, a tela Novo projeto, o Laboratório e os Tutoriais já estão em código ([ADR-0019](docs/adr/0019-projeto-real-home.md), [ADR-0020](docs/adr/0020-laboratorio-em-codigo.md), [ADR-0022](docs/adr/0022-tutoriais-com-a-aqua.md)); falta o Treinar.

## A ideia

- **Laboratório** (produto principal): uma área de trabalho onde você arrasta blocos (Entrada, Camada, Neurônio, Saída), liga com fios e clica em **Rodar** para ver os números atravessarem a rede, **uma conta de cada vez**.
- **Tutoriais** em páginas separadas: explicam o conceito e como usar cada ferramenta, e depois levam você ao laboratório.
- Tudo calculado **no navegador**.

Decisões do autor: [ADR-0013](docs/adr/0013-formato-tutoriais-e-laboratorio.md) a [ADR-0022](docs/adr/0022-tutoriais-com-a-aqua.md). O resto da documentação é uma proposta inicial da IA, em revisão.

## Stack

Next.js · TypeScript · Tailwind CSS · GSAP · React Flow · cálculo da rede em TypeScript próprio · projetos salvos no navegador (localStorage) · Vercel. Sem backend na v1; PostgreSQL e contas depois ([ADR-0017](docs/adr/0017-stack.md)).

## Visual

Tema claro, destaque aqua claro `#5ED3DB` e o mascote **Aqua**, em pixel, que é o logo e aparece pelas telas em várias poses ([design system](docs/04-design-system.md#71-mascote-aqua)).

## Documentação

Comece por [docs/README.md](docs/README.md). Destaques:

- [Laboratório](docs/05-laboratorio.md): o que já foi decidido
- [Design system](docs/04-design-system.md)
- [Decisões (ADRs)](docs/adr/README.md)

## Como trabalhar no repositório

- **Nunca commitar direto na `main`.** Cada mudança nasce numa branch com o tipo na frente: `feat/...` (feature), `docs/...` (documentação), `fix/...`, `chore/...`. Ex.: `feat/home-mascote`, `docs/mascote`.
- A `main` só recebe trabalho por merge/PR.

