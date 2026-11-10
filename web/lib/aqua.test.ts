// Testes da aba "Perguntar à Aqua" (ADR-0028). Rodar com: npm test
import { comCorPerguntada, lerSaida, motivoParaNaoPerguntar, perguntarCor } from "./aqua";
import { montagemBasica, prepararRodada } from "./rede";

describe("lerSaida", () => {
  test("perto de 1 é a resposta 1, com certeza", () => {
    expect(lerSaida(0.97)).toEqual({ saida: 0.97, resposta: 1, certeza: "confiante" });
  });

  test("perto de 0 é a resposta 0, com certeza", () => {
    expect(lerSaida(0.1)).toEqual({ saida: 0.1, resposta: 0, certeza: "confiante" });
  });

  test("entre 0,30 e 0,70 a Aqua fica em dúvida, mas ainda diz o que acha", () => {
    expect(lerSaida(0.58)).toEqual({ saida: 0.58, resposta: 1, certeza: "duvida" });
    expect(lerSaida(0.42).resposta).toBe(0);
    expect(lerSaida(0.5)).toMatchObject({ resposta: 1, certeza: "duvida" });
  });

  test("0,30 e 0,70 já contam como certeza", () => {
    expect(lerSaida(0.3).certeza).toBe("confiante");
    expect(lerSaida(0.7).certeza).toBe("confiante");
  });
});

describe("perguntarCor", () => {
  const { nodes, fios, pesos } = montagemBasica();

  test("dá o mesmo número que o Rodar do lab para a mesma cor", () => {
    const cor = "#FF8C00";
    const { rodada } = prepararRodada(comCorPerguntada(nodes, cor), fios, pesos);
    const fim = rodada!.passos.at(-1)!;
    expect(fim.tipo).toBe("saida");
    expect(perguntarCor(nodes, fios, pesos, cor)!.saida).toBeCloseTo(fim.tipo === "saida" ? fim.valor : NaN, 10);
  });

  test("com a montagem básica, laranja dá 1 e azul dá 0", () => {
    expect(perguntarCor(nodes, fios, pesos, "#FF8C00")!.resposta).toBe(1);
    expect(perguntarCor(nodes, fios, pesos, "#1E90FF")!.resposta).toBe(0);
  });

  test("preto dá 0,50 (sem bias, tudo zero) e deixa a Aqua em dúvida", () => {
    const r = perguntarCor(nodes, fios, pesos, "#000000")!;
    expect(r.saida).toBeCloseTo(0.5);
    expect(r.certeza).toBe("duvida");
  });
});

describe("comCorPerguntada", () => {
  test("troca só a cor da Entrada, sem mexer na montagem original", () => {
    const { nodes } = montagemBasica();
    const original = JSON.stringify(nodes);
    const comCor = comCorPerguntada(nodes, "#123456");
    const entrada = comCor.find((n) => n.type === "entrada");
    expect(entrada?.type === "entrada" && entrada.data.cor).toBe("#123456");
    expect(JSON.stringify(nodes)).toBe(original);
  });
});

describe("motivoParaNaoPerguntar", () => {
  const { nodes, fios, pesos } = montagemBasica();

  test("sem rodar a rede a aba não abre", () => {
    expect(motivoParaNaoPerguntar(nodes, fios, pesos, false)).toMatch(/Rode a rede/);
  });

  test("depois de rodar, com a Entrada de cor, a aba abre (sem precisar treinar)", () => {
    expect(motivoParaNaoPerguntar(nodes, fios, pesos, true)).toBeNull();
  });

  test("com a Entrada de números livres, a aba não abre", () => {
    const numeros = nodes.map((n) => (n.type === "entrada" ? { ...n, data: { ...n.data, tipo: "numeros" as const } } : n));
    expect(motivoParaNaoPerguntar(numeros, fios, pesos, true)).toMatch(/Entrada de cor/);
  });

  test("com a montagem quebrada, a aba não abre", () => {
    expect(motivoParaNaoPerguntar(nodes, [], pesos, true)).toMatch(/problema/);
  });
});
