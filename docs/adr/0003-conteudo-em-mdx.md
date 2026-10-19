# ADR-0003 · Conteúdo das aulas em MDX versionado no Git

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

As aulas misturam texto corrido com componentes interativos (`<Scrolly>`, `<Step>`, `<Checkpoint>`). O autor principal é um professor que sabe editar arquivos de texto. Revisões e histórico de mudanças são importantes.

## Opções consideradas

1. **MDX no repositório** (com camada de conteúdo tipada, ex.: Velite ou Content Collections).
2. **CMS headless** (Sanity, Contentful, Payload) — boa UI de edição, mas componentes interativos ficam desajeitados e adiciona custo/dependência.
3. **JSON/YAML de roteiros + texto separado** — mais estruturado, mas ruim de escrever.

## Decisão

**MDX em `content/<idioma>/<modulo>/<aula>.mdx`**, com frontmatter validado por schema (Zod):

```yaml
---
title: "O que acontece quando você pergunta a um RAG"
module: 4
order: 3
duration: 12        # minutos
sim: rag-pipeline   # simulação usada no Scrolly
objectives:
  - "Explicar o papel do top-k"
glossary: [embedding, chunk, top-k]
---
```

Exemplo de corpo:

```mdx
<Scrolly sim="rag-pipeline" seed={7}>
  <Step action={{ type: "load-collection", id: "escola" }}>
    Imagine o manual de uma escola com 40 páginas…
  </Step>
  <Step action={{ type: "chunk", size: 300, overlap: 50 }}>
    Primeiro, o texto é cortado em pedaços — os **chunks**.
  </Step>
</Scrolly>
```

## Consequências

**Positivas**
- Conteúdo revisável em PR, com histórico.
- Componentes interativos são cidadãos de primeira classe.
- Build falha se o frontmatter ou uma `action` for inválida (tipos gerados a partir das simulações).

**Negativas**
- Editar exige noções de Markdown e Git. Mitigação: [guia de conteúdo](../07-guia-de-conteudo.md) e templates prontos.

## Quando revisitar

Se mais autores não técnicos entrarem no projeto, considerar um CMS Git-based (ex.: Keystatic/TinaCMS) por cima dos mesmos arquivos MDX.
