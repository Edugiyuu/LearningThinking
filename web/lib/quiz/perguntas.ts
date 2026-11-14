// Quiz ao vivo (ADR-0034, seções B e C): cada pergunta é um modelo (template) com partes sorteadas.
// A mesma semente gera sempre a mesma pergunta: o celular do aluno e a aba do professor geram a
// pergunta cada um do seu lado, e os dois concordam. As respostas certas saem da conta do lab.

import { FAIXA_DUVIDA } from "../aqua";
import { sorteador } from "../treino";
import {
  PESOS,
  TOLERANCIA,
  embaralhar,
  escolher,
  exato2,
  fmt,
  fmtCurto,
  fmtPeso,
  r2,
  sigmoide,
  type Aleatorio,
} from "./numeros";
import {
  CANAIS,
  CORES,
  MEIO,
  corDasEntradas,
  culpas,
  linhaEntrada,
  linhaSaida,
  nomeLinha,
  nomeNeuronio,
  passar,
  sortearEntradas,
  sortearRede,
  type CorNomeada,
  type NeuronioId,
  type RedeQuiz,
} from "./rede-quiz";

/* ---------- Tipos ---------- */

/** Os 10 assuntos, na ordem em que o lab ensina (seção C). */
export const ASSUNTOS = [
  { id: "entrada", nome: "Entrada", longo: "Entrada: cor → R G B" },
  { id: "saida", nome: "Saída", longo: "Saída: azul / laranja" },
  { id: "pesos", nome: "Pesos", longo: "Pesos" },
  { id: "soma", nome: "Soma ponderada", longo: "Soma ponderada" },
  { id: "relu", nome: "ReLU", longo: "ReLU" },
  { id: "sigmoide", nome: "Sigmoide", longo: "Sigmoide" },
  { id: "forward", nome: "Forward pass", longo: "Forward pass" },
  { id: "erro", nome: "Erro", longo: "Erro" },
  { id: "backward", nome: "Backward pass", longo: "Backward pass" },
  { id: "treino", nome: "Treino: o passinho", longo: "Treino: o passinho (taxa de aprendizado)" },
] as const;
export type Assunto = (typeof ASSUNTOS)[number]["id"];
export const nomeAssunto = (a: Assunto) => ASSUNTOS.find((x) => x.id === a)?.nome ?? a;

/** Os temas prontos. "Só forward" fica do 1 ao 7: sem erro, backward e treino. */
export const TEMAS = {
  geral: ASSUNTOS.map((a) => a.id) as Assunto[],
  forward: ASSUNTOS.slice(0, 7).map((a) => a.id) as Assunto[],
};

export type Direcao = "sobe" | "desce" | "nao-muda";
export const NOME_DIRECAO: Record<Direcao, string> = { sobe: "Subir", desce: "Descer", "nao-muda": "Não mudar" };

/** Uma alternativa. As erradas dizem qual erro comum elas representam (aparece no projetor). */
export type Opcao = { texto: string; erro?: string };

/** Onde o aluno digita o número: dentro de um neurônio, em cima de uma linha ou num campo solto. */
export type Alvo = { tipo: "neuronio"; id: NeuronioId } | { tipo: "linha"; id: string };

export type Forma =
  | { tipo: "alternativas"; opcoes: Opcao[]; certa: number }
  | { tipo: "numero"; alvo: Alvo | null; rotulo: string; certa: number; erros: { valor: number; erro: string }[] }
  | { tipo: "linha"; linha: string; certa: Direcao };

/** O que o desenho da rede mostra. */
export type Desenho = {
  entradas: number[];
  cor: string;
  pesos: Record<string, number>;
  /** o número escrito dentro de cada neurônio (sem texto = vazio) */
  textos: Partial<Record<NeuronioId, string>>;
  /** neurônios que a ReLU apagou (passaram 0): ficam cinza */
  apagados: NeuronioId[];
  /** linhas ou neurônios em destaque */
  destaque: string[];
  /** o certo, quando a pergunta fala dele (1 = laranja, 0 = azul) */
  objetivo?: 0 | 1;
};

export type PassoDaConta = { rotulo: string; conta: string };

export type Pergunta = {
  modelo: string;
  assunto: Assunto;
  enunciado: string;
  /** a mesma pergunta sem os números: tela projetada no sorteio por aluno, pódio e cards */
  geral: string;
  amostra?: { cor: string; nome?: string };
  desenho?: Desenho;
  forma: Forma;
  /** a conta certa explicada, só na tela projetada (decisão 10) */
  conta: PassoDaConta[];
  porque?: string;
};

export type Resposta =
  | { tipo: "alternativa"; indice: number }
  | { tipo: "numero"; valor: number }
  | { tipo: "linha"; escolha: Direcao };

type Gerada = Omit<Pergunta, "modelo" | "assunto">;
type Modelo = { id: string; assunto: Assunto; gerar: (r: Aleatorio) => Gerada };

/* ---------- Ajudantes ---------- */

const rgbTexto = (e: readonly number[]) => `R ${fmtCurto(e[0])} · G ${fmtCurto(e[1])} · B ${fmtCurto(e[2])}`;
const aCor = (rede: RedeQuiz) => (rede.nome ? `o ${rede.nome} (${rgbTexto(rede.entradas)})` : `a cor (${rgbTexto(rede.entradas)})`);
const ACor = (rede: RedeQuiz) => aCor(rede).replace(/^./, (c) => c.toUpperCase());
const certoTexto = (objetivo: 0 | 1) => (objetivo === 1 ? "laranja (1)" : "azul (0)");

/** Dois números contam como o mesmo se ficam a até 0,01 (a conta com vírgula erra no último dígito). */
const perto = (a: number, b: number) => Math.abs(a - b) <= TOLERANCIA + 1e-9;

/** Junta a certa com as erradas (sem repetir texto), corta em `n` e sorteia a ordem dos botões. */
function alternativas(r: Aleatorio, certa: Opcao, erradas: Opcao[], n = 4): Extract<Forma, { tipo: "alternativas" }> {
  const vistas = new Set([certa.texto]);
  const unicas = erradas.filter((o) => !vistas.has(o.texto) && vistas.add(o.texto));
  const todas = embaralhar(r, [certa, ...unicas.slice(0, n - 1)]);
  return { tipo: "alternativas", opcoes: todas, certa: todas.indexOf(certa) };
}

function numero(certa: number, alvo: Alvo | null, rotulo: string, erros: { valor: number; erro: string }[]): Forma {
  const vistos: number[] = [certa];
  const unicos = erros
    .map((e) => ({ ...e, valor: r2(e.valor) }))
    .filter((e) => !vistos.some((v) => perto(v, e.valor)) && vistos.push(e.valor));
  return { tipo: "numero", alvo, rotulo, certa: r2(certa), erros: unicos };
}

/** Tenta de novo até a regra do modelo valer. As regras são fáceis, então sempre acha logo. */
function ate<T>(r: Aleatorio, sortear: (r: Aleatorio) => T, regra: (x: T) => boolean): T {
  for (let i = 0; i < 1000; i++) {
    const x = sortear(r);
    if (regra(x)) return x;
  }
  throw new Error("sorteio sem saída: a regra do modelo nunca vale");
}

/** O desenho com as entradas e os pesos, e nada escrito nos neurônios. */
function desenhoBase(rede: RedeQuiz, extra: Partial<Desenho> = {}): Desenho {
  return { entradas: rede.entradas, cor: rede.cor, pesos: rede.pesos, textos: {}, apagados: [], destaque: [], ...extra };
}

/** Os neurônios do meio com o que passaram adiante e os apagados pela ReLU. */
function meioPreenchido(rede: RedeQuiz) {
  const p = passar(rede);
  return {
    p,
    textos: { n1: fmt(p.valores.n1), n2: fmt(p.valores.n2) } as Partial<Record<NeuronioId, string>>,
    apagados: MEIO.filter((n) => p.somas[n] <= 0) as NeuronioId[],
  };
}

/** "R: 0,8 × +1,50 = 1,20" para cada canal, e a soma no fim. */
function contaDoNeuronio(rede: RedeQuiz, n: "n1" | "n2"): PassoDaConta[] {
  const partes = [0, 1, 2].map((c) => rede.entradas[c] * rede.pesos[linhaEntrada(c, n)]);
  return [
    ...[0, 1, 2].map((c) => ({
      rotulo: `${CANAIS[c]} → ${nomeNeuronio(n)}`,
      conta: `${fmt(rede.entradas[c])} × ${fmtPeso(rede.pesos[linhaEntrada(c, n)])} = ${fmt(partes[c])}`,
    })),
    { rotulo: `a soma do ${nomeNeuronio(n)}`, conta: `${partes.map((x) => fmt(x)).join(" + ").replace(/\+ −/g, "− ")} = ${fmt(partes.reduce((a, b) => a + b, 0))}` },
  ];
}

function contaDaSaida(rede: RedeQuiz, valores: Record<NeuronioId, number>): PassoDaConta[] {
  const partes = MEIO.map((n) => valores[n] * rede.pesos[linhaSaida(n)]);
  return [
    ...MEIO.map((n, i) => ({ rotulo: `${nomeNeuronio(n)} passa`, conta: `${fmt(valores[n])} × ${fmtPeso(rede.pesos[linhaSaida(n)])} = ${fmtPeso(partes[i])}` })),
    { rotulo: "a soma da Saída", conta: `${fmtPeso(partes[0])} ${partes[1] < 0 ? "−" : "+"} ${fmt(Math.abs(partes[1]))} = ${fmt(partes[0] + partes[1])}` },
  ];
}

/** O que a Aqua diz para uma saída (as faixas da aba da Aqua, ADR-0028). */
function falaDaAqua(saida: number): "É azul!" | "É laranja!" | "Fico em dúvida" {
  if (saida > FAIXA_DUVIDA.de && saida < FAIXA_DUVIDA.ate) return "Fico em dúvida";
  return saida >= 0.5 ? "É laranja!" : "É azul!";
}
const FALAS = ["É azul!", "É laranja!", "Fico em dúvida"] as const;

/* ---------- Os modelos ---------- */

const MODELOS: Modelo[] = [
  /* 1 · Entrada */
  {
    id: "entrada-cor",
    assunto: "entrada",
    gerar: (r) => {
      const cor = escolher(r, CORES);
      const [R, G, B] = cor.rgb;
      const t = (e: number[]) => rgbTexto(e);
      return {
        enunciado: `Esta cor (o ${cor.nome}) vira quais números na Entrada?`,
        geral: "Esta cor vira quais números na Entrada?",
        amostra: { cor: corDasEntradas(cor.rgb), nome: cor.nome },
        forma: alternativas(r, { texto: t(cor.rgb) }, [
          { texto: `R ${Math.round(R * 255)} · G ${Math.round(G * 255)} · B ${Math.round(B * 255)}`, erro: "Usaram 0 a 255. No lab, cada canal vai de 0 a 1." },
          { texto: t([B, G, R]), erro: "Trocaram a ordem: a Entrada é R, G, B." },
          { texto: t([1 - R, 1 - G, 1 - B]), erro: "Inverteram: 1 é o canal todo aceso, 0 é apagado." },
          { texto: t([G, R, B]), erro: "Trocaram a ordem: a Entrada é R, G, B." },
          { texto: t(sortearEntradas(r)), erro: "Chute: os números não batem com a cor." },
          { texto: t(sortearEntradas(r)), erro: "Chute: os números não batem com a cor." },
        ]),
        conta: [
          { rotulo: "cada canal", conta: "vai de 0 (apagado) a 1 (todo aceso)" },
          { rotulo: `o ${cor.nome}`, conta: t(cor.rgb) },
        ],
      };
    },
  },
  {
    id: "entrada-numeros",
    assunto: "entrada",
    gerar: (r) => {
      const cor = escolher(r, CORES);
      const outras = embaralhar(r, CORES.filter((c) => c.nome !== cor.nome));
      return {
        enunciado: `${rgbTexto(cor.rgb)} é qual cor?`,
        geral: "Estes números da Entrada são qual cor?",
        forma: alternativas(r, { texto: `${cor.nome}` }, outras.map((c) => ({ texto: c.nome, erro: `O ${c.nome} é ${rgbTexto(c.rgb)}.` }))),
        conta: [
          { rotulo: "R, G e B", conta: "quanto de vermelho, de verde e de azul a cor tem" },
          { rotulo: rgbTexto(cor.rgb), conta: `o ${cor.nome}` },
        ],
      };
    },
  },

  /* 2 · Saída */
  {
    id: "saida-diz",
    assunto: "saida",
    gerar: (r) => {
      const saida = escolher(r, [0.03, 0.08, 0.12, 0.18, 0.25, 0.4, 0.5, 0.6, 0.75, 0.82, 0.88, 0.97]);
      const certa = falaDaAqua(saida);
      const erroDe: Record<string, string> = {
        "É azul!": saida >= 0.5 ? "Trocaram: perto de 1 é laranja, perto de 0 é azul." : "Entre 0,30 e 0,70 ela não tem certeza.",
        "É laranja!": saida < 0.5 ? "Trocaram: perto de 0 é azul, perto de 1 é laranja." : "Entre 0,30 e 0,70 ela não tem certeza.",
        "Fico em dúvida": "Abaixo de 0,30 ou acima de 0,70 ela responde com certeza.",
      };
      return {
        enunciado: `A Saída deu ${fmt(saida)}. O que a Aqua diz?`,
        geral: "A Saída deu um número. O que a Aqua diz?",
        forma: alternativas(r, { texto: certa }, FALAS.filter((f) => f !== certa).map((f) => ({ texto: f, erro: erroDe[f] }))),
        conta: [
          { rotulo: "0 = azul, 1 = laranja", conta: "abaixo de 0,30: azul · acima de 0,70: laranja" },
          { rotulo: `a Saída deu ${fmt(saida)}`, conta: certa },
        ],
      };
    },
  },
  {
    id: "saida-acertou",
    assunto: "saida",
    gerar: (r) => {
      // três casos: uma cor que ela conhece e acertou, uma que conhece e errou, e uma que ela não conhece
      const caso = escolher(r, ["acertou", "errou", "nao-conhece", "nao-conhece"] as const);
      const conhecidas: CorNomeada[] = [
        { nome: "laranja", rgb: [1, 0.5, 0] },
        { nome: "azul", rgb: [0, 0, 1] },
        { nome: "azul-claro", rgb: [0.5, 0.8, 1] },
        { nome: "laranja-escuro", rgb: [0.8, 0.2, 0] },
      ];
      const estranhas = CORES.filter((c) => !["laranja", "azul", "azul-claro"].includes(c.nome));
      const cor = caso === "nao-conhece" ? escolher(r, estranhas) : escolher(r, conhecidas);
      const ehLaranja = cor.nome.startsWith("laranja");
      const disseLaranja = caso === "nao-conhece" ? r() < 0.5 : caso === "acertou" ? ehLaranja : !ehLaranja;
      const saida = disseLaranja ? escolher(r, [0.82, 0.88, 0.94, 0.97]) : escolher(r, [0.03, 0.06, 0.12, 0.18]);
      const disse = disseLaranja ? "É laranja!" : "É azul!";
      const opcoes: Opcao[] = [
        { texto: "Sim" },
        { texto: "Não" },
        { texto: "Não tem como: ela só conhece azul e laranja" },
      ];
      const certa = caso === "acertou" ? 0 : caso === "errou" ? 1 : 2;
      const erros = [
        caso === "nao-conhece" ? `Ela respondeu com certeza, mas o ${cor.nome} não é azul nem laranja.` : `Era ${ehLaranja ? "laranja" : "azul"} e ela disse ${disseLaranja ? "laranja" : "azul"}.`,
        caso === "nao-conhece" ? `Ela não errou nem acertou: só aprendeu azul e laranja.` : `Era ${ehLaranja ? "laranja" : "azul"} e ela disse ${disseLaranja ? "laranja" : "azul"}.`,
        "Ela conhece essa cor: é azul ou laranja.",
      ];
      const ordem = embaralhar(r, [0, 1, 2]);
      return {
        enunciado: `O ${cor.nome} (${rgbTexto(cor.rgb)}) deu ${fmt(saida)} e a Aqua disse “${disse}” Ela acertou?`,
        geral: "A Aqua respondeu uma cor. Ela acertou?",
        amostra: { cor: corDasEntradas(cor.rgb), nome: cor.nome },
        forma: {
          tipo: "alternativas",
          opcoes: ordem.map((i) => (i === certa ? opcoes[i] : { ...opcoes[i], erro: erros[i] })),
          certa: ordem.indexOf(certa),
        },
        conta: [
          { rotulo: "a Aqua só conhece", conta: "azul (0) e laranja (1)" },
          { rotulo: `o ${cor.nome}`, conta: caso === "nao-conhece" ? "não é nenhum dos dois: não tem resposta certa" : `é ${ehLaranja ? "laranja" : "azul"} e ela disse ${disseLaranja ? "laranja" : "azul"}` },
        ],
        porque: caso === "nao-conhece" ? "A Saída só tem dois lados. Para qualquer cor ela escolhe um deles, mesmo sem ter aprendido aquela cor." : undefined,
      };
    },
  },

  /* 3 · Pesos */
  {
    id: "peso-chega",
    assunto: "pesos",
    gerar: (r) => {
      const c = Math.floor(r() * 3);
      const n = escolher(r, MEIO);
      const entradas = sortearEntradas(r);
      entradas[c] = escolher(r, [0.2, 0.5, 0.8, 1]);
      const rede: RedeQuiz = { ...sortearRede(r), entradas, cor: corDasEntradas(entradas), nome: undefined };
      const linha = linhaEntrada(c, n);
      const x = entradas[c];
      const w = rede.pesos[linha];
      return {
        enunciado: `O ${CANAIS[c]} vale ${fmtCurto(x)} e o peso da linha ${CANAIS[c]} → ${nomeNeuronio(n)} é ${fmtPeso(w)}. Quanto chega no ${nomeNeuronio(n)} por essa linha?`,
        geral: "Cada um tem a sua linha. Quanto chega no neurônio por ela?",
        desenho: desenhoBase(rede, { destaque: [linha] }),
        forma: numero(x * w, { tipo: "linha", id: linha }, "O que chega pela linha", [
          { valor: x + w, erro: "Somaram o valor e o peso: é vezes." },
          { valor: w, erro: "Usaram só o peso, sem multiplicar pelo valor." },
          { valor: -x * w, erro: "Trocaram o sinal do peso." },
        ]),
        conta: [{ rotulo: "valor × peso", conta: `${fmt(x)} × ${fmtPeso(w)} = ${fmt(x * w)}` }],
      };
    },
  },
  {
    id: "peso-empurra",
    assunto: "pesos",
    gerar: (r) => {
      const rede = sortearRede(r);
      const c = Math.floor(r() * 3);
      const n = escolher(r, MEIO);
      if (r() < 0.3) rede.entradas[c] = 0; // às vezes o canal está apagado
      rede.cor = corDasEntradas(rede.entradas);
      rede.nome = undefined;
      const linha = linhaEntrada(c, n);
      const x = rede.entradas[c];
      const w = rede.pesos[linha];
      const opcoes: Opcao[] = [
        { texto: "Para cima: reforça" },
        { texto: "Para baixo: atrapalha" },
        { texto: `Não empurra: o ${CANAIS[c]} é 0` },
      ];
      const certa = x === 0 ? 2 : w > 0 ? 0 : 1;
      const erros = [
        x === 0 ? `O ${CANAIS[c]} é 0: 0 × qualquer peso dá 0.` : "Peso negativo puxa a soma para baixo.",
        x === 0 ? `O ${CANAIS[c]} é 0: 0 × qualquer peso dá 0.` : "Peso positivo empurra a soma para cima.",
        `O ${CANAIS[c]} não é 0: a linha conta na soma.`,
      ];
      const ordem = embaralhar(r, [0, 1, 2]);
      return {
        enunciado: `A linha ${CANAIS[c]} → ${nomeNeuronio(n)} tem peso ${fmtPeso(w)} e o ${CANAIS[c]} vale ${fmtCurto(x)}. Ela empurra a soma do ${nomeNeuronio(n)} para onde?`,
        geral: "Cada um tem a sua linha. Ela empurra a soma do neurônio para onde?",
        desenho: desenhoBase(rede, { destaque: [linha] }),
        forma: { tipo: "alternativas", opcoes: ordem.map((i) => (i === certa ? opcoes[i] : { ...opcoes[i], erro: erros[i] })), certa: ordem.indexOf(certa) },
        conta: [
          { rotulo: "valor × peso", conta: `${fmt(x)} × ${fmtPeso(w)} = ${fmt(x * w)}` },
          { rotulo: "então", conta: x === 0 ? "não muda nada na soma" : w > 0 ? "a soma sobe" : "a soma desce" },
        ],
      };
    },
  },

  /* 4 · Soma ponderada */
  {
    id: "soma-neuronio",
    assunto: "soma",
    gerar: (r) => {
      const rede = ate(r, sortearRede, (x) => x.entradas.filter((v) => v > 0).length >= 2);
      const n = escolher(r, MEIO);
      const { somas } = passar(rede);
      const soma = somas[n];
      const linhas = [0, 1, 2].map((c) => linhaEntrada(c, n));
      return {
        enunciado: `${ACor(rede)} entra na rede. Qual é a soma do ${nomeNeuronio(n)}?`,
        geral: "Cada um tem a sua cor. Qual é a soma do neurônio da Camada 1?",
        desenho: desenhoBase(rede, { destaque: linhas }),
        forma: numero(soma, { tipo: "neuronio", id: n }, `Soma do ${nomeNeuronio(n)}`, [
          { valor: rede.entradas.reduce((a, b) => a + b, 0), erro: "Somaram as entradas sem multiplicar pelos pesos." },
          { valor: linhas.reduce((a, l, c) => a + (rede.entradas[c] ? rede.pesos[l] : 0), 0), erro: "Somaram só os pesos, sem multiplicar pelas entradas." },
          ...(soma < 0 ? [{ valor: 0, erro: "Passaram a ReLU antes da hora: a pergunta é a soma, que vem antes dela." }] : []),
        ]),
        conta: contaDoNeuronio(rede, n),
      };
    },
  },
  {
    id: "soma-saida",
    assunto: "soma",
    gerar: (r) => {
      if (r() < 0.4) {
        // a dica do verde (exemplo do autor): os dois neurônios ouvem o G com o mesmo peso e os
        // pesos até a Saída são opostos, então eles se anulam e a resposta dá 0,50 cravado
        const g = escolher(r, [0.5, 0.8, 1]);
        const rede = sortearRede(r, { nome: "verde", rgb: [0, g, 0] });
        const wG = escolher(r, [0.5, 1, 1.5, 2]);
        rede.pesos[linhaEntrada(1, "n1")] = wG;
        rede.pesos[linhaEntrada(1, "n2")] = wG;
        const a = escolher(r, [0.5, 1, 1.5, 2]);
        const positivo = escolher(r, MEIO);
        for (const n of MEIO) rede.pesos[linhaSaida(n)] = n === positivo ? a : -a;
        const { p, textos, apagados } = meioPreenchido(rede);
        const h = p.valores.n1;
        return {
          enunciado: `O verde (${rgbTexto(rede.entradas)}) deu 0,50 cravado. Os dois neurônios da Camada 1 ouvem o G com o mesmo peso. Quanto dá a soma da Saída?`,
          geral: "Cada um tem a sua cor. Quanto dá a soma da Saída?",
          desenho: desenhoBase(rede, { textos, apagados, destaque: [linhaEntrada(1, "n1"), linhaEntrada(1, "n2")] }),
          forma: numero(0, { tipo: "neuronio", id: "s" }, "Soma da Saída", [
            { valor: h * a, erro: "Contaram só um dos neurônios." },
            { valor: 2 * h * a, erro: "Esqueceram o sinal do peso negativo." },
            { valor: 0.5, erro: "0,50 é a resposta depois da sigmoide; a soma vem antes." },
          ]),
          conta: [...contaDaSaida(rede, p.valores), { rotulo: "a sigmoide de 0 é", conta: "0,50 → a Aqua fica em dúvida" }],
          porque: "O G chega igual nos dois neurônios, então eles acendem igual. Até a Saída os pesos são opostos: um empurra para laranja, o outro para azul. Eles se anulam.",
        };
      }
      const rede = ate(r, sortearRede, (x) => {
        const p = passar(x);
        return (p.valores.n1 > 0 || p.valores.n2 > 0) && exato2(p.somas.s);
      });
      const { p, textos, apagados } = meioPreenchido(rede);
      const semRelu = MEIO.reduce((s, n) => s + p.somas[n] * rede.pesos[linhaSaida(n)], 0);
      return {
        enunciado: `${ACor(rede)} entra na rede. O que cada neurônio da Camada 1 passou já está escrito. Quanto dá a soma da Saída?`,
        geral: "Cada um tem a sua cor. Quanto dá a soma da Saída?",
        desenho: desenhoBase(rede, { textos, apagados, destaque: MEIO.map(linhaSaida) }),
        forma: numero(p.somas.s, { tipo: "neuronio", id: "s" }, "Soma da Saída", [
          { valor: semRelu, erro: "Esqueceram a ReLU: o neurônio com soma negativa passa 0." },
          { valor: sigmoide(p.somas.s), erro: "Já passaram a sigmoide: a pergunta é a soma, que vem antes." },
          { valor: p.valores.n1 + p.valores.n2, erro: "Somaram sem multiplicar pelos pesos." },
        ]),
        conta: contaDaSaida(rede, p.valores),
      };
    },
  },

  /* 5 · ReLU */
  {
    id: "relu-passa",
    assunto: "relu",
    gerar: (r) => {
      const soma = escolher(r, [0.3, 0.5, 0.75, 1.2, 1.5, 2.5]) * (r() < 0.6 ? -1 : 1);
      const n = escolher(r, MEIO);
      const certa = Math.max(0, soma);
      return {
        enunciado: `A soma do ${nomeNeuronio(n)} deu ${fmt(soma)}. O que ele passa adiante?`,
        geral: "A soma de um neurônio da Camada 1 deu um número. O que ele passa adiante?",
        forma: alternativas(r, { texto: fmt(certa) }, [
          soma < 0 ? { texto: fmt(soma), erro: "Esqueceram a ReLU: negativo vira 0." } : { texto: fmt(0), erro: "A ReLU só zera o negativo; o positivo passa igual." },
          { texto: fmt(-soma), erro: soma < 0 ? "A ReLU não troca o sinal: negativo vira 0." : "A ReLU não troca o sinal." },
          { texto: fmt(sigmoide(soma)), erro: "Essa é a sigmoide, que fica na Saída. No meio é a ReLU." },
          { texto: fmt(0.5), erro: "0,50 é a sigmoide de 0, não a ReLU." },
        ]),
        conta: [
          { rotulo: "ReLU", conta: "negativo vira 0; positivo passa igual" },
          { rotulo: `ReLU(${fmt(soma)})`, conta: fmt(certa) },
        ],
      };
    },
  },

  /* 6 · Sigmoide */
  {
    id: "sigmoide-valor",
    assunto: "sigmoide",
    gerar: (r) => {
      const soma = escolher(r, [-3.5, -3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3, 3.5]);
      const certa = sigmoide(soma);
      return {
        enunciado: `A soma da Saída deu ${fmt(soma)}. Depois da sigmoide, a resposta fica perto de quanto?`,
        geral: "A soma da Saída deu um número. Depois da sigmoide, a resposta fica perto de quanto?",
        forma: alternativas(r, { texto: fmt(certa) }, [
          { texto: fmt(sigmoide(-soma)), erro: "Trocaram o lado: soma positiva fica acima de 0,50." },
          { texto: fmt(0.5), erro: "0,50 é só quando a soma é 0." },
          { texto: fmt(Math.max(0, soma)), erro: "Isso é a ReLU, do meio da rede. Na Saída é a sigmoide." },
          { texto: fmt(sigmoide(soma + (soma >= 0 ? 2 : -2))), erro: "Perto, mas a sigmoide desse número dá outro valor." },
          { texto: fmt(sigmoide(soma / 3)), erro: "Perto, mas a sigmoide desse número dá outro valor." },
        ]),
        conta: [
          { rotulo: "a sigmoide", conta: "leva qualquer soma para entre 0 e 1" },
          { rotulo: "soma 0", conta: "0,50 · bem positiva: perto de 1 · bem negativa: perto de 0" },
          { rotulo: `sigmoide(${fmt(soma)})`, conta: `≈ ${fmt(certa)}` },
        ],
      };
    },
  },

  /* 7 · Forward pass */
  {
    id: "forward-meio",
    assunto: "forward",
    gerar: (r) => {
      const negativo = r() < 0.5;
      const n = escolher(r, MEIO);
      const rede = ate(r, sortearRede, (x) => {
        const s = passar(x).somas[n];
        return x.entradas.some((v) => v > 0) && s !== 0 && s < 0 === negativo;
      });
      const { somas, valores } = passar(rede);
      return {
        enunciado: `${ACor(rede)} entra na rede. O que o ${nomeNeuronio(n)} passa adiante?`,
        geral: "Cada um tem a sua cor. O que o neurônio da Camada 1 passa adiante?",
        desenho: desenhoBase(rede, { destaque: [0, 1, 2].map((c) => linhaEntrada(c, n)) }),
        forma: numero(valores[n], { tipo: "neuronio", id: n }, `O que o ${nomeNeuronio(n)} passa`, [
          ...(somas[n] < 0 ? [{ valor: somas[n], erro: "Esqueceram a ReLU: soma negativa passa 0." }] : []),
          { valor: sigmoide(somas[n]), erro: "Usaram a sigmoide. No meio da rede é a ReLU." },
          { valor: rede.entradas.reduce((a, b) => a + b, 0), erro: "Somaram as entradas sem os pesos." },
        ]),
        conta: [...contaDoNeuronio(rede, n), { rotulo: "depois da ReLU", conta: `${fmt(somas[n])} → ${fmt(valores[n])}` }],
      };
    },
  },
  {
    id: "forward-resposta",
    assunto: "forward",
    gerar: (r) => {
      // longe da borda da dúvida (0,30 e 0,70 ficam perto de soma ±0,85)
      const rede = ate(r, sortearRede, (x) => {
        const s = Math.abs(passar(x).somas.s);
        return x.entradas.some((v) => v > 0) && (s <= 0.5 || s >= 1.2);
      });
      // o desenho mostra só a cor e os pesos: o aluno faz a conta inteira
      const { p, apagados } = meioPreenchido(rede);
      const certa = falaDaAqua(p.saida);
      const semRelu = sigmoide(MEIO.reduce((s, n) => s + p.somas[n] * rede.pesos[linhaSaida(n)], 0));
      const erroDe = (f: string) =>
        f === falaDaAqua(semRelu) && f !== certa
          ? "Esqueceram a ReLU: o neurônio com soma negativa passa 0."
          : f === "Fico em dúvida"
            ? "A resposta ficou longe de 0,50: ela tem certeza."
            : certa === "Fico em dúvida"
              ? "A resposta ficou perto de 0,50: ela fica em dúvida."
              : "Trocaram: perto de 1 é laranja, perto de 0 é azul.";
      return {
        enunciado: `${ACor(rede)} atravessa a rede inteira (forward pass). O que a Aqua responde?`,
        geral: "Cada um tem a sua cor. Depois do forward pass, o que a Aqua responde?",
        desenho: desenhoBase(rede),
        forma: alternativas(r, { texto: certa }, FALAS.filter((f) => f !== certa).map((f) => ({ texto: f, erro: erroDe(f) }))),
        conta: [
          ...MEIO.map((n) => ({ rotulo: `${nomeNeuronio(n)}`, conta: `soma ${fmt(p.somas[n])} → ReLU → ${fmt(p.valores[n])}` })),
          { rotulo: "a soma da Saída", conta: fmt(p.somas.s) },
          { rotulo: "a sigmoide", conta: `${fmt(p.saida)} → ${certa}` },
        ],
        porque: apagados.length ? `A ReLU apagou o ${apagados.map((n) => nomeNeuronio(n)).join(" e o ")}: ele passou 0 e não pesou na resposta.` : undefined,
      };
    },
  },

  /* 8 · Erro */
  {
    id: "erro-maior-menor",
    assunto: "erro",
    gerar: (r) => {
      const objetivo = escolher(r, [0, 1] as const);
      const saida = escolher(r, [0.05, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.95]);
      const certa = objetivo === 1 ? 0 : 1;
      const opcoes: Opcao[] = [{ texto: "MAIOR" }, { texto: "MENOR" }];
      const ordem = embaralhar(r, [0, 1]);
      return {
        enunciado: `Era ${certoTexto(objetivo)} e a rede deu ${fmt(saida)}. A resposta devia ter sido MAIOR ou MENOR?`,
        geral: "A rede errou. A resposta devia ter sido MAIOR ou MENOR?",
        forma: {
          tipo: "alternativas",
          opcoes: ordem.map((i) => (i === certa ? opcoes[i] : { ...opcoes[i], erro: `O certo era ${objetivo}: a resposta tem que ir na direção dele.` })),
          certa: ordem.indexOf(certa),
        },
        conta: [
          { rotulo: "o certo", conta: certoTexto(objetivo) },
          { rotulo: `${fmt(saida)} → ${objetivo}`, conta: objetivo === 1 ? "tem que subir: MAIOR" : "tem que descer: MENOR" },
        ],
      };
    },
  },
  {
    id: "erro-quanto",
    assunto: "erro",
    gerar: (r) => {
      const objetivo = escolher(r, [0, 1] as const);
      const saida = escolher(r, [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
      const erro = Math.abs(objetivo - saida);
      return {
        enunciado: `Era ${certoTexto(objetivo)} e a rede deu ${fmt(saida)}. Qual é o erro?`,
        geral: "A rede deu uma resposta. Qual é o erro?",
        forma: numero(erro, null, "O erro", [
          { valor: saida, erro: "Usaram a resposta. O erro é a distância até o certo." },
          { valor: 1 - erro, erro: objetivo === 1 ? "O certo era 1 (laranja)." : "O certo era 0 (azul)." },
          { valor: objetivo - saida, erro: "O erro é a distância: sem sinal." },
        ]),
        conta: [
          { rotulo: "erro", conta: "a distância entre a resposta e o certo" },
          { rotulo: `entre ${fmt(saida)} e ${objetivo}`, conta: fmt(erro) },
        ],
      };
    },
  },

  /* 9 · Backward pass */
  {
    id: "backward-linha-saida",
    assunto: "backward",
    gerar: (r) => {
      const apagado = r() < 0.3; // às vezes o neurônio da linha foi apagado pela ReLU: a linha não muda
      const n = escolher(r, MEIO);
      const objetivo = escolher(r, [0, 1] as const);
      const rede = ate(r, sortearRede, (x) => {
        const p = passar(x);
        return x.entradas.some((v) => v > 0) && Math.abs(p.saida - objetivo) >= 0.2 && p.valores[n] > 0 !== apagado && (p.valores.n1 > 0 || p.valores.n2 > 0);
      });
      const linha = linhaSaida(n);
      const g = culpas(rede, objetivo)[linha] ?? 0;
      const certa: Direcao = g === 0 ? "nao-muda" : g > 0 ? "desce" : "sobe";
      const { p, textos, apagados } = meioPreenchido(rede);
      const devia = objetivo === 1 ? "maior" : "menor";
      return {
        enunciado: `Era ${certoTexto(objetivo)} e a rede deu ${fmt(p.saida)}. A linha ${nomeLinha(linha)} (peso ${fmtPeso(rede.pesos[linha])}) deve…`,
        geral: "A rede errou. A linha do neurônio até a Saída deve SUBIR, DESCER ou NÃO MUDAR?",
        desenho: desenhoBase(rede, { textos: { ...textos, s: fmt(p.saida) }, apagados, destaque: [linha], objetivo }),
        forma: { tipo: "linha", linha, certa },
        conta: [
          { rotulo: "a resposta devia ser", conta: `${devia} (o certo é ${objetivo})` },
          { rotulo: `o ${nomeNeuronio(n)} passou`, conta: fmt(p.valores[n]) },
          {
            rotulo: "então a linha",
            conta: certa === "nao-muda" ? "não muda: ela não fez nada nesta resposta" : `${certa === "sobe" ? "sobe" : "desce"}, para a resposta ficar ${devia}`,
          },
        ],
        porque:
          certa === "nao-muda"
            ? `A ReLU apagou o ${nomeNeuronio(n)} (ele passou 0). Essa linha não fez nada na resposta, então não tem culpa.`
            : `O ${nomeNeuronio(n)} passou um número positivo. Peso maior empurra a resposta para cima, peso menor para baixo.`,
      };
    },
  },
  {
    id: "backward-linha-entrada",
    assunto: "backward",
    gerar: (r) => {
      // três casos, para a certa não ser sempre a mesma: o canal era 0, o neurônio foi apagado, ou muda de verdade
      const caso = escolher(r, ["canal-zero", "apagado", "muda", "muda"] as const);
      const n = escolher(r, MEIO);
      const objetivo = escolher(r, [0, 1] as const);
      let c = 0;
      const rede = ate(
        r,
        (rr) => {
          const x = sortearRede(rr);
          c = Math.floor(rr() * 3);
          if (caso === "canal-zero") x.entradas[c] = 0;
          else if (x.entradas[c] === 0) x.entradas[c] = escolher(rr, [0.5, 0.8, 1]);
          x.cor = corDasEntradas(x.entradas);
          x.nome = CORES.find((k) => k.rgb.every((v, i) => v === x.entradas[i]))?.nome;
          return x;
        },
        (x) => {
          const p = passar(x);
          const aceso = p.somas[n] > 0;
          return Math.abs(p.saida - objetivo) >= 0.2 && (caso === "apagado" ? !aceso : aceso);
        },
      );
      const linha = linhaEntrada(c, n);
      const g = culpas(rede, objetivo)[linha] ?? 0;
      const opcoes: Opcao[] = [
        { texto: `Não muda: o ${CANAIS[c]} era 0, essa linha não fez nada` },
        { texto: `Não muda: o ${nomeNeuronio(n)} foi apagado pela ReLU` },
        { texto: "Muda: sobe" },
        { texto: "Muda: desce" },
      ];
      const certa = caso === "canal-zero" ? 0 : caso === "apagado" ? 1 : g < 0 ? 2 : 3;
      const erros = [
        `O ${CANAIS[c]} não era 0.`,
        `O ${nomeNeuronio(n)} estava aceso: a ReLU não apagou.`,
        certa < 2 ? "A linha não fez nada nesta resposta, então não tem culpa e não muda." : "O lado está trocado: a linha anda contra a culpa.",
        certa < 2 ? "A linha não fez nada nesta resposta, então não tem culpa e não muda." : "O lado está trocado: a linha anda contra a culpa.",
      ];
      const ordem = embaralhar(r, [0, 1, 2, 3]);
      const { p, textos, apagados } = meioPreenchido(rede);
      return {
        enunciado: `Era ${certoTexto(objetivo)} e a rede deu ${fmt(p.saida)}. A linha ${nomeLinha(linha)} muda? Por quê?`,
        geral: "A rede errou. A linha da Entrada até o neurônio muda? Por quê?",
        desenho: desenhoBase(rede, { textos: { ...textos, s: fmt(p.saida) }, apagados, destaque: [linha], objetivo }),
        forma: { tipo: "alternativas", opcoes: ordem.map((i) => (i === certa ? opcoes[i] : { ...opcoes[i], erro: erros[i] })), certa: ordem.indexOf(certa) },
        conta: [
          { rotulo: `o ${CANAIS[c]}`, conta: fmt(rede.entradas[c]) },
          { rotulo: `o ${nomeNeuronio(n)}`, conta: p.somas[n] > 0 ? `aceso (passou ${fmt(p.valores[n])})` : "apagado pela ReLU (passou 0)" },
          { rotulo: "então", conta: opcoes[certa].texto },
        ],
        porque:
          caso === "canal-zero"
            ? `O ${CANAIS[c]} era 0: 0 × o peso dá 0. A linha não fez nada na resposta, então não tem culpa.`
            : caso === "apagado"
              ? `O ${nomeNeuronio(n)} foi apagado pela ReLU: nada do que entrou nele chegou na Saída. As linhas dele não têm culpa.`
              : `A culpa volta da Saída pelo ${nomeNeuronio(n)}, que estava aceso, até a linha. Ela ${certa === 2 ? "sobe" : "desce"} para a resposta ficar ${objetivo === 1 ? "maior" : "menor"}.`,
      };
    },
  },
  {
    id: "backward-forca",
    assunto: "backward",
    gerar: (r) => {
      const rede = sortearRede(r);
      const n = escolher(r, MEIO);
      const linha = linhaSaida(n);
      const v = rede.pesos[linha];
      const sobe = r() < 0.5;
      const novo = r2(v + (sobe ? 0.1 : -0.1));
      const certa = Math.abs(novo) > Math.abs(v) ? 0 : 1;
      const opcoes: Opcao[] = [{ texto: "+ mais forte" }, { texto: "− mais fraca" }, { texto: "= igual" }];
      const erros = [
        "Força é o tamanho do número, sem o sinal: ele ficou mais perto de 0.",
        "Força é o tamanho do número, sem o sinal: ele ficou mais longe de 0.",
        "O número mudou, então a força mudou.",
      ];
      const ordem = embaralhar(r, [0, 1, 2]);
      return {
        enunciado: `A linha ${nomeLinha(linha)} tem peso ${fmtPeso(v)} e vai ${sobe ? "SUBIR" : "DESCER"} um passinho (${fmtPeso(v)} → ${fmtPeso(novo)}). Ela fica mais forte, mais fraca ou igual?`,
        geral: "Uma linha até a Saída vai mudar um passinho. Ela fica mais forte, mais fraca ou igual?",
        desenho: desenhoBase(rede, { destaque: [linha] }),
        forma: { tipo: "alternativas", opcoes: ordem.map((i) => (i === certa ? opcoes[i] : { ...opcoes[i], erro: erros[i] })), certa: ordem.indexOf(certa) },
        conta: [
          { rotulo: "força", conta: "o tamanho do número, sem o sinal" },
          { rotulo: `${fmt(Math.abs(v))} → ${fmt(Math.abs(novo))}`, conta: certa === 0 ? "+ mais forte" : "− mais fraca" },
        ],
        porque:
          v < 0
            ? `Num peso negativo, subir (${fmtPeso(v)} → ${fmtPeso(novo)}) é ${sobe ? "ficar mais fraca" : "ficar mais forte"}: subir/descer e mais forte/mais fraca não são a mesma coisa.`
            : undefined,
      };
    },
  },

  /* 10 · Treino: o passinho */
  {
    id: "treino-passinho",
    assunto: "treino",
    gerar: (r) => {
      const passinho = escolher(r, [0.1, 0.5]);
      const culpa = escolher(r, [0.2, 0.4, 0.6, 0.8, 1]) * (r() < 0.5 ? -1 : 1);
      const peso = escolher(r, PESOS);
      const novo = peso - passinho * culpa;
      return {
        enunciado: `A taxa de aprendizado (o passinho) é ${fmtCurto(passinho)}, a culpa da linha é ${fmt(culpa)} e o peso é ${fmtPeso(peso)}. Qual é o peso novo?`,
        geral: "Com o passinho, a culpa e o peso de uma linha: qual é o peso novo?",
        forma: numero(novo, null, "O peso novo", [
          { valor: peso + passinho * culpa, erro: "Somaram: o peso anda contra a culpa (peso − passinho × culpa)." },
          { valor: peso - culpa, erro: "Esqueceram o passinho: a culpa é multiplicada por ele." },
          { valor: passinho * culpa, erro: "Esse é só o tamanho do passo, não o peso novo." },
        ]),
        conta: [
          { rotulo: "peso novo", conta: "peso − passinho × culpa" },
          { rotulo: "a conta", conta: `${fmtPeso(peso)} − ${fmtCurto(passinho)} × ${fmt(culpa)} = ${fmtPeso(r2(novo))}` },
        ],
      };
    },
  },
];

/* ---------- Gerar e corrigir ---------- */

export const IDS_DOS_MODELOS = MODELOS.map((m) => m.id);
export const modelosDoAssunto = (a: Assunto) => MODELOS.filter((m) => m.assunto === a).map((m) => m.id);

/** A pergunta de um modelo com uma semente. A mesma semente dá sempre a mesma pergunta. */
export function gerarPergunta(modelo: string, semente: number): Pergunta {
  const m = MODELOS.find((x) => x.id === modelo);
  if (!m) throw new Error(`modelo desconhecido: ${modelo}`);
  return { modelo: m.id, assunto: m.assunto, ...m.gerar(sorteador(semente)) };
}

export function corrigir(p: Pergunta, resposta: Resposta | null): boolean {
  if (!resposta) return false;
  const f = p.forma;
  if (f.tipo === "alternativas") return resposta.tipo === "alternativa" && resposta.indice === f.certa;
  if (f.tipo === "numero") return resposta.tipo === "numero" && perto(resposta.valor, f.certa);
  return resposta.tipo === "linha" && resposta.escolha === f.certa;
}

/** A resposta do aluno escrita, para os cards e o "Você respondeu". */
export function textoDaResposta(p: Pergunta, resposta: Resposta | null): string {
  if (!resposta) return "sem resposta";
  if (resposta.tipo === "alternativa" && p.forma.tipo === "alternativas") return p.forma.opcoes[resposta.indice]?.texto ?? "?";
  if (resposta.tipo === "numero") return fmt(resposta.valor);
  if (resposta.tipo === "linha") return NOME_DIRECAO[resposta.escolha];
  return "?";
}

export function textoDaCerta(p: Pergunta): string {
  const f = p.forma;
  if (f.tipo === "alternativas") return f.opcoes[f.certa].texto;
  if (f.tipo === "numero") return fmt(f.certa);
  return NOME_DIRECAO[f.certa];
}

/** Uma chave para agrupar respostas iguais no resultado ("o que a turma respondeu"). */
export function chaveDaResposta(p: Pergunta, resposta: Resposta | null): string {
  return textoDaResposta(p, resposta);
}

/** O erro comum que uma resposta errada representa, se a gente conhece. */
export function erroDaResposta(p: Pergunta, resposta: Resposta | null): string | undefined {
  if (!resposta) return undefined;
  const f = p.forma;
  if (f.tipo === "alternativas" && resposta.tipo === "alternativa") return f.opcoes[resposta.indice]?.erro;
  if (f.tipo === "numero" && resposta.tipo === "numero") return f.erros.find((e) => perto(e.valor, resposta.valor))?.erro;
  return undefined;
}

/** Contas levam mais tempo (60 s) que alternativas e cliques na linha (20 s). */
export const ehConta = (p: Pergunta) => p.forma.tipo === "numero";
