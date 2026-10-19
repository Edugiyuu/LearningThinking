# ADR-0001 · Registrar decisões de arquitetura com ADRs

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

O projeto começa pequeno, mas vai acumular decisões (stack, onde roda o ML, como lidar com LLMs pagos) que não ficam óbvias lendo o código. Futuros colaboradores — inclusive alunos — precisam entender **por que** as coisas são como são.

## Opções consideradas

1. Não documentar; o código fala por si.
2. Um documento único de arquitetura atualizado sempre.
3. ADRs curtos, numerados e imutáveis, mais um documento de visão geral.

## Decisão

**Opção 3.** ADRs em `docs/adr/` no formato do [template](0000-template.md), e [03-arquitetura.md](../03-arquitetura.md) como visão consolidada que aponta para eles.

## Consequências

- Histórico claro de decisões, inclusive das que mudaram.
- Custo pequeno de escrita a cada decisão relevante.
- Regra prática: se a decisão é difícil de desfazer ou foi debatida, vira ADR.
