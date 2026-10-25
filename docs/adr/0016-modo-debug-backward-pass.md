# ADR-0016 · Modo "debug": backward pass passo a passo (adiado)

- **Status:** Aceita, implementação adiada (fora da v1)
- **Data:** 2026-10-19
- **Decisores:** autor do projeto
- **Relacionado:** [ADR-0015](0015-aba-redes-neurais-montagem.md)
- **Atualização (2026-10-22):** o "em aberto" foi decidido na [ADR-0025](0025-bloco-backward-pass.md), com o bloco Backward pass ligado na Saída.

## Contexto

O aprendizado de uma rede tem três etapas: **forward pass** (a entrada vira resposta), **medir o erro** (comparar com o gabarito) e **backward pass** (o erro volta pela rede para decidir quanto ajustar cada peso). O backward pass é o que faz a rede aprender, e também o que mais se beneficia de ser visto.

## Decisão

- No futuro, o laboratório terá um modo passo a passo do **backward pass**, funcionando **como um debug**: o aluno acompanha o erro voltando pela rede e cada peso sendo ajustado.
- **Não entra na v1.** O foco agora é o necessário: forward pass, treino acelerado e resultado ([ADR-0015](0015-aba-redes-neurais-montagem.md)).

## Consequências

- A v1 deve ser construída de forma que esse modo possa ser **adicionado depois**: o cálculo do treino precisa conseguir expor, quando pedido, o erro e o ajuste de cada peso a cada passo.

## Em aberto

- Como o modo debug é aberto, o que ele mostra e como o aluno controla os passos.
