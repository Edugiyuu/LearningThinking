import { TEMAS } from "./perguntas";
import {
  ALFABETO_DO_CODIGO,
  classificar,
  codigoValido,
  empatadosCom,
  gerarCodigo,
  juntarNomes,
  montarPlano,
  normalizarCodigo,
  quemSeMexeu,
  sementeDaPergunta,
} from "./quiz";

describe("plano do quiz", () => {
  test("tem a quantidade pedida, na ordem do lab", () => {
    const plano = montarPlano(TEMAS.geral, 10, 7);
    expect(plano).toHaveLength(10);
    const ordem = TEMAS.geral;
    const indices = plano.map((p) => ordem.indexOf(p.assunto));
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
    expect(new Set(plano.map((p) => p.assunto)).size).toBe(10); // 10 perguntas, 10 assuntos: um de cada
  });

  test("Só forward não cobra erro, backward nem treino", () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const plano = montarPlano(TEMAS.forward, 20, s);
      expect(plano).toHaveLength(20);
      expect(plano.every((p) => TEMAS.forward.includes(p.assunto))).toBe(true);
    }
  });

  test("com menos perguntas que assuntos, sorteia quais entram", () => {
    const plano = montarPlano(TEMAS.geral, 3, 11);
    expect(plano).toHaveLength(3);
    expect(new Set(plano.map((p) => p.assunto)).size).toBe(3);
  });

  test("a mesma semente dá o mesmo plano", () => {
    expect(montarPlano(TEMAS.geral, 12, 99)).toEqual(montarPlano(TEMAS.geral, 12, 99));
  });

  test("por turma, todos têm a mesma semente; por aluno, cada um a sua", () => {
    expect(sementeDaPergunta(5, 2, "por-turma", "a")).toBe(sementeDaPergunta(5, 2, "por-turma", "b"));
    expect(sementeDaPergunta(5, 2, "por-aluno", "a")).not.toBe(sementeDaPergunta(5, 2, "por-aluno", "b"));
    expect(sementeDaPergunta(5, 2, "por-aluno", "a")).toBe(sementeDaPergunta(5, 2, "por-aluno", "a"));
  });
});

describe("código da sala", () => {
  test("6 caracteres, sem O, 0, I e 1", () => {
    for (let i = 0; i < 200; i++) {
      const c = gerarCodigo();
      expect(codigoValido(c)).toBe(true);
      expect(c).not.toMatch(/[O0I1]/);
    }
    expect(ALFABETO_DO_CODIGO).toHaveLength(32);
  });

  test("arruma o que o aluno digita", () => {
    expect(normalizarCodigo(" k7m-2qx ")).toBe("K7M2QX");
    expect(codigoValido("K7M2QO")).toBe(false);
  });
});

describe("placar", () => {
  const p = (id: string, pontos: number) => ({ id, apelido: id, pontos });

  test("empate divide a posição", () => {
    const lista = classificar([p("Lu", 3000), p("Bia", 3000), p("Theo", 2000), p("Ana", 2000), p("Enzo", 1000)]);
    expect(lista.map((x) => [x.apelido, x.posicao])).toEqual([
      ["Bia", 1],
      ["Lu", 1],
      ["Ana", 3],
      ["Theo", 3],
      ["Enzo", 5],
    ]);
  });

  test("quem se mexeu: o exemplo do Figma (Theo sobe, Ana C. e Enzo caem)", () => {
    const fixos = ["Bia_07", "Lu", "Pedrão", "Kaká", "Mari", "Gabi"];
    const antes = [...fixos.map((n) => p(n, 2000)), p("Ana C.", 2000), p("Enzo", 2000), p("Theo", 1000)];
    const depois = [...fixos.map((n) => p(n, 3000)), p("Ana C.", 2000), p("Enzo", 2000), p("Theo", 2000)];
    const mexeu = quemSeMexeu(antes, depois);
    expect(mexeu.map((m) => [m.apelido, m.antes, m.depois, m.ganhou])).toEqual([
      ["Ana C.", 1, 7, 0],
      ["Enzo", 1, 7, 0],
      ["Theo", 9, 7, 1000],
    ]);
  });

  test("quem entrou agora não aparece em quem se mexeu", () => {
    expect(quemSeMexeu([p("a", 0)], [p("a", 1000), p("novo", 0)])).toEqual([]);
  });

  test("empatados e nomes juntos", () => {
    const lista = [p("Mari", 7000), p("Pedrão", 7000), p("Kaká", 7000), p("Lu", 8000)];
    expect(juntarNomes(empatadosCom(lista, "Mari"))).toBe("Pedrão e Kaká");
    expect(juntarNomes(["Bia", "Lu", "Mari"])).toBe("Bia, Lu e Mari");
    expect(juntarNomes([])).toBe("");
  });
});
