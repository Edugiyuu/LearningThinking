# ADR-0013 · Laboratório estilo Tinkercad + tutoriais em páginas separadas

- **Status:** Aceita
- **Data:** 2026-10-18
- **Decisores:** autor do projeto
- **Substitui:** [ADR-0004](0004-nucleo-de-simulacao-compartilhado.md)

## Contexto

A documentação inicial (escrita como proposta) via o produto como "aulas em scrollytelling + um sandbox que espelha a aula". O autor redefiniu o produto tomando como referência o **Tinkercad**: o centro é uma ferramenta onde se constrói e se testa algo, e as explicações servem para preparar o aluno para usar essa ferramenta.

## Decisão

1. **O laboratório é o produto principal.** É uma área de trabalho no estilo do Tinkercad, onde o aluno monta e roda coisas de IA (ex.: arrastar uma rede neural e conectá-la a outros elementos; fazer um modelo reconhecer imagens de cachorro).
2. **Os tutoriais ficam em páginas separadas**, fora da área de trabalho. Eles ensinam o conceito e como usar as ferramentas do laboratório.
3. **Os conceitos de IA são aprendidos nos dois lugares:** o aluno vê o tutorial e depois pratica aquilo no laboratório.
4. **Tutoriais e laboratório são ligados:** o tutorial mostra e leva ao laboratório correspondente.
5. **O cálculo do laboratório roda no navegador** do aluno.

## Em aberto

- O que exatamente é um "bloco" no laboratório e como os blocos se conectam.
- Quais ferramentas/projetos entram na primeira versão.
- Se o aluno conecta blocos livremente ou parte de montagens prontas.
- Como o tutorial "mostra" o laboratório (link, prévia, outro formato).
- Se as visualizações dos tutoriais são roteirizadas ou calculadas.
- Como oferecer recursos que dependem de um LLM grande (RAG, deep thinking), já que ele não roda no navegador.

## Consequências

- O ADR-0004 (núcleo compartilhado entre aula e sandbox, botão "Abrir no Laboratório" com o mesmo estado) deixa de valer.
- [02-curriculo.md](../02-curriculo.md), [03-arquitetura.md](../03-arquitetura.md) e [05-laboratorio.md](../05-laboratorio.md) precisam ser revistos à luz desta decisão. Até lá, cada um tem um aviso no topo.
