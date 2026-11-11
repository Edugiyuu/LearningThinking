# ADR-0033 · Publicar o site no GitHub Pages

- **Status:** Aceita (autor), código feito (2026-11-10)
- **Data:** 2026-11-10
- **Decisores:** Eduardo (autor), com detalhes técnicos propostos pela IA
- **Substitui:** a linha "Hospedagem: Vercel" da [ADR-0017](0017-stack.md) e a hospedagem da [ADR-0012](0012-hospedagem-e-ci.md) (proposta da IA)

## Contexto

O autor pediu para publicar o site no **GitHub Pages**: "como é só o frontend, não precisamos de backend por enquanto". Isso bate com a [ADR-0017](0017-stack.md): sem backend na v1, tudo roda no navegador e os projetos ficam no `localStorage`.

O GitHub Pages só serve **arquivos prontos** (HTML, CSS, JS, imagens). Não roda servidor. Então o Next.js precisa gerar o site inteiro na hora do build: isso é o **export estático** (`output: "export"`, o build cria a pasta `out/` com uma página HTML por rota).

## Opções consideradas

1. **GitHub Pages com export estático**: grátis, no mesmo lugar do código, sem conta nova. Sem servidor.
2. **Vercel** (o que a ADR-0017 dizia): suporta tudo do Next.js, mas é outra conta e hoje não usamos nada que precise de servidor.

## Decisão

**GitHub Pages**, com deploy automático pelo **GitHub Actions** (o robô do GitHub que roda tarefas a cada push).

### O workflow (`.github/workflows/deploy-pages.yml`)

A cada push na `main` que mexe em `web/` (ou no próprio workflow), ele:

1. instala as dependências (`npm ci`);
2. roda `npm test` (tipos + Jest) e `npm run lint`: se algum falhar, **não publica**;
3. roda `npm run build` com `BASE_PATH=/LearningThinking`;
4. publica a pasta `web/out/` no Pages.

Também dá para rodar à mão na aba **Actions** do GitHub (`workflow_dispatch`).

Endereço: **https://edugiyuu.github.io/LearningThinking/**

### O que mudou no código

- **`next.config.ts`**
  - `output: "export"`: gera o site estático em `out/`.
  - `basePath` vem da variável `BASE_PATH`. No Pages o site não mora na raiz do domínio, e sim em `/LearningThinking`; o `basePath` põe esse prefixo em todos os links e arquivos. No `npm run dev` ela fica vazia e o site abre em `/`, como antes.
  - `trailingSlash: true`: `/laboratorio/` vira `laboratorio/index.html`, que o Pages entende sem configuração.
  - `images: { unoptimized: true }`: a otimização de imagem do Next precisa de servidor.
  - Saíram `cacheComponents` e `partialPrefetching`. O **Cache Components** liga o **PPR** (*Partial Prerendering*: parte da página pronta, parte gerada no servidor a cada visita), que precisa de servidor e o build recusa em export. O código não usava `"use cache"`, então nada mudou para o aluno.
- **Tutoriais (`?passo=3`)**: antes o servidor lia o `?passo=` da URL. No site estático não há servidor, então quem lê agora é o navegador: `components/tutoriais/AulaDaUrl.tsx` usa `useSearchParams` e fica atrás de um `Suspense` (enquanto lê, aparece a moldura da aula). A página continua gerando uma página por aula com `generateStaticParams`.
- **Ilustrações da Home**: o `<Image>` com `unoptimized` não põe o `basePath` sozinho nos arquivos de `public/`. O `next.config.ts` expõe `NEXT_PUBLIC_BASE_PATH` e a Home monta o caminho com ele.

### Conferido antes de publicar

Build com `BASE_PATH=/LearningThinking` servido localmente em `/LearningThinking/`: Home com as 3 ilustrações, tutorial aberto direto no `?passo=3`, laboratório e navegação entre páginas sem recarregar.

## Consequências

**Positivas**
- Publicar é só fazer merge na `main`.
- Testes e lint viram uma barreira: código quebrado não chega ao site.
- Grátis e sem conta nova.

**Negativas / custos**
- Nada que precise de servidor funciona: route handlers com `Request`, cookies, `"use cache"`, PPR, otimização de imagem.
- Sem preview por PR (a Vercel tinha).
- Arquivos novos em `public/` usados com caminho fixo (`"/algo.svg"`) precisam do prefixo `NEXT_PUBLIC_BASE_PATH`.

**Riscos e mitigação**
- **Prefetch com 404 no console.** O Next 16.4 pede o arquivo de prefetch como `__next.laboratorio.__PAGE__.txt`, mas o export grava `__next.laboratorio/__PAGE__.txt`. O prefetch falha e o Next usa o arquivo completo da página (`index.txt`); a navegação funciona normal. Revisitar quando atualizar o Next.

## Quando revisitar

- Quando chegarem contas, login e PostgreSQL (depois da v1, ADR-0017): aí precisa de servidor, e a Vercel (ou outro) volta à mesa.
- Se o projeto precisar de preview por PR.
