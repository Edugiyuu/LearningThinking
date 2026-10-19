# ADR-0002 · Next.js + TypeScript, estático-primeiro

- **Status:** Substituída por [ADR-0017](0017-stack.md)
- **Data:** 2026-10-18

## Contexto

Precisamos de:
- Páginas de aula rápidas, indexáveis por buscadores e compartilháveis (SEO, preview de link).
- Interatividade pesada (simulações, workers, WebGPU) no cliente.
- Um único endpoint de servidor para o modo LLM ao vivo.
- Ecossistema grande de componentes React (Radix, Motion, visx).

## Opções consideradas

1. **Next.js (App Router) + React + TypeScript**
2. **Astro + ilhas React** — ótimo para conteúdo, mas o laboratório é praticamente uma aplicação inteira; ilhas viram atrito.
3. **Vite + React SPA** — simples, mas perde SSG/SEO e precisa de outro lugar para o endpoint de servidor.
4. **SvelteKit** — excelente performance, porém ecossistema menor para os componentes que queremos e menos familiar para colaboradores.

## Decisão

**Next.js (App Router, versão estável mais recente) + React + TypeScript em modo `strict`**, com:
- Aulas e módulos gerados estaticamente (SSG) a partir do MDX.
- Laboratórios como páginas estáticas com componentes cliente carregados sob demanda.
- Um route handler (`/api/llm`) como único código de servidor.
- Gerenciador de pacotes **pnpm**.

## Consequências

**Positivas**
- Um só framework para conteúdo, aplicação e endpoint.
- Deploy trivial em CDN/edge.

**Negativas**
- Next.js tem complexidade própria (server × client components). Mitigação: regra simples — tudo em `sims/`, `lesson/`, `lab/` é cliente; páginas e layout são servidor.

## Quando revisitar

Se o endpoint de servidor crescer para algo além de um proxy (ex.: turmas, painel do professor), reavaliar com o ADR de backend.
