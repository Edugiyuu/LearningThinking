// Testes do Modo Foco (ADR-0026). Rodar com: npm test
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

describe("a conta armada do ver conta", () => {
  test("o exemplo do Figma: 0,50 × 0,25 = 0,125", () => {
    const telas = contaArmada("0,50", "0,25", 3);
    expect(resultado(telas)).toBe("0,125");
    expect(telas[0].corpo.tipo).toBe("tirar");
    // 5 × 5, depois 5 × 2 uma casa para a esquerda, a soma e a vírgula
    expect(telas.map((t) => t.corpo.tipo)).toEqual(["tirar", "armada", "armada", "armada", "virgula"]);
  });

  test("com negativo, o sinal fica de lado e volta no fim: 4,00 × −0,50 = −2,00", () => {
    const telas = contaArmada("4,00", "−0,50", 2);
    expect(telas[0].corpo.tipo).toBe("sinal");
    expect(telas.at(-1)!.corpo.tipo).toBe("sinalVolta");
    expect(resultado(telas)).toBe("−2,00");
  });

  test("bate com a conta do computador, arredondada", () => {
    const nums = ["0,22", "−0,64", "1,37", "0,05", "−3,10", "2,00", "0,99"];
    for (const a of nums)
      for (const b of nums) {
        const n = (s: string) => Number(s.replace("−", "-").replace(",", "."));
        const esperado = (Math.round(n(a) * n(b) * 100 + Number.EPSILON * Math.sign(n(a) * n(b))) / 100).toFixed(2).replace(".", ",").replace("-", "−");
        const r = resultado(contaArmada(a, b, 2));
        // −0,00 não existe na tela: o sinal some quando o resultado arredonda para zero
        const semZeroNegativo = (s: string) => s.replace(/^−(0,00)$/, "$1");
        expect(semZeroNegativo(r)).toBe(semZeroNegativo(esperado));
      }
  });

  test("vezes zero é uma tela só", () => {
    const telas = contaArmada("0,00", "0,64", 2);
    expect(telas).toHaveLength(1);
    expect(resultado(telas)).toBe("0,00");
  });
});

describe("o quadro e o mapa da rede", () => {
  test("o quadro da ida mostra todas as linhas do neurônio com a da vez acesa", () => {
    const m = montagemBasica();
    const { rodada } = prepararRodada(m.nodes, m.fios, m.pesos);
    expect(rodada).toBeTruthy();
    const i = rodada!.passos.findIndex((p) => p.tipo === "termo");
    const q = quadroDaIda(rodada!, i);
    // expect confere valores, mas não estreita tipos: o if abaixo é o que convence o
    // TypeScript de que q é o quadro de neurônio (e falha o teste se não for).
    if (q?.tipo !== "neuronio") throw new Error(`esperava um quadro de neurônio, veio ${q?.tipo}`);
    expect(q.partes.filter((p) => p.agora)).toHaveLength(1);
    const soma = q.partes.reduce((s, p) => s + p.parte, 0);
    expect(soma).toBeCloseTo(q.soma, 12);
  });

  test("no e se? a linha acesa é a que deixa o erro menor", () => {
    const m = montagemBasica();
    const lida = lerRede(m.nodes, m.fios, m.pesos);
    expect(lida).toBeTruthy();
    const passos = voltarCulpa({ rede: lida!.rede, pesos: lida!.pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
    for (let i = 0; i < passos.length; i++) {
      const q = quadroDaVolta(passos, i);
      if (q?.tipo !== "linha" || !q.eSe) continue;
      // culpa + → o peso desce; culpa − → sobe
      expect(q.eSe.desce.melhora).toBe(q.culpa > 0);
      expect(q.eSe.sobe.melhora).toBe(q.culpa < 0);
      expect(q.salvo < q.antes).toBe(q.culpa > 0);
    }
  });

  test("a culpa com sinal", () => {
    expect(culpaComSinal(0.125)).toBe("+0,125");
    expect(culpaComSinal(-0.05)).toBe("−0,050");
    expect(culpaComSinal(0.0002)).toBe("menos de 0,001 (+)");
  });

  test("o mapa tem Entrada, as camadas e a Saída, e acompanha a ida e a volta", () => {
    const m = montagemBasica();
    const { rodada } = prepararRodada(m.nodes, m.fios, m.pesos);
    expect(rodada).toBeTruthy();
    const mapa = mapaDaRede(rodada!);
    expect(mapa.colunas[0].nome).toBe("Entrada");
    expect(mapa.colunas.at(-1)!.nome).toBe("Saída");
    expect(mapa.colunas[0].nos).toHaveLength(3);
    // na ida, a coluna nunca volta
    let antes = 0;
    rodada!.passos.forEach((_, i) => {
      const o = ondeEstamos(rodada!, mapa, null, i);
      expect(o.coluna).toBeGreaterThanOrEqual(antes);
      antes = o.coluna;
    });
    // a volta começa na Saída e termina na Entrada (no meio ela vai neurônio por neurônio)
    const lida = lerRede(m.nodes, m.fios, m.pesos);
    expect(lida).toBeTruthy();
    const volta = voltarCulpa({ rede: lida!.rede, pesos: lida!.pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
    const daIda = rodada!.passos.length;
    expect(ondeEstamos(rodada!, mapa, volta, daIda).coluna).toBe(mapa.colunas.length - 1);
    expect(ondeEstamos(rodada!, mapa, volta, daIda + volta.length - 1).coluna).toBe(0);
  });
});
