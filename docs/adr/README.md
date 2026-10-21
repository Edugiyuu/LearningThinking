# Architecture Decision Records (ADRs)

Registro das decisões de arquitetura do projeto. Formato baseado em [MADR](https://adr.github.io/madr/), escrito em português.

## Como usar

1. Copie [`0000-template.md`](0000-template.md) para `NNNN-titulo-curto.md` (próximo número livre).
2. Preencha com status **Proposta**.
3. Discuta (PR ou conversa) → mude para **Aceita** ou **Rejeitada**.
4. Nunca apague um ADR. Se a decisão mudar, crie um novo e marque o antigo como **Substituída por ADR-XXXX**.

## Índice

| # | Decisão | Status |
|---|---|---|
| [0001](0001-registrar-decisoes-com-adrs.md) | Registrar decisões de arquitetura com ADRs | Proposta (IA) |
| [0002](0002-stack-nextjs-typescript.md) | Next.js + TypeScript, estático-primeiro | Substituída por 0017 |
| [0003](0003-conteudo-em-mdx.md) | Conteúdo das aulas em MDX versionado no Git | Proposta (IA) |
| [0004](0004-nucleo-de-simulacao-compartilhado.md) | Núcleo de simulação compartilhado entre aula e laboratório | Substituída por 0013 |
| [0005](0005-ml-no-navegador.md) | ML roda no navegador: mini-engine própria + Transformers.js em Web Workers | Proposta (IA) |
| [0006](0006-llm-replay-e-ao-vivo.md) | LLM em modo replay por padrão, ao vivo opcional via proxy | Proposta (IA) |
| [0007](0007-estilo-tailwind-radix-tokens.md) | Estilo com Tailwind CSS + Radix + design tokens | Proposta (IA) |
| [0008](0008-animacao-e-visualizacao.md) | Animação com Motion; visualização em SVG/Canvas/WebGL conforme volume | Proposta (IA) |
| [0009](0009-sem-backend-no-mvp.md) | Sem contas nem banco de dados no MVP | Proposta (IA) |
| [0010](0010-i18n-pt-br-primeiro.md) | Português (pt-BR) primeiro, preparado para i18n | Proposta (IA) |
| [0011](0011-acessibilidade-e-movimento.md) | Acessibilidade e *reduced motion* como requisitos | Proposta (IA) |
| [0012](0012-hospedagem-e-ci.md) | Hospedagem na Vercel e CI no GitHub Actions | Proposta (IA) |
| [0013](0013-formato-tutoriais-e-laboratorio.md) | Laboratório estilo Tinkercad + tutoriais em páginas separadas | **Aceita** (autor) |
| [0014](0014-laboratorio-abas-projetos-e-erros.md) | Laboratório: abas por tema, projetos e erros visíveis | **Aceita** (autor) |
| [0015](0015-aba-redes-neurais-montagem.md) | Aba Redes neurais: camadas, neurônios, exemplos e treino | **Aceita** (autor) |
| [0016](0016-modo-debug-backward-pass.md) | Modo "debug": backward pass passo a passo | **Aceita** (autor), adiada |
| [0017](0017-stack.md) | Stack (Next.js, GSAP, React Flow, sem backend na v1) | **Aceita** (autor) |
| [0018](0018-primeira-entrega-design.md) | Primeira entrega: telas no Figma (Home, Novo projeto, Laboratório), tema claro, aqua, logo, fios, contas passo a passo | **Aceita** (autor) |
| [0019](0019-projeto-real-home.md) | Início do projeto real em `web/` e a Home em código | **Aceita** (autor), detalhes propostos pela IA |
| [0020](0020-laboratorio-em-codigo.md) | Laboratório em código a partir do teste técnico, salvando no navegador | **Aceita** (autor), detalhes propostos pela IA |
| [0021](0021-bolinhas-cores-e-espremer.md) | Bolinhas nas linhas (GSAP), verde/vermelho para o sinal, passo do espremer explicado | **Aceita** (autor), detalhes propostos pela IA |
| [0022](0022-tutoriais-com-a-aqua.md) | Tutoriais: trilha com a Aqua e aulas passo a passo com teste rápido | **Aceita** (autor) a aba; formato proposto pela IA, em revisão |
| [0023](0023-sigmoide-em-passos-e-tutorial-01-com-o-lab.md) | Sigmoide em passos (lab e tutorial 03) e tutorial 01 com o exemplo do laboratório | **Aceita** (autor) |
| [0024](0024-treinar-com-backpropagation.md) | Treinar: backpropagation no laboratório (exemplos editáveis, erro ao vivo, gráfico + tabela, passinho em 3 opções) | **Aceita** (autor), detalhes técnicos propostos pela IA |
