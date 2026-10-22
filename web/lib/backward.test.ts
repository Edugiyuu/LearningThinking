// Testes do backward pass passo a passo (ADR-0025). Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { voltarCulpa, sinalDaMudanca, type PassoVolta } from "./backward";
import { montagemBasica } from "./rede";
import { EXEMPLOS_PRONTOS, corParaEntradas, lerRede, retropropagar, sortearPesos } from "./treino";

const basica = () => {
  const m = montagemBasica();
  const lida = lerRede(m.nodes, m.fios, m.pesos);
  assert.ok(lida);
  return lida;
};

type Linha = Extract<PassoVolta, { tipo: "culpa-linha" }>;
const linhas = (passos: PassoVolta[]) => passos.filter((p): p is Linha => p.tipo === "culpa-linha");

test("a culpa de cada linha é a mesma do Treinar (retropropagar)", () => {
  const { rede, pesos: basicos } = basica();
  for (const [semente, ex] of EXEMPLOS_PRONTOS.entries()) {
    // a montagem básica e uma rede sorteada (onde a última camada não é zero)
    const sorteados = Object.fromEntries(Object.entries(sortearPesos(rede, EXEMPLOS_PRONTOS, semente)).map(([k, w]) => [k, w || 0.7]));
    for (const pesos of [basicos, sorteados]) {
      const x = corParaEntradas(ex.cor);
      const { gradientes } = retropropagar(rede, pesos, x, ex.objetivo);
      const passos = voltarCulpa({ rede, pesos, entradas: x, objetivo: ex.objetivo });
      assert.equal(linhas(passos).length, Object.keys(pesos).length);
      for (const l of linhas(passos)) assert.ok(Math.abs(l.culpa - (gradientes[l.linha] ?? 0)) < 1e-12, `${ex.cor} · ${l.linha}`);
    }
  }
});

test("o exemplo do azul dá o que está no Figma", () => {
  const { rede, pesos } = basica();
  const passos = voltarCulpa({ rede, pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
  const erro = passos[0];
  assert.equal(erro.tipo, "erro");
  assert.equal(Math.round(erro.tipo === "erro" ? erro.erro * 100 : 0), 12);

  // pela estrutura: o neurônio de cima, o de baixo e o último (os ids mudam a cada montagem)
  const [cimaN, baixoN, finalN] = rede.neuronios;
  const porLinha = Object.fromEntries(linhas(passos).map((l) => [l.linha, l]));
  const linha = (de: string, para: string) => porLinha[`${de}->${para}`];
  const cor = (c: number) => `${rede.entrada}#${c}`;
  const baixoSaida = linha(baixoN.id, finalN.id);
  assert.equal(baixoSaida.sinal, "+");
  assert.equal(Math.round(baixoSaida.culpa * 1000), 16);
  assert.equal(baixoSaida.salvo, -1.51);
  assert.equal(linha(cor(0), baixoN.id).sinal, "-"); // R atrapalhou
  assert.equal(linha(cor(1), baixoN.id).sinal, "+"); // G ajudou
  assert.equal(linha(cor(2), baixoN.id).sinal, "+"); // B ajudou
  assert.equal(linha(cor(2), baixoN.id).salvo, 1.51);
  // o neurônio de cima passou 0: a culpa para nele, e ele e as linhas dele ficam iguais
  assert.equal(linha(cimaN.id, finalN.id).sinal, "=");
  for (const c of [0, 1, 2]) assert.equal(linha(cor(c), cimaN.id).sinal, "=");
  const cima = passos.find((p) => p.tipo === "culpa-neuronio" && p.neuronio === cimaN.id);
  assert.ok(cima?.tipo === "culpa-neuronio" && cima.apagado);

  const fim = passos.at(-1);
  assert.ok(fim?.tipo === "fim");
  assert.ok(fim.erroDepois < fim.erroAntes);
  assert.equal(Math.round(fim.erroDepois * 100), 11);
});

test("a volta anda da Saída para a Entrada", () => {
  const { rede, pesos } = basica();
  const passos = voltarCulpa({ rede, pesos, entradas: corParaEntradas("#FF8C00"), objetivo: 1 });
  assert.equal(passos[0].tipo, "erro");
  assert.equal(passos.at(-1)?.tipo, "fim");
  const neuronios = passos.flatMap((p) => (p.tipo === "culpa-neuronio" ? [p.neuronio] : []));
  const [cimaN, baixoN, finalN] = rede.neuronios;
  assert.deepEqual(neuronios, [finalN.id, cimaN.id, baixoN.id]);
  // cada linha vem logo depois do neurônio onde ela chega
  let atual = "";
  for (const p of passos) {
    if (p.tipo === "culpa-neuronio") atual = p.neuronio;
    if (p.tipo === "culpa-linha") assert.equal(p.neuronio, atual);
  }
});

test("o sinal fala do tamanho do peso, não do sinal dele", () => {
  assert.equal(sinalDaMudanca(-1.5, -1.51, 0.016), "+");
  assert.equal(sinalDaMudanca(-1, -0.998, -0.004), "-");
  assert.equal(sinalDaMudanca(0.5, 0.505, -0.01), "+");
  assert.equal(sinalDaMudanca(2, 2, 0), "=");
});
