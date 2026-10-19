# ADR-0017 · Stack

- **Status:** Aceita (autor)
- **Data:** 2026-10-19
- **Decisores:** autor do projeto
- **Substitui:** [ADR-0002](0002-stack-nextjs-typescript.md) (proposta da IA)

## Contexto

Requisitos que mais pesam na escolha da stack (ver [ADR-0013](0013-formato-tutoriais-e-laboratorio.md) a [ADR-0016](0016-modo-debug-backward-pass.md)):

- O cálculo da rede neural roda **no navegador**.
- Um **editor de blocos** estilo Tinkercad: arrastar, soltar, ligar com fios, destacar erros.
- Muita **visualização animada**: bolinhas, linhas com espessura, passo a passo, treino acelerado.
- **Tutoriais** em páginas separadas.
- Visual premium (Apple, ElevenLabs).
- **Projetos salvos** para o usuário voltar depois.

## Decisões do autor

| Parte | Escolha | Motivo do autor |
|---|---|---|
| Framework | **Next.js** | Já usou Vite, ainda não Next.js: aprender e portfólio |
| Animações | **GSAP** | (não detalhado) |
| Editor de blocos | **React Flow** | Não perder muito tempo construindo do zero |
| Salvar projetos (v1) | **No navegador** ("em cache"), sem conta | Focar no objetivo principal; contas ficam para depois |
| Backend (v1) | **Nenhum** | Consequência da linha anterior |
| Banco de dados | **PostgreSQL, depois da v1** | Aprender (a maioria dos projetos dele usa MongoDB) |

### Treino acelerado
O treino **calcula de verdade**, **grava** o que aconteceu em cada repetição e **reproduz** acelerado (~x100), **sem travar a tela**.

### Adições propostas pela IA e aprovadas pelo autor
| Detalhe | Escolha |
|---|---|
| Linguagem | **TypeScript** |
| Estilo | **Tailwind CSS** |
| Cálculo da rede | **Código próprio em TypeScript** (sem biblioteca de IA), para deixar cada peso e cada conta visíveis |
| Onde o cálculo roda | Na própria página; **Web Worker só se houver travamento** |
| Armazenamento | **`localStorage` com número de versão** do formato do projeto |
| Hospedagem | **Vercel** |

### Validação do React Flow *(2026-10-19)*
O teste técnico em [`spikes/camada-react-flow/`](../../spikes/camada-react-flow/README.md) (Next.js 16, React 19, `@xyflow/react` 12) confirmou que o React Flow aguenta o editor:
- camada com neurônios dentro (nós "filhos");
- fios com regras (sem ciclo, um fio por porta);
- linhas recalculadas a partir dos blocos, com número e edição por duplo clique;
- bloco Entrada com várias saídas;
- destaque da linha da vez no passo a passo.

O cálculo da rede no teste é TypeScript puro (`lib/rede.ts`), sem biblioteca de IA, como decidido. GSAP e Tailwind ainda não foram usados no teste.

## Em aberto

- Contas/login, LGPD e PostgreSQL: decidir quando a v1 estiver pronta.

## Consequências

- Sem backend na v1, o site pode ser publicado como **páginas estáticas**.
- Os projetos salvos ficam **só naquele navegador**: limpar os dados do navegador ou trocar de computador faz perder os projetos.
- Quando as contas chegarem, o Next.js permite colocar o backend **no mesmo projeto** (route handlers / server actions).
