// Testes do Modo Foco (ADR-0026). Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { contaArmada, culpaComSinal, mapaDaRede, ondeEstamos, quadroDaIda, quadroDaVolta } from "./foco";
import { voltarCulpa } from "./backward";
import { montagemBasica, prepararRodada } from "./rede";
import { corParaEntradas, lerRede } from "./treino";

const resultado = (telas: ReturnType<typeof contaArmada>) => {
  const ultima = telas.at(-1)!.corpo;
  if (ultima.tipo === "sinalVolta") return ultima.resultado;
  if (ultima.tipo === "arredonda") return ultima.para;
  if (ultima.tipo === "virgula") return ultima.fica;
  if (ultima.tipo === "zero") return ultima.resultado;
  return "?";
};

test("a conta armada do Figma: 0,50 × 0,25 = 0,125", () => {
  const telas = contaArmada("0,50", "0,25", 3);
  assert.equal(resultado(telas), "0,125");
  assert.equal(telas[0].corpo.tipo, "tirar");
  // 5 × 5, depois 5 × 2 uma casa para a esquerda, a soma e a vírgula
  assert.deepEqual(
    telas.map((t) => t.corpo.tipo),
    ["tirar", "armada", "armada", "armada", "virgula"],
  );
});

test("com negativo, o sinal fica de lado e volta no fim: 4,00 × −0,50 = −2,00", () => {
  const telas = contaArmada("4,00", "−0,50", 2);
  assert.equal(telas[0].corpo.tipo, "sinal");
  assert.equal(telas.at(-1)!.corpo.tipo, "sinalVolta");
  assert.equal(resultado(telas), "−2,00");
});

test("a conta armada bate com a conta do computador, arredondada", () => {
  const nums = ["0,22", "−0,64", "1,37", "0,05", "−3,10", "2,00", "0,99"];
  for (const a of nums)
    for (const b of nums) {
      const n = (s: string) => Number(s.replace("−", "-").replace(",", "."));
      const esperado = (Math.round(n(a) * n(b) * 100 + Number.EPSILON * Math.sign(n(a) * n(b))) / 100).toFixed(2).replace(".", ",").replace("-", "−");
      const r = resultado(contaArmada(a, b, 2));
      // −0,00 não existe na tela: o sinal some quando o resultado arredonda para zero
      assert.equal(r.replace(/^−(0,00)$/, "$1"), esperado.replace(/^−(0,00)$/, "$1"), `${a} × ${b}`);
    }
});

test("vezes zero é uma tela só", () => {
  const telas = contaArmada("0,00", "0,64", 2);
  assert.equal(telas.length, 1);
  assert.equal(resultado(telas), "0,00");
});

test("o quadro da ida mostra todas as linhas do neurônio com a da vez acesa", () => {
  const m = montagemBasica();
  const { rodada } = prepararRodada(m.nodes, m.fios, m.pesos);
  assert.ok(rodada);
  const i = rodada.passos.findIndex((p) => p.tipo === "termo");
  const q = quadroDaIda(rodada, i);
  assert.ok(q && q.tipo === "neuronio");
  assert.equal(q.partes.filter((p) => p.agora).length, 1);
  const soma = q.partes.reduce((s, p) => s + p.parte, 0);
  assert.ok(Math.abs(soma - q.soma) < 1e-12);
});

test("no e se? a linha acesa é a que deixa o erro menor", () => {
  const m = montagemBasica();
  const lida = lerRede(m.nodes, m.fios, m.pesos);
  assert.ok(lida);
  const passos = voltarCulpa({ rede: lida.rede, pesos: lida.pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
  for (let i = 0; i < passos.length; i++) {
    const q = quadroDaVolta(passos, i);
    if (q?.tipo !== "linha" || !q.eSe) continue;
    // culpa + → o peso desce; culpa − → sobe
    assert.equal(q.eSe.desce.melhora, q.culpa > 0);
    assert.equal(q.eSe.sobe.melhora, q.culpa < 0);
    assert.ok((q.salvo < q.antes) === q.culpa > 0);
  }
});

test("a culpa com sinal", () => {
  assert.equal(culpaComSinal(0.125), "+0,125");
  assert.equal(culpaComSinal(-0.05), "−0,050");
  assert.equal(culpaComSinal(0.0002), "menos de 0,001 (+)");
});

test("o mapa da rede tem Entrada, as camadas e a Saída, e acompanha a ida e a volta", () => {
  const m = montagemBasica();
  const { rodada } = prepararRodada(m.nodes, m.fios, m.pesos);
  assert.ok(rodada);
  const mapa = mapaDaRede(rodada);
  assert.equal(mapa.colunas[0].nome, "Entrada");
  assert.equal(mapa.colunas.at(-1)!.nome, "Saída");
  assert.equal(mapa.colunas[0].nos.length, 3);
  // na ida, a coluna nunca volta
  let antes = 0;
  rodada.passos.forEach((_, i) => {
    const o = ondeEstamos(rodada, mapa, null, i);
    assert.ok(o.coluna >= antes);
    antes = o.coluna;
  });
  // a volta começa na Saída e termina na Entrada (no meio ela vai neurônio por neurônio)
  const lida = lerRede(m.nodes, m.fios, m.pesos);
  assert.ok(lida);
  const volta = voltarCulpa({ rede: lida.rede, pesos: lida.pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
  const daIda = rodada.passos.length;
  assert.equal(ondeEstamos(rodada, mapa, volta, daIda).coluna, mapa.colunas.length - 1);
  assert.equal(ondeEstamos(rodada, mapa, volta, daIda + volta.length - 1).coluna, 0);
});
