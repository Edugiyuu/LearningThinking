// Testes do backward pass passo a passo (ADR-0025). Rodar com: npm test
import { formatarCulpa, pesoSalvo, sinalDaMudanca, vistaDaVolta, voltarCulpa, type PassoVolta } from "./backward";
import { criarBackward, fioPermitido, montagemBasica } from "./rede";
import { EXEMPLOS_PRONTOS, corParaEntradas, lerRede, retropropagar, sortearPesos } from "./treino";

const basica = () => {
  const m = montagemBasica();
  const lida = lerRede(m.nodes, m.fios, m.pesos);
  // throw em vez de expect: só o throw convence o TypeScript de que lida não é null
  if (!lida) throw new Error("a montagem básica precisa virar uma rede");
  return lida;
};

type Linha = Extract<PassoVolta, { tipo: "culpa-linha" }>;
const linhas = (passos: PassoVolta[]) => passos.filter((p): p is Linha => p.tipo === "culpa-linha");

describe("a culpa voltando", () => {
  test("a culpa de cada linha é a mesma do Treinar (retropropagar)", () => {
    const { rede, pesos: basicos } = basica();
    for (const [semente, ex] of EXEMPLOS_PRONTOS.entries()) {
      // a montagem básica e uma rede sorteada (onde a última camada não é zero)
      const sorteados = Object.fromEntries(Object.entries(sortearPesos(rede, EXEMPLOS_PRONTOS, semente)).map(([k, w]) => [k, w || 0.7]));
      for (const pesos of [basicos, sorteados]) {
        const x = corParaEntradas(ex.cor);
        const { gradientes } = retropropagar(rede, pesos, x, ex.objetivo);
        const passos = voltarCulpa({ rede, pesos, entradas: x, objetivo: ex.objetivo });
        expect(linhas(passos)).toHaveLength(Object.keys(pesos).length);
        for (const l of linhas(passos)) expect(l.culpa).toBeCloseTo(gradientes[l.linha] ?? 0, 12);
      }
    }
  });

  test("o exemplo do azul dá o que está no Figma", () => {
    const { rede, pesos } = basica();
    const passos = voltarCulpa({ rede, pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
    const erro = passos[0];
    expect(erro.tipo).toBe("erro");
    expect(Math.round(erro.tipo === "erro" ? erro.erro * 100 : 0)).toBe(12);

    // pela estrutura: o neurônio de cima, o de baixo e o último (os ids mudam a cada montagem)
    const [cimaN, baixoN, finalN] = rede.neuronios;
    const porLinha = Object.fromEntries(linhas(passos).map((l) => [l.linha, l]));
    const linha = (de: string, para: string) => porLinha[`${de}->${para}`];
    const cor = (c: number) => `${rede.entrada}#${c}`;
    const baixoSaida = linha(baixoN.id, finalN.id);
    expect(baixoSaida.sinal).toBe("+");
    expect(Math.round(baixoSaida.culpa * 1000)).toBe(16);
    expect(baixoSaida.salvo).toBe(-1.51);
    expect(linha(cor(0), baixoN.id).sinal).toBe("-"); // R atrapalhou
    expect(linha(cor(1), baixoN.id).sinal).toBe("+"); // G ajudou
    expect(linha(cor(2), baixoN.id).sinal).toBe("+"); // B ajudou
    expect(linha(cor(2), baixoN.id).salvo).toBe(1.51);
    // o neurônio de cima passou 0: a culpa para nele, e ele e as linhas dele ficam iguais
    expect(linha(cimaN.id, finalN.id).sinal).toBe("=");
    for (const c of [0, 1, 2]) expect(linha(cor(c), cimaN.id).sinal).toBe("=");
    const cima = passos.find((p) => p.tipo === "culpa-neuronio" && p.neuronio === cimaN.id);
    expect(cima).toMatchObject({ tipo: "culpa-neuronio", apagado: true });

    const fim = passos.at(-1);
    if (fim?.tipo !== "fim") throw new Error(`o último passo tinha de ser o fim, veio ${fim?.tipo}`);
    expect(fim.erroDepois).toBeLessThan(fim.erroAntes);
    expect(Math.round(fim.erroDepois * 100)).toBe(11);
  });

  test("a volta anda da Saída para a Entrada", () => {
    const { rede, pesos } = basica();
    const passos = voltarCulpa({ rede, pesos, entradas: corParaEntradas("#FF8C00"), objetivo: 1 });
    expect(passos[0].tipo).toBe("erro");
    expect(passos.at(-1)?.tipo).toBe("fim");
    const neuronios = passos.flatMap((p) => (p.tipo === "culpa-neuronio" ? [p.neuronio] : []));
    const [cimaN, baixoN, finalN] = rede.neuronios;
    expect(neuronios).toEqual([finalN.id, cimaN.id, baixoN.id]);
    // cada linha vem logo depois do neurônio onde ela chega
    let atual = "";
    for (const p of passos) {
      if (p.tipo === "culpa-neuronio") atual = p.neuronio;
      if (p.tipo === "culpa-linha") expect(p.neuronio).toBe(atual);
    }
  });
});

describe("os números do peso e da culpa", () => {
  test("o sinal fala do tamanho do peso, não do sinal dele", () => {
    expect(sinalDaMudanca(-1.5, -1.51, 0.016)).toBe("+");
    expect(sinalDaMudanca(-1, -0.998, -0.004)).toBe("-");
    expect(sinalDaMudanca(0.5, 0.505, -0.01)).toBe("+");
    expect(sinalDaMudanca(2, 2, 0)).toBe("=");
  });

  test("com + ou −, o peso salvo anda pelo menos 0,01", () => {
    expect(pesoSalvo(0.5, 0.5048)).toBe(0.51); // G: 0,505 arredondaria para 0,50
    expect(pesoSalvo(-1, -0.998)).toBe(-0.99); // R: −0,998 arredondaria para −1,00
    expect(pesoSalvo(-1.5, -1.508)).toBe(-1.51); // já anda sozinho
    expect(pesoSalvo(2, 2)).toBe(2); // sem culpa, fica igual
    expect(pesoSalvo(5, 5.003)).toBe(5); // no limite, não passa de 5
  });

  test("culpa pequena demais para 3 casas não vira 0,000", () => {
    expect(formatarCulpa(0.0003)).toBe("menos de 0,001");
    expect(formatarCulpa(0)).toBe("0,000");
  });
});

describe("o bloco e a vista da volta", () => {
  test("o Backward pass só liga na Saída", () => {
    const m = montagemBasica();
    const b = criarBackward(1000, 40);
    const nodes = [...m.nodes, b];
    const saida = nodes.find((n) => n.type === "saida")!;
    const camada = nodes.find((n) => n.type === "camada")!;
    const entrada = nodes.find((n) => n.type === "entrada")!;
    const liga = (source: string, target: string) => fioPermitido(nodes, m.fios, { source, target, sourceHandle: null, targetHandle: null });
    expect(liga(saida.id, b.id)).toBe(true);
    expect(liga(camada.id, b.id)).toBe(false);
    expect(liga(entrada.id, b.id)).toBe(false);
    expect(liga(saida.id, camada.id)).toBe(false);
    expect(liga(b.id, saida.id)).toBe(false);
  });

  test("a vista da volta acompanha os passos", () => {
    const { rede, pesos } = basica();
    const passos = voltarCulpa({ rede, pesos, entradas: corParaEntradas("#378ADD"), objetivo: 0 });
    const [cimaN, baixoN, finalN] = rede.neuronios;
    const iLinha = passos.findIndex((p) => p.tipo === "culpa-linha" && p.linha === `${baixoN.id}->${finalN.id}`);
    const v = vistaDaVolta(passos, iLinha);
    expect(v.linhaAgora?.linha).toBe(`${baixoN.id}->${finalN.id}`);
    expect(v.linhaAgora?.tamanho).toBe(1); // é a linha com mais culpa
    expect(v.sinais.get(`${cimaN.id}->${finalN.id}`)).toBe("="); // a de cima já passou
    expect(v.neuronioAgora).toBe(finalN.id);
    expect(v.erro).toBeTruthy();
    expect(v.fim).toBeFalsy();
    expect(v.parados.size).toBe(0); // a culpa ainda não chegou na Camada 1

    const noFim = vistaDaVolta(passos, passos.length - 1);
    expect(noFim.linhaAgora).toBeNull();
    expect(noFim.parados.has(cimaN.id)).toBe(true);
    expect(noFim.sinais.size).toBe(8);
    expect(Math.round((noFim.fim?.erroDepois ?? 0) * 100)).toBe(11);
    expect(formatarCulpa(-0.0155)).toBe("0,016");
  });
});
