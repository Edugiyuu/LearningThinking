// Configuração do Jest (ADR-0027). Rodar com: npm test
import nextJest from "next/jest.js";

// Lê o next.config e o tsconfig do projeto e monta o transform (SWC) por conta própria.
const criarConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  // "node" porque hoje os testes são de funções puras em lib/. Quando a gente testar
  // componentes, aqui vira "jsdom" (um navegador falso em memória).
  testEnvironment: "node",
  testMatch: ["<rootDir>/lib/**/*.test.ts"],
};

export default criarConfig(config);
