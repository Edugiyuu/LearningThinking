# ADR-0027 · Testes automatizados com Jest

- **Status:** Aceita, em implementação
- **Data:** 2026-10-30
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0017](0017-stack.md) (stack), [ADR-0024](0024-treinar-com-backpropagation.md) e [ADR-0025](0025-bloco-backward-pass.md) (o que os testes de hoje cobrem)

## Contexto

O projeto já tinha testes, mas pouca gente saberia dizer isso olhando de fora, e o autor não sabia. O estado em 2026-10-30:

- **24 testes passando**, em 3 arquivos: `web/lib/backward.test.ts`, `web/lib/foco.test.ts` e `web/lib/treino.test.ts`.
- Rodavam com o **`node --test`**, o executor embutido do Node: `npm test` era `tsc -p tsconfig.teste.json` (compilava os testes para `.teste/`) **e depois** `node --test ".teste/lib/*.test.js"`.
- Cobriam **só funções puras de `lib/`**. Sem nenhum teste de `lib/rede.ts`, `lib/projetos.ts`, `lib/tutoriais.ts`, `lib/progresso-tutoriais.ts`, e **sem nenhum teste de componente ou de tela**.
- Toda a verificação de interface até aqui foi **manual**, a IA abrindo o navegador a cada mudança. Isso prova que funcionou naquele momento; não protege contra quebrar depois sem ninguém notar.

Duas forças empurraram a mudança. A primeira é de produto: o maior estrago possível neste app é **mostrar uma resposta errada em silêncio** (decisão do autor: errar sem avisar é pior do que não rodar, porque o aluno leva o número embora como verdade), e a parte de tela é justamente a que nenhum teste alcança. A segunda é pessoal e declarada: o autor quer **aprender teste automatizado** e o `node --test` não é o que ele vai encontrar no mercado.

Também pesou um achado durante o levantamento: o forward pass está implementado **duas vezes**, em `lib/rede.ts` (desenha a tela) e em `lib/treino.ts` (treina), cada uma com sua própria sigmoide e sua própria ReLU. Existe um teste que compara as duas (`treino.test.ts`), mas **com uma cor só e uma montagem só**. Fechar esse buraco é a primeira coisa depois do Jest de pé.

## Opções consideradas

1. **Ficar no `node --test`.** Zero dependências novas; o `assert.ok` até estreita tipos no TypeScript. Mas não abre caminho para testar tela, e as mensagens de falha são pobres.
2. **Jest.** O padrão de mercado, com caminho oficial no Next (`next/jest`). Traz `expect`, mocks e, quando for a hora, o **jsdom** — um navegador falso em memória, que é o que permite testar componente.
3. **Vitest.** Mais rápido e moderno, API quase igual à do Jest. Descartado por um motivo não técnico e assumido: o autor quer a ferramenta que aparece em vaga e em código de empresa.

## Decisão

Escolhemos o **Jest**, com duas escolhas explícitas do autor:

1. **O `npm test` continua verificando os tipos.** O caminho padrão do Next usa o SWC, que **apaga** os tipos sem conferir — ganharíamos velocidade e perderíamos a rede de proteção que o `tsc` dava. Então `npm test` passou a ser `tsc --noEmit && jest`: a primeira etapa confere os tipos de todo o projeto, a segunda roda os testes rápido.
2. **`assert` sai, `expect` entra** nos 24 testes. Custaria menos mantê-los (o `node:assert` funciona dentro do Jest), mas o objetivo é aprender o idioma do Jest.

Detalhes propostos pela IA e aceitos:

- `testEnvironment: "node"` por enquanto; vira `"jsdom"` no dia em que um componente for testado.
- `describe` agrupando os testes de cada arquivo por assunto.
- `tsconfig.teste.json` e a pasta `.teste/` apagados.
- A migração vai **um arquivo por vez**, começando por `foco.test.ts`, para o autor ver o padrão antes de 24 testes mudarem de uma vez.

## Consequências

**Positivas**
- Mensagem de falha útil. `assert.ok(Math.abs(a - b) < 1e-12)` falhava com "Expected true, Received false", sem dizer os números. `expect(a).toBeCloseTo(b, 12)` imprime o esperado, o recebido, a diferença e a linha.
- Abre a porta para testar componente e tela, que é onde está o risco real (hoje 100% manual).
- `npm test` continua sendo `npm test`: nada muda no que já se digita.

**Negativas / custos**
- 195 pacotes novos em `devDependencies` (`jest` + `@types/jest`), contra zero antes.
- O `npm test` ficou com duas etapas e mais lento: o `tsc` do projeto inteiro leva alguns segundos antes de qualquer teste rodar.
- **O `expect` não estreita tipos.** O `assert.ok(rodada)` convencia o TypeScript de que a variável existe; `expect(rodada).toBeTruthy()` não. Onde isso aparece, o código usa `!` ou um `if (...) throw` explícito — que é mais verboso, mas honesto sobre o que está acontecendo.
- O `assert.equal` aceitava uma mensagem no terceiro argumento (`${a} × ${b}`, dizendo qual par falhou). O `expect` do Jest não tem isso. No teste de 49 pares o rótulo foi perdido; a resposta idiomática é `test.each`, que transformaria aquele teste em 49 — não feito, para não mudar a contagem sem decisão.

**Riscos e mitigação**
- Risco: um teste "passar" por engano durante a migração, por exemplo um `expect` que nunca é executado dentro de um `if`. Mitigação: a contagem de testes antes e depois tem de ser a mesma (24), e cada arquivo é conferido na migração.

## Quando revisitar

- Quando o primeiro teste de componente entrar: aí `testEnvironment` vira `"jsdom"` e entram `@testing-library/react` e `jest-environment-jsdom`.
- Se o `tsc` do `npm test` começar a incomodar no dia a dia: dá para movê-lo para um `npm run tipos` separado e deixá-lo só no CI.
- Se o Jest virar gargalo com muitos testes de tela: o Vitest é a saída, com API quase igual.
