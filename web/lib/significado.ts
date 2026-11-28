// As contas da aba Busca por significado (ADR-0037), sem nada de tela.
// O modelo (all-MiniLM-L6-v2) dá 384 números por token; daqui para frente é só conta:
// média dos tokens (mean pooling), normalização, similaridade de cosseno e o PCA do mapa.

export type Vetor = number[];

/** Produto escalar: multiplicar par a par e somar (a mesma conta do neurônio). */
export function produtoEscalar(a: Vetor, b: Vetor): number {
  if (a.length !== b.length) throw new Error(`tamanhos diferentes: ${a.length} e ${b.length}`);
  let soma = 0;
  for (let i = 0; i < a.length; i++) soma += a[i] * b[i];
  return soma;
}

/** Norma: o tamanho da lista (raiz da soma dos quadrados). */
export function norma(a: Vetor): number {
  return Math.sqrt(produtoEscalar(a, a));
}

/** Normalizar: dividir a lista toda pelo mesmo número (a norma), para o tamanho virar 1.
 *  Mantém a proporção e o sinal; é diferente da sigmoide, que mexe em cada número sozinho. */
export function normalizar(a: Vetor): Vetor {
  const n = norma(a);
  if (n === 0) return a.map(() => 0);
  return a.map((x) => x / n);
}

/** Similaridade de cosseno: produto escalar ÷ (norma × norma). Vai de −1 a 1. */
export function cosseno(a: Vetor, b: Vetor): number {
  const na = norma(a);
  const nb = norma(b);
  if (na === 0 || nb === 0) return 0;
  return produtoEscalar(a, b) / (na * nb);
}

/** Média dos tokens (mean pooling): uma lista de 384 por token vira uma lista só.
 *  [CLS] e [SEP] entram na média, como no modelo (a máscara deles vale 1). */
export function mediaDosTokens(tokens: Vetor[]): Vetor {
  if (tokens.length === 0) throw new Error("nenhum token");
  const tamanho = tokens[0].length;
  const media = new Array<number>(tamanho).fill(0);
  for (const t of tokens) {
    if (t.length !== tamanho) throw new Error("tokens com tamanhos diferentes");
    for (let i = 0; i < tamanho; i++) media[i] += t[i];
  }
  return media.map((x) => x / tokens.length);
}

/** O embedding como o modelo entrega: média dos tokens e depois normalização. */
export function embeddingDosTokens(tokens: Vetor[]): Vetor {
  return normalizar(mediaDosTokens(tokens));
}

export type Ponto = { x: number; y: number };

/**
 * Leva os pontos do PCA para dentro de um retângulo da tela, mantendo a proporção
 * (o mapa não estica um eixo mais que o outro). O y cresce para baixo, como na tela.
 * Usa TODOS os pontos, até os escondidos: esconder não pode mexer em ninguém (ADR-0037).
 */
export function encaixarNoMapa(pontos: Ponto[], largura: number, altura: number, margem: number): Ponto[] {
  if (pontos.length === 0) return [];
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const larguraUtil = largura - 2 * margem;
  const alturaUtil = altura - 2 * margem;
  const escala = Math.min(larguraUtil / (maxX - minX || 1), alturaUtil / (maxY - minY || 1));
  // centraliza o desenho no retângulo
  const sobraX = (larguraUtil - (maxX - minX) * escala) / 2;
  const sobraY = (alturaUtil - (maxY - minY) * escala) / 2;
  return pontos.map((p) => ({
    x: margem + sobraX + (p.x - minX) * escala,
    y: margem + sobraY + (maxY - p.y) * escala,
  }));
}

/**
 * PCA para o mapa: leva cada lista de N números para 2.
 * Centraliza (tira a média de todos), acha as 2 direções de maior espalhamento
 * (componentes principais, pelo método da potência) e projeta cada lista nelas.
 * Calcula todos os pontos juntos: mudar a lista de textos muda as posições.
 * Determinístico: o mesmo conjunto de listas dá sempre o mesmo mapa.
 */
export function pca2d(listas: Vetor[]): Ponto[] {
  const n = listas.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: 0 }];
  const d = listas[0].length;
  const centro = mediaDosTokens(listas);
  const X = listas.map((l) => l.map((v, i) => v - centro[i]));

  // Covariância multiplicada por um vetor sem montar a matriz d×d: C·v = Xᵀ(X·v) / n
  const vezesCov = (v: Vetor): Vetor => {
    const Xv = X.map((linha) => produtoEscalar(linha, v));
    const r = new Array<number>(d).fill(0);
    for (let k = 0; k < n; k++) for (let i = 0; i < d; i++) r[i] += X[k][i] * Xv[k];
    return r.map((x) => x / n);
  };

  const componente = (ortogonalA?: Vetor): Vetor => {
    // começo fixo (não aleatório) para o mapa não mudar entre execuções
    let v = normalizar(Array.from({ length: d }, (_, i) => 1 + ((i * 7919) % 13) / 13));
    for (let passo = 0; passo < 200; passo++) {
      let w = vezesCov(v);
      if (ortogonalA) {
        const p = produtoEscalar(w, ortogonalA);
        w = w.map((x, i) => x - p * ortogonalA[i]);
      }
      const nw = norma(w);
      if (nw < 1e-12) return v.map(() => 0);
      const novo = w.map((x) => x / nw);
      const mudou = norma(novo.map((x, i) => x - v[i]));
      v = novo;
      if (mudou < 1e-10) break;
    }
    // sinal fixo: o maior número da direção fica positivo (senão o mapa pode espelhar)
    let maior = 0;
    for (let i = 1; i < d; i++) if (Math.abs(v[i]) > Math.abs(v[maior])) maior = i;
    return v[maior] < 0 ? v.map((x) => -x) : v;
  };

  const e1 = componente();
  const e2 = componente(e1);
  return X.map((linha) => ({ x: produtoEscalar(linha, e1), y: produtoEscalar(linha, e2) }));
}
