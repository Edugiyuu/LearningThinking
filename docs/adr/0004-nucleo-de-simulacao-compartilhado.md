# ADR-0004 · Núcleo de simulação compartilhado entre aula e laboratório

- **Status:** Substituída por [ADR-0013](0013-formato-tutoriais-e-laboratorio.md)
- **Data:** 2026-10-18

## Contexto

A proposta do produto depende de o aluno ver **exatamente** a mesma coisa na aula e no laboratório, e poder "levar" o estado de um para o outro. Se a aula tiver animações feitas à mão e o laboratório tiver uma implementação real separada, elas vão divergir — e a aula pode acabar mostrando algo que não é verdade.

## Opções consideradas

1. **Animações de aula feitas à mão** (keyframes, vídeos, Lottie) + laboratório separado.
2. **Núcleo de simulação puro por tópico**, consumido por ambos.
3. **Laboratório embutido na aula** com controles escondidos.

## Decisão

**Opção 2.** Cada tópico implementa o contrato `Simulation` (ver [03-arquitetura.md §5](../03-arquitetura.md#5-o-conceito-central-simulação)):

- `init`, `reduce` puros e determinísticos (seed explícita).
- `step` assíncrono para trabalho pesado, delegado a workers.
- `serialize`/`deserialize` para URL e "Abrir no Laboratório".
- Sem dependência de React/DOM — testável com Vitest puro.

A aula é um **roteiro de ações** sobre a simulação; o laboratório expõe os parâmetros como controles.

## Consequências

**Positivas**
- O que a aula mostra é computado de verdade → correção garantida.
- "Abrir no Laboratório" sai de graça.
- Testes de determinismo protegem as aulas contra regressões.

**Negativas**
- Mais trabalho inicial por tópico do que uma animação feita à mão.
- Alguns momentos didáticos são "encenados" (ex.: destacar um único peso). Mitigação: ações de *apresentação* (`highlight`, `focus`, `annotate`) que alteram só a camada visual, nunca o modelo.

## Quando revisitar

Se algum conceito for impossível de simular de forma leve no navegador (ex.: atenção de um LLM grande), usar *replays* gravados que implementam o mesmo contrato, só que lendo dados em vez de calcular.
