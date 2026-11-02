# 08 · Testes

Cola rápida dos testes automatizados do projeto. Decisões e porquês: [ADR-0027](adr/0027-testes-com-jest.md).

## Comandos

Todos rodam de dentro de `web/`, ou com `--prefix web` de fora.

```bash
npm test                       # o completo: confere os tipos (tsc) e roda todos os testes
npx jest --watch               # fica rodando e refaz sozinho a cada vez que você salva  ← o do dia a dia
npx jest --coverage            # tabela do que NÃO tem teste
npx jest lib/rede.test.ts      # só um arquivo
npx jest -t "arredondado"      # só os testes cujo nome contém esse texto
npx tsc --noEmit               # só a conferência de tipos, sem rodar teste
```

O `npm test` é `tsc --noEmit && jest`: se os tipos estiverem errados, ele **nem chega** a rodar os testes.

## O molde de um teste

```ts
test("o nome que aparece quando quebra", () => {
  expect(aFuncao(entrada)).toBe(saidaEsperada);
});
```

- `expect(...)` = "confere isso"
- `.toBe(...)` = "tem que ser aquilo"
- O ponto fica **fora** do parêntese do `expect`. `expect(f(8)).toBe(5)`, nunca `expect(f(8).toBe(5))`.
- `describe("assunto", () => { ... })` só agrupa testes. Não muda nada no que é testado.
- `test.todo("nome")` deixa um teste **pendente**, sem fingir que passou.

## toBe ou toEqual

| O que a função devolve | Use |
|---|---|
| número, texto, `true`/`false`, `null` | `toBe` |
| lista (`[...]`) ou objeto (`{...}`) | `toEqual` |

**`toBe` numa lista FALHA**, mesmo com o conteúdo igual — e a mensagem é confusa ("Received: serializes to the same string"). Motivo: `toBe` pergunta "é a mesma coisa?" e `toEqual` pergunta "tem o mesmo conteúdo?". Duas listas com o mesmo conteúdo são duas listas.

## Os outros verificadores

Todos fazem o que o `toBe` faria. **Existem só para a mensagem de falha ser útil** — nenhum é obrigatório.

| Em vez de | Escreva | Ganho |
|---|---|---|
| `expect(x.length).toBe(3)` | `expect(x).toHaveLength(3)` | diz o tamanho que veio |
| `expect(x < 0.1).toBe(true)` | `expect(x).toBeLessThan(0.1)` | mostra o número, não só `false` |
| `expect(Math.abs(a-b) < 1e-12).toBe(true)` | `expect(a).toBeCloseTo(b, 12)` | mostra os dois números e a diferença |
| `expect(!!x).toBe(true)` | `expect(x).toBeTruthy()` | atalho |

`toBeCloseTo(x, n)` quer dizer "diferença menor que **metade** de 10⁻ⁿ" — mais apertado do que parece. Para manter um limite exato, prefira `toBeLessThan`.

Qualquer outro: pesquise "jest matcher para X". O único que não se pesquisa na hora é `toBe` × `toEqual`, porque quem não sabe fica meia hora olhando dois valores idênticos na tela.

## Onde os testes ficam

```
web/lib/
├─ rede.test.ts        # limitarPeso, formatar
├─ backward.test.ts    # a culpa voltando, pesoSalvo, sinalDaMudanca, formatarCulpa
├─ foco.test.ts        # conta armada do Modo Foco, quadro, mapa da rede
└─ treino.test.ts      # corParaEntradas, forward, gradiente, treino
```

Um arquivo novo é só `lib/<nome>.test.ts` — o `testMatch` do [jest.config.mjs](../web/jest.config.mjs) acha sozinho. Nada para registrar em lugar nenhum.

## As quatro armadilhas

1. **Nunca rode o código e copie o resultado para dentro do `expect`.** Se o código tem bug, o teste passa a defender o bug. Escreva o valor esperado **de cabeça, antes de rodar**.
2. **Veja vermelho antes de verde.** Um teste que você nunca viu falhar não provou nada — pode nem estar rodando.
3. **O nome do teste não quer dizer nada para o computador.** É bilhete para humanos. Um teste chamado "peso vira banana" passa, se o `expect` dentro dele fechar.
4. **Teste a borda e o estranho, não só o chato.** Para cada função pense em três entradas: o caso normal (quase nunca quebra), o limite / zero / vazio, e o torto (negativo, casas demais). Os bugs moram nos dois últimos.

## Onde a cobertura estava em 2026-11-02

Saída de `npx jest --coverage`, para comparar depois:

```
File         | % Stmts | % Branch | % Funcs | % Lines
All files    |   78.79 |    66.47 |   83.55 |   81.64
 backward.ts |     100 |    84.61 |     100 |     100
 foco.ts     |   94.38 |    82.94 |     100 |   96.66
 rede.ts     |    53.9 |     37.5 |   66.21 |   57.27
 treino.ts   |   97.26 |       75 |     100 |   98.16
```

Cuidado ao ler: o `rede.ts` marca 53,9% **sem ter quase nenhum teste próprio** — ele aparece coberto porque os testes dos outros arquivos chamam funções dele de passagem (`montagemBasica`, `prepararRodada`). Cobertura mede **linha executada**, não **comportamento afirmado**. Linha executada sem nenhum `expect` em cima conta como coberta e não protege nada.

As colunas: `Stmts` linhas executadas, `Branch` caminhos de `if` percorridos, `Funcs` funções chamadas, `Lines` linhas do arquivo. `Branch` é a mais honesta das quatro, e é sempre a mais baixa.

## O que os testes alcançam hoje

**Alcançam:** as funções puras de `web/lib/` — contas, formatação, regras.

**Não alcançam:** nenhum componente, nenhuma tela. Toda a verificação de interface é manual, abrindo o navegador. É a maior lacuna, e é onde está o risco real: uma resposta errada na tela do aluno não dispara erro no console.

Para fechar isso: `testEnvironment: "jsdom"` no lugar de `"node"`, mais `@testing-library/react` e `jest-environment-jsdom`. Depois disso vêm os mocks (ex.: `lib/projetos.ts` usa `localStorage`, que não existe fora do navegador).
