# ADR-0010 · Português (pt-BR) primeiro, preparado para i18n

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

O público inicial são alunos brasileiros. Quase todo o bom material visual sobre IA está em inglês — conteúdo em português é um diferencial. Ao mesmo tempo, traduzir depois sem preparação é caro.

## Decisão

- Idioma único no lançamento: **pt-BR**.
- Estrutura já preparada: conteúdo em `content/pt-BR/`, rotas sem prefixo para pt-BR (prefixo `/en/` no futuro), textos de interface em arquivos de mensagens (`messages/pt-BR.json`) — nenhuma string fixa em componentes.
- Termos técnicos: usar o termo mais comum no mercado brasileiro, com o original entre parênteses na primeira menção ("incorporação vetorial (*embedding*)"). Onde o inglês é o uso dominante (RAG, chunk, token), mantém-se o inglês. Decisões ficam no glossário (`content/pt-BR/glossario.yaml`).
- Números e datas formatados com `Intl` (`1.234,5`).

## Consequências

- Pequeno custo inicial de disciplina (sem strings soltas).
- Tradução futura fica restrita a arquivos de conteúdo e mensagens.
