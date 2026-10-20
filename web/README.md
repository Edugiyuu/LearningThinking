# web · LearningThinking

O site de verdade (Next.js 16 + TypeScript + Tailwind CSS 4). Decisões em [ADR-0017](../docs/adr/0017-stack.md) e [ADR-0019](../docs/adr/0019-projeto-real-home.md).

```bash
npm install
npm run dev
```

No preview do Claude Code, use o servidor **"web"** (porta 3100).

## Onde está cada coisa

- `app/page.tsx`: Home
- `app/novo-projeto/`: tela Novo projeto
- `app/laboratorio/` e `components/laboratorio/`: o laboratório (vindo do teste técnico)
- `lib/rede.ts`: as regras da rede (blocos, fios, pesos, rodada, passo a passo)
- `lib/projetos.ts`: projetos salvos no navegador
- `app/globals.css`: tokens do [design system](../docs/04-design-system.md)
- `components/mascote.tsx`: a Aqua e o mascote do Claude em pixel
- `components/rede-heroi.tsx`: a rede neural do herói
- `public/ilustracoes/`: ilustrações dos cards "Como funciona"
