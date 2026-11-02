// Testes das regras da rede. Rodar com: npm test
import { limitarPeso, formatar } from "./rede";

/*
 * EXERCÍCIO
 *
 * A função limitarPeso(w) recebe um peso e devolve o peso que pode ser gravado.
 * Ela faz duas coisas, e só isso:
 *
 *   1. arredonda para 2 casas decimais
 *   2. não deixa passar de 5 nem de −5 (é o limite que você definiu para o peso)
 *
 * Abaixo tem 1 teste pronto (o exemplo) e 3 para você escrever.
 * Troque cada "test.todo(...)" por um test de verdade, no mesmo formato do exemplo.
 *
 * Depois rode:  npm test --prefix web
 */

describe("limitarPeso", () => {
  // ---------- EXEMPLO PRONTO ----------
  test("um peso que já está certo passa igual", () => {
    expect(limitarPeso(2.5)).toBe(2.5);
  });

  // ---------- AGORA É COM VOCÊ ----------

  // 1) O que acontece com um peso ACIMA do limite? Ex.: limitarPeso(7)
  test("um peso acima de 5 vira 5", () => {
    expect(limitarPeso(8)).toBe(5);
  });

  // 2) E abaixo do limite negativo? Ex.: limitarPeso(-9)
  test("um peso abaixo de −5 vira −5", () => {
    expect(limitarPeso(-6)).toBe(-5);
  });
  
  // 3) E um peso com casas demais? Ex.: limitarPeso(1.234)
  test("um peso com muitas casas é arredondado para 2", () => {
    expect(limitarPeso(3.4232111123123)).toBe(3.42);
  });
});


describe("formatar",() => {
  test("formata um número com 2 casas decimais", () => {
    expect(formatar(3.14159)).toBe("3,14");
  });
  
  test("formata um número inteiro com 2 casas decimais", () => {
    expect(formatar(5)).toBe("5,00");
  });
   
  test("formata um número negativo com 2 casas decimais", () => {
    expect(formatar(-2.71828)).toBe("−2,72");
  });
});