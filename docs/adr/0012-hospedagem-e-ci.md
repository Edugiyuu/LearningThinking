# ADR-0012 · Hospedagem na Vercel e CI no GitHub Actions

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

Site majoritariamente estático, com um route handler e assets grandes (modelos ONNX, replays). Precisamos de previews por PR (para revisar aulas) e custo baixo.

## Opções consideradas

1. **Vercel** — suporte nativo a Next.js, previews por PR, plano gratuito generoso.
2. Cloudflare Pages + Workers — ótima CDN e custo, adaptação extra para Next.js.
3. Netlify — semelhante à Vercel, integração Next.js menos direta.
4. Export estático em GitHub Pages — perde o endpoint `/api/llm`.

## Decisão (proposta)

- **Vercel** para o site e o endpoint.
- Modelos grandes servidos de CDN pública do Hugging Face ou de um bucket com cache longo (evita estourar limites de deploy).
- **GitHub Actions** em todo PR: `typecheck` → `lint` (incluindo regras de dependência entre camadas) → `vitest` → build → `playwright` + axe contra o preview.
- Branch `main` protegida; deploy de produção automático no merge.

## Consequências

- Deploy e previews sem configuração.
- Dependência de um fornecedor; mitigada por ser Next.js padrão (portável para Cloudflare/Netlify/Node).

## Quando revisitar

Se o custo do endpoint ao vivo ou da banda de modelos crescer além do plano gratuito.
