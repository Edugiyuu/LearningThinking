import { corParaEntradas, retropropagar } from "../treino";
import { exato2, fmt, fmtPeso, lerNumero } from "./numeros";
import { CORES, REDE, corDasEntradas, passar, sortearRede } from "./rede-quiz";
import {
  ASSUNTOS,
  IDS_DOS_MODELOS,
  TEMAS,
  corrigir,
  erroDaResposta,
  gerarPergunta,
  modelosDoAssunto,
  textoDaCerta,
  type Pergunta,
  type Resposta,
} from "./perguntas";
import { sorteador } from "../treino";

const SEMENTES = Array.from({ length: 300 }, (_, i) => i * 7919 + 13);

/** A resposta certa de uma pergunta, do jeito que o aluno mandaria. */
function respostaCerta(p: Pergunta): Resposta {
  const f = p.forma;
  if (f.tipo === "alternativas") return { tipo: "alternativa", indice: f.certa };
  if (f.tipo === "numero") return { tipo: "numero", valor: f.certa };
  return { tipo: "linha", escolha: f.certa };
}

describe("números", () => {
  test("escreve como nas telas: vírgula e o sinal de menos de verdade", () => {
    expect(fmt(0.75)).toBe("0,75");
    expect(fmt(-1.2)).toBe("−1,20");
    expect(fmt(-0)).toBe("0,00");
    expect(fmt(-0.001)).toBe("0,00");
    expect(fmtPeso(1.5)).toBe("+1,50");
    expect(fmtPeso(-0.5)).toBe("−0,50");
  });

  test("lê o que o aluno digita", () => {
    expect(lerNumero("0,75")).toBe(0.75);
    expect(lerNumero("−1,5")).toBe(-1.5);
    expect(lerNumero("-2")).toBe(-2);
    expect(lerNumero(" 1.25 ")).toBe(1.25);
    expect(lerNumero(",5")).toBe(0.5);
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("abc")).toBeNull();
    expect(lerNumero("1,2,3")).toBeNull();
  });

  test("as cores com nome voltam aos mesmos números na Entrada do lab", () => {
    for (const c of CORES) expect(corParaEntradas(corDasEntradas(c.rgb))).toEqual(c.rgb);
  });
});

describe("a rede do quiz usa a conta do lab", () => {
  test("o forward pass bate com o rodar e o backward com o retropropagar", () => {
    const rede = sortearRede(sorteador(5));
    const p = passar(rede);
    const lab = retropropagar(REDE, rede.pesos, rede.entradas, 1);
    expect(p.saida).toBeCloseTo(lab.saida, 12);
    expect(p.valores.n1).toBe(Math.max(0, p.somas.n1));
  });

  test("entradas e pesos sorteados têm 2 casas e não são sempre redondos", () => {
    const casas = new Set<string>();
    for (const s of SEMENTES) {
      const rede = sortearRede(sorteador(s));
      for (const e of rede.entradas) {
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(1);
        expect(exato2(e)).toBe(true);
        casas.add(fmt(e).slice(-1));
      }
      for (const w of Object.values(rede.pesos)) {
        expect(Math.abs(w)).toBeGreaterThanOrEqual(0.1);
        expect(Math.abs(w)).toBeLessThanOrEqual(2);
        expect(exato2(w)).toBe(true);
      }
    }
    expect(casas.size).toBe(10); // aparecem números como 0,36 e 0,61, não só 0,20 e 0,50
  });
});

describe("cada modelo de pergunta", () => {
  test.each(IDS_DOS_MODELOS)("%s: a mesma semente gera a mesma pergunta", (modelo) => {
    expect(gerarPergunta(modelo, 42)).toEqual(gerarPergunta(modelo, 42));
  });

  test.each(IDS_DOS_MODELOS)("%s: os números mudam com a semente (sem decoreba)", (modelo) => {
    // o enunciado pode ser sempre igual (os números ficam no desenho); a pergunta inteira não
    const perguntas = new Set(SEMENTES.slice(0, 60).map((s) => JSON.stringify(gerarPergunta(modelo, s))));
    expect(perguntas.size).toBeGreaterThan(5);
  });

  test.each(IDS_DOS_MODELOS)("%s: a certa vale e as erradas não", (modelo) => {
    for (const s of SEMENTES) {
      const p = gerarPergunta(modelo, s);
      expect(corrigir(p, respostaCerta(p))).toBe(true);
      expect(corrigir(p, null)).toBe(false);
      const f = p.forma;
      if (f.tipo === "alternativas") {
        expect(f.opcoes.length).toBeGreaterThanOrEqual(2);
        expect(new Set(f.opcoes.map((o) => o.texto)).size).toBe(f.opcoes.length); // nenhum botão repetido
        f.opcoes.forEach((o, i) => {
          if (i !== f.certa) {
            expect(corrigir(p, { tipo: "alternativa", indice: i })).toBe(false);
            expect(o.erro).toBeTruthy(); // toda errada diz qual erro ela representa
          }
        });
      } else if (f.tipo === "numero") {
        expect(exato2(f.certa)).toBe(true); // dá exato em 2 casas
        for (const e of f.erros) {
          expect(corrigir(p, { tipo: "numero", valor: e.valor })).toBe(false);
          expect(erroDaResposta(p, { tipo: "numero", valor: e.valor })).toBe(e.erro);
        }
      } else {
        const outra = f.certa === "sobe" ? "desce" : "sobe";
        expect(corrigir(p, { tipo: "linha", escolha: outra })).toBe(false);
      }
      expect(p.conta.length).toBeGreaterThan(0);
      expect(textoDaCerta(p)).toBeTruthy();
    }
  });

  test("a resposta digitada aceita até 0,02 de diferença (o aluno arredonda as partes da conta)", () => {
    const p = gerarPergunta("treino-passinho", 3);
    if (p.forma.tipo !== "numero") throw new Error("devia ser número");
    expect(corrigir(p, { tipo: "numero", valor: p.forma.certa + 0.02 })).toBe(true);
    expect(corrigir(p, { tipo: "numero", valor: p.forma.certa + 0.03 })).toBe(false);
  });
});

describe("regras de cada modelo", () => {
  test("a dica do verde: mesmo peso no G e pesos opostos dão soma 0 e resposta 0,50", () => {
    let vistas = 0;
    for (const s of SEMENTES) {
      const p = gerarPergunta("soma-saida", s);
      if (!p.enunciado.includes("mesmo peso")) continue;
      vistas++;
      expect(p.forma.tipo === "numero" && p.forma.certa).toBe(0);
      const d = p.desenho!;
      expect(d.pesos["e#1->n1"]).toBe(d.pesos["e#1->n2"]);
      expect(d.pesos["n1->s"]).toBe(-d.pesos["n2->s"]);
      const saida = passar({ entradas: d.entradas as [number, number, number], cor: d.cor, pesos: d.pesos }).saida;
      expect(saida).toBeCloseTo(0.5, 12);
    }
    expect(vistas).toBeGreaterThan(50);
  });

  test("a linha que vem da Entrada: os três casos aparecem e batem com o retropropagar", () => {
    const certas = new Set<string>();
    for (const s of SEMENTES) {
      const p = gerarPergunta("backward-linha-entrada", s);
      if (p.forma.tipo !== "alternativas") throw new Error("devia ser alternativas");
      const texto = p.forma.opcoes[p.forma.certa].texto;
      certas.add(texto.replace(/[RGB] era/, "_ era").replace(/neurônio \d/, "neurônio _"));
      const d = p.desenho!;
      const linha = d.destaque[0];
      const g = retropropagar(REDE, d.pesos, d.entradas, d.objetivo!).gradientes[linha];
      if (texto.startsWith("Não muda")) expect(g).toBe(0);
      if (texto === "Muda: sobe") expect(g).toBeLessThan(0);
      if (texto === "Muda: desce") expect(g).toBeGreaterThan(0);
    }
    expect(certas).toEqual(new Set(["Não muda: o _ era 0, essa linha não fez nada", "Não muda: o neurônio _ foi apagado pela ReLU", "Muda: sobe", "Muda: desce"]));
  });

  test("a linha até a Saída: sobe, desce e não muda aparecem", () => {
    const certas = new Set(SEMENTES.map((s) => gerarPergunta("backward-linha-saida", s).forma).map((f) => f.tipo === "linha" && f.certa));
    expect(certas).toEqual(new Set(["sobe", "desce", "nao-muda"]));
  });

  test("a certa não fica sempre no mesmo botão", () => {
    const lugares = new Set(SEMENTES.map((s) => gerarPergunta("sigmoide-valor", s).forma).map((f) => f.tipo === "alternativas" && f.certa));
    expect(lugares.size).toBe(4);
  });
});

describe("temas", () => {
  test("Só forward fica do Entrada ao Forward pass", () => {
    expect(TEMAS.forward).toEqual(["entrada", "saida", "pesos", "soma", "relu", "sigmoide", "forward"]);
    expect(TEMAS.geral).toHaveLength(10);
  });

  test("todo assunto tem pelo menos um modelo", () => {
    for (const a of ASSUNTOS) expect(modelosDoAssunto(a.id).length).toBeGreaterThan(0);
  });
});
