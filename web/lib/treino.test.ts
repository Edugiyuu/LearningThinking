// Testes do treino (ADR-0024). Rodar com: npm test
import { montagemBasica, prepararRodada } from "./rede";
import { EXEMPLOS_PRONTOS, corParaEntradas, lerRede, retropropagar, rodar, sortearPesos, treinar } from "./treino";

const basica = () => {
  const m = montagemBasica();
  const lida = lerRede(m.nodes, m.fios, m.pesos);
  // throw em vez de expect: só o throw convence o TypeScript de que lida não é null
  if (!lida) throw new Error("a montagem básica precisa virar uma rede");
  return { m, ...lida };
};

const lado = (r: number) => (r >= 0.5 ? 1 : 0);

describe("o forward e o gradiente", () => {
  test("o forward do treino dá o mesmo resultado do Rodar", () => {
    const { m, rede, pesos } = basica();
    const { rodada } = prepararRodada(m.nodes, m.fios, m.pesos);
    const saida = rodada!.passos.at(-1);
    expect(saida?.tipo).toBe("saida");
    const doRodar = saida!.tipo === "saida" ? saida!.valor : NaN;
    expect(rodar(rede, pesos, corParaEntradas("#ff8c00")).saida).toBeCloseTo(doRodar, 12);
  });

  test("o gradiente de cada peso bate com a diferença numérica", () => {
    const { rede, pesos } = basica();
    for (const ex of EXEMPLOS_PRONTOS) {
      const x = corParaEntradas(ex.cor);
      const { gradientes } = retropropagar(rede, pesos, x, ex.objetivo);
      const perda = (p: typeof pesos) => 0.5 * (rodar(rede, p, x).saida - ex.objetivo) ** 2;
      for (const id of Object.keys(pesos)) {
        const h = 1e-5;
        const numerico = (perda({ ...pesos, [id]: pesos[id] + h }) - perda({ ...pesos, [id]: pesos[id] - h })) / (2 * h);
        // toBeLessThan(1e-6) e não toBeCloseTo(.., 6): toBeCloseTo exigiria 5e-7, mais apertado
        expect(Math.abs(numerico - (gradientes[id] ?? 0))).toBeLessThan(1e-6);
      }
    }
  });
});

describe("o treino aprende", () => {
  test("do zero, com o passinho médio, a montagem básica aprende a separar laranja de azul", () => {
    const { rede } = basica();
    for (let semente = 1; semente <= 30; semente++) {
      const pesos = sortearPesos(rede, EXEMPLOS_PRONTOS, semente);
      const g = treinar({ rede, pesos, exemplos: EXEMPLOS_PRONTOS, repeticoes: 1000, passinho: "medio", semente });
      expect(g.quadros).toHaveLength(1000);
      expect(g.depois.erro).toBeLessThan(0.1);
      expect(g.depois.respostas.map(lado)).toEqual(EXEMPLOS_PRONTOS.map((e) => e.objetivo));
    }
  });

  test("o passinho pequeno aprende mais devagar que o médio", () => {
    const { rede } = basica();
    const pesos = sortearPesos(rede, EXEMPLOS_PRONTOS, 7);
    const erroNa = (passinho: "pequeno" | "medio") => treinar({ rede, pesos, exemplos: EXEMPLOS_PRONTOS, repeticoes: 100, passinho }).quadros[99].erro;
    expect(erroNa("pequeno")).toBeGreaterThan(erroNa("medio"));
  });

  test("com o passinho grande, a rede às vezes trava com o erro alto", () => {
    const { rede } = basica();
    const travadas = (passinho: "medio" | "grande") =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(
        (semente) => treinar({ rede, pesos: sortearPesos(rede, EXEMPLOS_PRONTOS, semente), exemplos: EXEMPLOS_PRONTOS, repeticoes: 300, passinho, semente }).depois.erro > 0.2,
      ).length;
    expect(travadas("medio")).toBe(0);
    expect(travadas("grande")).toBeGreaterThanOrEqual(2);
  });
});

describe("o começo do treino", () => {
  test("a mesma semente dá o mesmo treino", () => {
    const { rede, pesos } = basica();
    const a = treinar({ rede, pesos, exemplos: EXEMPLOS_PRONTOS, repeticoes: 50, passinho: "medio", semente: 9 });
    const b = treinar({ rede, pesos, exemplos: EXEMPLOS_PRONTOS, repeticoes: 50, passinho: "medio", semente: 9 });
    expect(a.depois).toEqual(b.depois);
  });

  test("do zero, a rede começa chutando 0,50", () => {
    const { rede } = basica();
    for (let semente = 0; semente < 20; semente++) {
      const g = treinar({ rede, pesos: sortearPesos(rede, EXEMPLOS_PRONTOS, semente), exemplos: EXEMPLOS_PRONTOS, repeticoes: 1, passinho: "medio" });
      g.antes.respostas.forEach((r) => expect(r).toBe(0.5));
    }
  });

  test("uma rede sorteada não nasce morta", () => {
    const { rede } = basica();
    for (let semente = 0; semente < 50; semente++) {
      // depois de algumas repetições, as respostas já saíram de 0,50 para algum lado
      const g = treinar({ rede, pesos: sortearPesos(rede, EXEMPLOS_PRONTOS, semente), exemplos: EXEMPLOS_PRONTOS, repeticoes: 50, passinho: "medio" });
      expect(g.quadros[49].respostas.some((r) => Math.abs(r - 0.5) > 1e-3)).toBe(true);
    }
  });
});
