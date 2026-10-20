# 06 · Roadmap

> ⚠️ **Em revisão.** As fases abaixo são uma proposta da IA anterior ao [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md). Itens como "aulas em scrollytelling", "Abrir no Laboratório", "tema claro/escuro" e os laboratórios L1–L5 não valem mais. O caminho decidido pelo autor está abaixo.

## O que está acontecendo de verdade

Primeira entrega ([ADR-0018](adr/0018-primeira-entrega-design.md)):
- [x] Stack decidida ([ADR-0017](adr/0017-stack.md))
- [x] Teste técnico do laboratório no React Flow ([`spikes/camada-react-flow/`](../spikes/camada-react-flow/README.md)): blocos, fios, pesos, Rodar com erros e contas passo a passo
- [x] Home no Figma (tema claro, aqua, logo Aqua)
- [x] Tela Novo projeto no Figma
- [x] Tela do Laboratório no Figma

Projeto real em [`web/`](../web) ([ADR-0019](adr/0019-projeto-real-home.md)):
- [x] Home em código, igual ao Figma (com a Aqua)
- [x] Tela Novo projeto em código (salva o projeto no navegador)
- [x] Laboratório em código, a partir do teste técnico ([ADR-0020](adr/0020-laboratorio-em-codigo.md)); Treinar ainda desligado

Tutoriais ([ADR-0022](adr/0022-tutoriais-com-a-aqua.md)):
- [x] Telas no Figma: Tutoriais e a aula O neurônio (cérebro, cérebro × IA, fim com teste rápido)
- [x] Em código: lista em trilha e 4 tutoriais (O neurônio, Os pesos, A sigmoide, Camadas e fios), com progresso no navegador
- [ ] 05 · Como a rede aprende (depois do Treinar)

Próximos passos (a decidir com o autor):
- [ ] Treinar (repetições, x100, saídas no fim)
- [x] Salvar projetos no navegador (o último projeto criado; falta a lista de projetos)
- [ ] Aba Busca por significado

---

> Proposta original (fases por entrega de valor, não por data; cada fase termina com algo usável em sala):

## Fase 0 · Fundação

- [ ] Repositório, pnpm, Next.js, TypeScript strict, lint com regras de camadas
- [ ] Design system: tokens, tipografia, tema claro/escuro, primitivos (Button, Slider, Tabs, Tooltip)
- [ ] Contrato `Simulation` + Lesson Runtime (`<Scrolly>`, `<Step>`) + Lab Runtime (`<LabShell>`, `<Transport>`)
- [ ] Pipeline de conteúdo MDX com validação de frontmatter
- [ ] CI (typecheck, lint, testes, build) e deploy de preview
- [ ] Home com herói animado e cartões de módulos

**Pronto quando:** existe uma aula "esqueleto" com 3 passos ligados a uma simulação de brinquedo, e o botão "Abrir no Laboratório" funciona.

## Fase 1 · MVP (redes neurais + RAG)

- [ ] Mini-engine neural com testes de gradiente
- [ ] Módulo 0 completo (3 aulas)
- [ ] Módulo 1 completo (6 aulas) + **L1 Playground Neural**
- [ ] Worker de embeddings (Transformers.js) + coleções pré-calculadas
- [ ] Módulo 3 (3 aulas) + **L2 Mapa de Significados**
- [ ] Módulo 4 completo (6 aulas) + **L3 Monte seu RAG** (replay)
- [ ] Checkpoints e progresso local
- [ ] Modo apresentação
- [ ] Auditoria de acessibilidade

**Pronto quando:** um aluno sem conhecimento prévio consegue fazer a trilha 0 → 1 → 3 → 4 e explicar o fluxo do RAG.

## Fase 2 · Raciocínio, aprendizado contínuo e LLM ao vivo

- [ ] Script de gravação de replays + replays de todos os presets
- [ ] Módulo 2 (LLMs) + Tokenizador & Amostragem
- [ ] Módulo 5 (Deep thinking) + **L4 Orçamento de Pensamento**
- [ ] Módulo 6 (Aprendizado contínuo) + **L5 Não Esqueça**
- [ ] Endpoint `/api/llm` com código de turma, rate limit e tetos
- [ ] Glossário navegável

## Fase 3 · Turmas e agentes

- [ ] ADR de backend (auth, dados, LGPD) → contas opcionais para professor
- [ ] Turmas: professor cria turma, alunos entram por código, painel de progresso
- [ ] Módulo 7 (Agentes) + laboratório de agente com ferramentas
- [ ] Versão em inglês

## Fora do escopo (por enquanto)

Certificados, pagamentos, fórum, app nativo.
