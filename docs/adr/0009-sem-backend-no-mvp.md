# ADR-0009 · Sem contas nem banco de dados no MVP

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

Contas permitiriam salvar progresso entre dispositivos e criar turmas. Mas exigem login (atrito), LGPD (dados de alunos, muitos menores de idade), banco de dados e manutenção. O valor central — aulas e laboratório — não depende disso.

## Opções consideradas

1. Contas desde o início (ex.: Supabase Auth + Postgres).
2. **Sem contas no MVP; progresso local; turmas na fase 2.**

## Decisão

**Opção 2.**
- Progresso das aulas e respostas de checkpoint em `localStorage`, com versão de schema.
- Estado de laboratório compartilhável por URL.
- O único "segredo" de servidor é o código de turma do modo ao vivo ([ADR-0006](0006-llm-replay-e-ao-vivo.md)), em variável de ambiente.

## Consequências

**Positivas**
- Zero coleta de dados pessoais → conformidade com LGPD simplificada.
- Nada para manter além de arquivos estáticos e um endpoint.

**Negativas**
- Progresso não sincroniza entre dispositivos.
- Professor não vê o desempenho da turma. Mitigação temporária: botão "exportar meu progresso" que gera um código/arquivo que o aluno pode entregar.

## Quando revisitar

Na fase 2 (turmas), com um ADR próprio cobrindo autenticação, modelo de dados e LGPD (consentimento de responsáveis, minimização de dados).
