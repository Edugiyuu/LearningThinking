// Testes das contas da Busca por significado (ADR-0037). Rodar com: npm test
import { cosseno, embeddingDosTokens, encaixarNoMapa, mediaDosTokens, norma, normalizar, pca2d, produtoEscalar } from "./significado";

describe("contas de lista", () => {
  test("produto escalar é multiplicar par a par e somar", () => {
    expect(produtoEscalar([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  test("o exemplo do resumo: [3, 4] normalizado vira [0,6, 0,8], com norma 1", () => {
    const r = normalizar([3, 4]);
    expect(r[0]).toBeCloseTo(0.6);
    expect(r[1]).toBeCloseTo(0.8);
    expect(norma(r)).toBeCloseTo(1);
  });

  test("normalizar mantém o sinal e a proporção (não é a sigmoide)", () => {
    const r = normalizar([3, 4, -2, 1]);
    expect(r[2]).toBeLessThan(0);
    expect(r[1] / r[0]).toBeCloseTo(4 / 3);
  });

  test("cosseno: mesma direção dá 1, contrária dá −1, perpendicular dá 0", () => {
    expect(cosseno([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosseno([1, 2], [-1, -2])).toBeCloseTo(-1);
    expect(cosseno([1, 0], [0, 5])).toBeCloseTo(0);
  });

  test("o cosseno não muda se uma lista for esticada (só a direção conta)", () => {
    const a = [0.3, -1.2, 2.5];
    const b = [1.1, 0.4, -0.7];
    expect(cosseno(a, b)).toBeCloseTo(cosseno(a.map((x) => x * 10), b));
  });

  test("com listas normalizadas, o cosseno é só o produto escalar", () => {
    const a = normalizar([0.3, -1.2, 2.5]);
    const b = normalizar([1.1, 0.4, -0.7]);
    expect(cosseno(a, b)).toBeCloseTo(produtoEscalar(a, b));
  });
});

describe("média dos tokens (mean pooling)", () => {
  test("3 tokens ([CLS] keyboard [SEP]) viram 1 lista: a média de cada posição", () => {
    expect(mediaDosTokens([[1, 0], [3, 6], [2, 3]])).toEqual([2, 3]);
  });

  test("o embedding sai com norma 1", () => {
    expect(norma(embeddingDosTokens([[1, 0, 2], [3, 6, -1]]))).toBeCloseTo(1);
  });
});

describe("PCA do mapa", () => {
  test("pontos parecidos ficam perto e diferentes ficam longe", () => {
    const listas = [
      [1, 0, 0, 0.1],
      [0.9, 0.1, 0, 0],
      [0, 0, 1, 0.1],
      [0, 0.1, 0.9, 0],
    ];
    const [a, b, c] = pca2d(listas);
    const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);
    expect(dist(a, b)).toBeLessThan(dist(a, c));
  });

  test("o mesmo conjunto dá sempre o mesmo mapa", () => {
    const listas = [[1, 2, 3], [2, 1, 0], [0, 1, 5], [4, 4, 1]];
    expect(pca2d(listas)).toEqual(pca2d(listas));
  });

  test("o primeiro eixo pega a direção mais espalhada", () => {
    // os pontos variam muito no 1º número e pouco no 2º
    const pontos = pca2d([[-10, 0.1], [10, -0.1], [-5, 0], [5, 0.2]]);
    const espalhaX = Math.max(...pontos.map((p) => p.x)) - Math.min(...pontos.map((p) => p.x));
    const espalhaY = Math.max(...pontos.map((p) => p.y)) - Math.min(...pontos.map((p) => p.y));
    expect(espalhaX).toBeGreaterThan(espalhaY);
  });

  test("encaixar no mapa: tudo cabe na margem e a proporção não estica", () => {
    const tela = encaixarNoMapa([{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0.5 }], 1000, 600, 50);
    for (const p of tela) {
      expect(p.x).toBeGreaterThanOrEqual(50);
      expect(p.x).toBeLessThanOrEqual(950);
      expect(p.y).toBeGreaterThanOrEqual(50);
      expect(p.y).toBeLessThanOrEqual(550);
    }
    // 2 de largura e 0,5 de altura: a distância em x continua 4 vezes a distância em y
    expect((tela[1].x - tela[0].x) / (tela[0].y - tela[2].y)).toBeCloseTo(4);
  });

  test("um texto só fica no centro", () => {
    expect(pca2d([[1, 2, 3]])).toEqual([{ x: 0, y: 0 }]);
  });
});
