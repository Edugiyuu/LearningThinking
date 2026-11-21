"use client";

// Nuvem de partículas da Home (ADR-0038, atualizações 5 e 6).
// Um <canvas> fica preso atrás da página. Cada seção marca com data-forma="..." a área do quadro do Figma
// (1440 px de largura) e as partículas desenham a forma daquele quadro, ponto por ponto: os pontos vêm de
// public/nuvem/home.json (gerado por scripts/gerar-nuvem-home.py a partir dos quadros do Figma).
// Entre uma seção e a próxima, cada partícula anda (desmanchada) da posição dela numa forma até a outra.
//
// Todo movimento é do GSAP:
// - a rolagem suave: o ScrollSmoother desliza a página com inércia (como no site de referência, a iorq);
// - a troca de forma: o ScrollTrigger liga a rolagem a um número `p` (0 = primeira forma, 1 = segunda...);
// - o hover em "Como funciona": um tween leva a nuvem de um card para o outro e troca a cor da borda;
// - o desenho roda no relógio do GSAP (gsap.ticker), uma vez por quadro.
// Formada, a forma fica parada e nítida (cada ponto cai num pixel inteiro da tela): só a viagem se mexe.
// Com "reduzir movimento": sem rolagem suave, as formas trocam com um esmaecer e o hover troca na hora.
//
// Desempenho: os pontos são agrupados por cor e transparência, e cada grupo é pintado com um único
// preenchimento (um caminho com vários quadradinhos), em vez de um por ponto. As áreas são medidas uma vez
// (posição na página) e não a cada quadro.

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { sorteio } from "@/components/nuvem-formas";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

type Estilo = [cor: string, lado: number, alfa: number];
type Pixel = [x: number, y: number, w: number, h: number, cor: string];
type Dados = {
  quadro: [number, number];
  estilos: Estilo[];
  formas: Record<string, { pontos: number[]; pixels: Pixel[] }>;
};
// Uma forma com o mesmo número de pontos de todas: x, y (no quadro) e o estilo de cada um (-1 = invisível).
type Pontos = { x: Float32Array; y: Float32Array; estilo: Int16Array };
type Forma = Pontos & {
  el: HTMLElement;
  pixels: Pixel[];
  dy: number;
  // posição da área na página (medida uma vez): esquerda, topo e escala do quadro de 1440 px
  esq: number;
  topo: number;
  escala: number;
  // "Como funciona": uma variante por card; a forma mostrada é a mistura entre duas delas
  variantes?: Pontos[];
};

const ALFAS = 12; // níveis de transparência dos grupos de pintura
const CARD_INICIAL = 1; // o card 02, como no quadro do Figma
const AQUA = "#5ED3DB";
// O mouse: os pontos perto dele se afastam, sem mudar de cor (ADR-0038, atualizações 9 e 10).
const RAIO_MOUSE = 100; // px da tela
const EMPURRAO = 55; // quanto o ponto mais perto do mouse se afasta, em px
const VOLTA = 0.16; // quanto do caminho o ponto anda por quadro, indo ou voltando (amortecido)
const BORDA = "#E5E5EA";

function pontosDe(
  pontos: number[],
  n: number,
  semente: number,
  altura: number,
): Pontos {
  const r = sorteio(semente);
  const qtd = pontos.length / 3;
  // ordem embaralhada: cada partícula viaja para um lugar sorteado da próxima forma
  const ordem = Array.from({ length: n }, (_, k) => k);
  for (let k = n - 1; k > 0; k--) {
    const j = Math.floor(r() * (k + 1));
    [ordem[k], ordem[j]] = [ordem[j], ordem[k]];
  }
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const estilo = new Int16Array(n);
  ordem.forEach((k, pos) => {
    if (k < qtd) {
      x[pos] = pontos[k * 3];
      y[pos] = pontos[k * 3 + 1];
      estilo[pos] = pontos[k * 3 + 2];
    } else {
      // forma com menos pontos: as partículas que sobram ficam invisíveis, espalhadas pelo quadro
      x[pos] = r() * 1440;
      y[pos] = r() * altura;
      estilo[pos] = -1;
    }
  });
  return { x, y, estilo };
}

// A viagem entre formas (ADR-0038, atualização 15): fluida, sem explosão.
const ATRASO = 0.35; // até quanto da viagem um ponto pode esperar antes de sair (vira uma onda)
const CURVA = 160; // quanto a curva em S se abre para o lado, em px (escala com a tela)

const POEIRA_DO_TOPO = 1100; // pontos a mais espalhados pelo topo inteiro, até os cantos

/**
 * Área livre em volta de um texto ou botão do topo (data-afastar), em px da tela:
 * - "livre": perto assim, não fica ponto nenhum;
 * - "alcance": até essa distância os pontos vão rareando e são empurrados para fora, mais forte
 *   quanto mais perto (como o mouse). Os botões ganham mais espaço que as linhas de texto.
 */
type Obstaculo = {
  cx: number;
  cy: number;
  mx: number;
  my: number;
  raio: number;
  livre: number;
  alcance: number;
};

/** Distância (com sinal) de um ponto até um retângulo de cantos redondos, e a direção para fora. */
function distancia(
  o: Obstaculo,
  x: number,
  y: number,
): [number, number, number] {
  const qx = Math.abs(x - o.cx) - (o.mx - o.raio);
  const qy = Math.abs(y - o.cy) - (o.my - o.raio);
  const fx = Math.max(qx, 0);
  const fy = Math.max(qy, 0);
  const fora = Math.hypot(fx, fy);
  const d = fora + Math.min(Math.max(qx, qy), 0) - o.raio;
  // direção para fora: do miolo do retângulo até o ponto (dentro, pela borda mais perto)
  let nx = fx * Math.sign(x - o.cx);
  let ny = fy * Math.sign(y - o.cy);
  if (fora === 0) {
    if (qx > qy) nx = Math.sign(x - o.cx) || 1;
    else ny = Math.sign(y - o.cy) || 1;
  }
  const len = Math.hypot(nx, ny) || 1;
  return [d, nx / len, ny / len];
}

function obstaculosDoTopo(secao: HTMLElement): Obstaculo[] {
  const lista: Obstaculo[] = [];
  const add = (
    b: DOMRect,
    livre: number,
    alcance: number,
    redondo: boolean,
  ) => {
    if (!b.width || !b.height) return;
    const mx = b.width / 2;
    const my = b.height / 2;
    lista.push({
      cx: b.left + mx,
      cy: b.top + my,
      mx,
      my,
      raio: redondo ? Math.min(mx, my) : 6,
      livre,
      alcance,
    });
  };
  secao.querySelectorAll<HTMLElement>("[data-afastar]").forEach((t) => {
    if (t.matches("a, button")) add(t.getBoundingClientRect(), 30, 110, true);
    else if (t.matches("span")) add(t.getBoundingClientRect(), 18, 70, true);
    else {
      // uma caixa por linha de texto (Range), para o título centrado não bloquear a largura toda
      const faixa = document.createRange();
      faixa.selectNodeContents(t);
      for (const b of faixa.getClientRects()) add(b, 14, 70, true);
    }
  });
  return lista;
}

/**
 * Afasta um ponto (em px da tela) dos textos e botões, de um jeito natural: empurra para fora com força
 * que cai com a distância (como o mouse) e, perto demais, o ponto some com uma chance que diminui
 * com a distância (a nuvem vai rareando até a borda, sem linha reta). Devolve null se o ponto some.
 */
function afastar(
  obs: Obstaculo[],
  x: number,
  y: number,
  r: () => number,
): [number, number] | null {
  for (const o of obs) {
    const [antes, nx, ny] = distancia(o, x, y);
    if (antes >= o.alcance) continue;
    // empurrão: forte perto, zero no alcance
    const q = 1 - Math.max(0, antes) / o.alcance;
    const emp = (o.livre - Math.min(0, antes)) * 0.6 + q * q * o.alcance * 0.45;
    x += nx * emp;
    y += ny * emp;
    const [d] = distancia(o, x, y);
    if (d < o.livre) return null;
    // rareia perto da borda: chance de ficar sobe suave de 0 (na área livre) a 1 (no alcance)
    const t = Math.min(1, (d - o.livre) / (o.alcance - o.livre));
    if (r() > t * t * (3 - 2 * t)) return null;
  }
  return [x, y];
}

/**
 * O campo de partículas do Figma ocupa só a parte de baixo do topo. Para a tela inicial ficar
 * toda salpicada (como na iorq), sorteia mais pontos pela seção do topo inteira, até os cantos da tela,
 * com os mesmos estilos (cor, tamanho, transparência) do campo. Fica de fora o retângulo do campo,
 * que já tem os pontos dele. Coordenadas no quadro do Figma, como os outros pontos.
 * Os textos e botões (data-afastar) ficam limpos: os pontos perto deles, inclusive os do campo, são
 * afastados e vão rareando até a borda (ADR-0038, atualizações 13 e 14).
 */
function poeiraDoTopo(dados: Dados, el: HTMLElement): number[] {
  const campo = dados.formas.topo.pontos;
  const secao = el.closest("section");
  if (!secao) return campo;
  const q = el.getBoundingClientRect();
  const sq = secao.getBoundingClientRect();
  const s = q.width / 1440;
  const dy = Number(el.dataset.deslocaY ?? 0);
  const paraTela = (x: number, y: number): [number, number] => [
    q.left + x * s,
    q.top + (y + dy) * s,
  ];
  const doQuadro = (x: number, y: number): [number, number] => [
    (x - q.left) / s,
    (y - q.top) / s - dy,
  ];
  const obs = obstaculosDoTopo(secao);
  const r = sorteio(4242);
  const saida: number[] = [];
  const guardar = (x: number, y: number, estilo: number) => {
    const longe = afastar(obs, ...paraTela(x, y), r);
    if (longe) saida.push(...doQuadro(...longe), estilo);
  };
  // o campo do Figma: os mesmos pontos, só afastados dos botões e textos
  for (let k = 0; k < campo.length; k += 3)
    guardar(campo[k], campo[k + 1], campo[k + 2]);
  // a poeira espalhada pela seção inteira
  const [x0, y0] = doQuadro(0, sq.top);
  const [x1, y1] = doQuadro(window.innerWidth, sq.bottom);
  for (let k = 0; k < POEIRA_DO_TOPO; k++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    if (x > 310 && x < 1130 && y > 290 && y < 900) continue; // dentro do campo do Figma
    guardar(x, y, campo[Math.floor(r() * (campo.length / 3)) * 3 + 2]);
  }
  return saida;
}

function montarFormas(
  dados: Dados,
  rolagem: number,
): { formas: Forma[]; n: number } {
  const nomes = (el: HTMLElement) =>
    el.dataset.variantes
      ? el.dataset.variantes.split(",")
      : [el.dataset.forma!];
  const els = [
    ...document.querySelectorAll<HTMLElement>("[data-forma]"),
  ].filter((el) => nomes(el).every((nome) => dados.formas[nome]));
  // os pontos de cada forma (o topo ganha a poeira espalhada até os cantos)
  const pontosDaForma = (el: HTMLElement, nome: string) =>
    nome === "topo" ? poeiraDoTopo(dados, el) : dados.formas[nome].pontos;
  const pontos = new Map(
    els.map((el) => [el, nomes(el).map((nome) => pontosDaForma(el, nome))]),
  );
  const n = Math.max(
    ...els.flatMap((el) => pontos.get(el)!.map((p) => p.length / 3)),
  );
  const formas = els.map((el, i): Forma => {
    const altura = Number(el.dataset.altura ?? 900);
    const variantes = el.dataset.variantes
      ? pontos
          .get(el)!
          .map((p, v) => pontosDe(p, n, 1000 + i * 77 + v * 13, altura))
      : undefined;
    const base = variantes
      ? {
          x: variantes[CARD_INICIAL].x.slice(),
          y: variantes[CARD_INICIAL].y.slice(),
          estilo: variantes[CARD_INICIAL].estilo.slice(),
        }
      : pontosDe(pontos.get(el)![0], n, 1000 + i * 77, altura);
    const q = el.getBoundingClientRect();
    return {
      el,
      ...base,
      variantes,
      pixels: dados.formas[nomes(el)[0]].pixels,
      dy: Number(el.dataset.deslocaY ?? 0),
      esq: q.left + window.scrollX,
      topo: q.top + rolagem,
      escala: q.width / 1440,
    };
  });
  return { formas, n };
}

export function NuvemParticulas() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current!;
    // (sem "desynchronized": em algumas placas de vídeo no Windows ele causava travadas)
    const ctx = el.getContext("2d")!;
    const estado = { p: 0 };
    let dados: Dados | null = null;
    let cores: string[] = []; // cor de cada estilo, sem repetir
    let corDoEstilo = new Int16Array(0);
    let formas: Forma[] = [];
    let n = 0;
    // por ponto, o caminho da viagem: para que lado sai (-1 a 1), quanto sobe (0 a 1),
    // e para onde voa na explosão (ângulo e distância)
    let desvio = new Float32Array(0);
    let reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vivo = true;
    let gatilho: ScrollTrigger | null = null;
    let linha: gsap.core.Timeline | null = null;
    let dpr = 1;
    // buffers da pintura (reaproveitados a cada quadro)
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let lado = new Float32Array(0);
    let grupo = new Int32Array(0);
    let ordem = new Int32Array(0);
    let contagem = new Int32Array(0);

    // Rolagem suave (ScrollSmoother): a página desliza com inércia. A posição que vale para o desenho é a
    // da página deslizando (smoother.scrollTop()), não a da barra de rolagem.
    const suave = reduzir
      ? null
      : ScrollSmoother.create({
          wrapper: "#rolagem-suave",
          content: "#rolagem-suave-conteudo",
          smooth: 1.1,
          smoothTouch: 0.1,
        });
    const rolagemAtual = () => (suave ? suave.scrollTop() : window.scrollY);

    // "Como funciona": a mistura entre a variante de onde a nuvem sai e a do card em que o mouse está.
    const mistura = { m: 1 };
    let de: Pontos | null = null;
    let para = CARD_INICIAL;
    let tweenDoCard: gsap.core.Tween | null = null;

    const ajustarCanvas = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
    };

    function aplicarMistura(f: Forma) {
      if (!f.variantes || !de) return;
      const alvo = f.variantes[para];
      const m = mistura.m;
      // no hover a nuvem escorre de um card para o outro: cada ponto sai num momento um pouco
      // diferente (atraso), sem estouro
      for (let k = 0; k < n; k++) {
        const atraso = desvio[k * 4 + 1] * ATRASO;
        const tk = Math.min(1, Math.max(0, (m - atraso) / (1 - ATRASO)));
        const e = tk * tk * (3 - 2 * tk);
        f.x[k] = de.x[k] + (alvo.x[k] - de.x[k]) * e;
        f.y[k] = de.y[k] + (alvo.y[k] - de.y[k]) * e;
        f.estilo[k] = e < 0.5 ? de.estilo[k] : alvo.estilo[k];
      }
    }

    function irParaCard(k: number) {
      const f = formas.find((x) => x.variantes);
      document.querySelectorAll<HTMLElement>("[data-card]").forEach((c) => {
        const ativo = Number(c.dataset.card) === k;
        gsap.to(c, {
          borderColor: ativo ? AQUA : BORDA,
          duration: reduzir ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      if (!f || k === para) return;
      // a nuvem sai de onde está agora (mesmo no meio de outra troca)
      de = { x: f.x.slice(), y: f.y.slice(), estilo: f.estilo.slice() };
      para = k;
      tweenDoCard?.kill();
      mistura.m = 0;
      tweenDoCard = gsap.to(mistura, {
        m: 1,
        duration: reduzir ? 0 : 0.9,
        ease: "power3.inOut",
        onUpdate: () => aplicarMistura(f),
        onComplete: () => aplicarMistura(f),
      });
    }

    // O mouse segue o ponteiro com um pouco de atraso (gsap.quickTo); "forca" acende quando o mouse
    // entra na página e apaga quando sai. Cada ponto guarda o quanto foi empurrado (dispX/dispY) e volta
    // para o lugar dele aos poucos, então a forma fica nítida de novo quando o mouse vai embora.
    const comMouse =
      !reduzir &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mouse = { x: -9999, y: -9999 };
    const forca = { v: 0 };
    const mouseX = gsap.quickTo(mouse, "x", { duration: 0.25, ease: "power3" });
    const mouseY = gsap.quickTo(mouse, "y", { duration: 0.25, ease: "power3" });
    let dispX = new Float32Array(0);
    let dispY = new Float32Array(0);
    let mexendo = false; // algum ponto ainda fora do lugar
    const aoMover = (ev: PointerEvent) => {
      if (forca.v === 0) gsap.set(mouse, { x: ev.clientX, y: ev.clientY });
      mouseX(ev.clientX);
      mouseY(ev.clientY);
      gsap.to(forca, {
        v: 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
      });
    };
    const aoSair = () =>
      gsap.to(forca, {
        v: 0,
        duration: 0.6,
        ease: "power2.out",
        overwrite: true,
      });

    // Só redesenha quando algo mudou (rolagem, troca de forma, hover ou tamanho da tela).
    let ultimo = "";
    let sujo = true;
    function desenhar() {
      if (!dados || formas.length < 2) return;
      const chave = `${estado.p}|${rolagemAtual()}|${mistura.m}|${mouse.x}|${mouse.y}|${forca.v}`;
      if (!sujo && !mexendo && chave === ultimo) return;
      ultimo = chave;
      sujo = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const p = Math.min(Math.max(estado.p, 0), formas.length - 1);
      const i = Math.min(Math.floor(p), formas.length - 2);
      const t = p - i;
      const A = formas[i];
      const B = formas[i + 1];
      const rolagem = rolagemAtual();
      const alturaTela = window.innerHeight;
      // O canto de cada forma cai num pixel inteiro: a forma anda inteira junto com a rolagem, sem
      // cada ponto arredondar para um lado (isso fazia a forma "tremer" ao rolar).
      const inteiro = (v: number) => Math.round(v * dpr) / dpr;
      const ax = inteiro(A.esq - window.scrollX);
      const ay = inteiro(A.topo - rolagem + A.dy * A.escala);
      const bx = inteiro(B.esq - window.scrollX);
      const by = inteiro(B.topo - rolagem + B.dy * B.escala);
      const sa = A.escala;
      const sb = B.escala;
      const e = t * t * (3 - 2 * t); // suave no começo e no fim da viagem
      // A viagem, fluida e sem explosão: cada ponto faz uma curva suave em S (Bézier cúbica:
      // sai para o lado e um pouco para cima, e chega no lugar novo vindo do outro lado), e cada um
      // começa num momento um pouco diferente (atraso), então a nuvem escorre como uma onda.
      const escalaTela = Math.min(1, window.innerWidth / 1440);
      const fracao = window.innerWidth < 1024 ? 0.5 : 1; // no celular, mais clara atrás do texto
      const estilos = dados.estilos;
      const nCores = cores.length;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // pixels cheios (a Aqua do topo): somem e aparecem junto com a forma
      const pintarPixels = (
        f: Forma,
        x0: number,
        y0: number,
        s: number,
        alfa: number,
      ) => {
        if (alfa <= 0.01 || !f.pixels.length) return;
        ctx.globalAlpha = alfa * fracao;
        for (const [x, y, pw, ph, cor] of f.pixels) {
          ctx.fillStyle = cor;
          ctx.fillRect(x0 + x * s, y0 + y * s, pw * s, ph * s);
        }
      };
      pintarPixels(A, ax, ay, sa, reduzir ? Math.max(0, 1 - 2 * t) : 1 - e);
      pintarPixels(B, bx, by, sb, reduzir ? Math.max(0, 2 * t - 1) : e);

      const R2 = RAIO_MOUSE * RAIO_MOUSE;
      const mx = mouse.x;
      const my = mouse.y;
      const fm = forca.v;
      let algumFora = false;

      // 1) posição, tamanho e grupo (cor x transparência) de cada ponto
      contagem.fill(0);
      for (let k = 0; k < n; k++) {
        grupo[k] = -1;
        const ea = A.estilo[k];
        const eb = B.estilo[k];
        if (ea < 0 && eb < 0) continue;
        let x: number, y: number, l: number, alfa: number, est: number;
        if (reduzir) {
          const usaA = t < 0.5;
          est = usaA ? ea : eb;
          if (est < 0) continue;
          x = usaA ? ax + A.x[k] * sa : bx + B.x[k] * sb;
          y = usaA ? ay + A.y[k] * sa : by + B.y[k] * sb;
          l = estilos[est][1] * (usaA ? sa : sb);
          alfa = estilos[est][2] * Math.abs(1 - 2 * t);
        } else {
          const d = k * 4;
          const x0 = ax + A.x[k] * sa;
          const y0 = ay + A.y[k] * sa;
          const x3 = bx + B.x[k] * sb;
          const y3 = by + B.y[k] * sb;
          // o tempo deste ponto: começa depois do atraso dele e termina junto com os outros
          const atraso = desvio[d + 1] * ATRASO;
          const tk = Math.min(1, Math.max(0, (t - atraso) / (1 - ATRASO)));
          const ek = tk * tk * (3 - 2 * tk);
          if (ek <= 0 || ek >= 1) {
            x = ek <= 0 ? x0 : x3;
            y = ek <= 0 ? y0 : y3;
          } else {
            const lado = desvio[d] * CURVA * escalaTela;
            const sobe = (0.3 + desvio[d + 3] * 0.7) * CURVA * 0.6 * escalaTela;
            const x1 = x0 + lado;
            const y1 = y0 - sobe;
            const x2 = x3 - lado * 0.7;
            const y2 = y3 - sobe * 0.5;
            const u = 1 - ek;
            const b0 = u * u * u;
            const b1 = 3 * u * u * ek;
            const b2 = 3 * u * ek * ek;
            const b3 = ek * ek * ek;
            x = b0 * x0 + b1 * x1 + b2 * x2 + b3 * x3;
            y = b0 * y0 + b1 * y1 + b2 * y2 + b3 * y3;
          }
          const sA = ea >= 0 ? estilos[ea] : null;
          const sB = eb >= 0 ? estilos[eb] : null;
          est = ek < 0.5 ? (ea >= 0 ? ea : eb) : eb >= 0 ? eb : ea;
          l =
            (sA ? sA[1] * sa : sB![1] * sb) * (1 - ek) +
            (sB ? sB[1] * sb : sA![1] * sa) * ek;
          alfa = (sA ? sA[2] : 0) * (1 - ek) + (sB ? sB[2] : 0) * ek;
        }
        if (alfa <= 0.02) continue;
        const corIdx = corDoEstilo[est];
        if (comMouse) {
          // empurra para longe do mouse (mais forte quanto mais perto) e volta amortecido
          let ex = 0;
          let ey = 0;
          if (fm > 0) {
            const dx = x - mx;
            const dy = y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const q = 1 - d / RAIO_MOUSE;
              const f = q * q * fm * EMPURRAO;
              ex = (dx / d) * f;
              ey = (dy / d) * f;
            }
          }
          let ox = dispX[k] + (ex - dispX[k]) * VOLTA;
          let oy = dispY[k] + (ey - dispY[k]) * VOLTA;
          if (
            Math.abs(ox) < 0.05 &&
            Math.abs(oy) < 0.05 &&
            ex === 0 &&
            ey === 0
          )
            ox = oy = 0;
          dispX[k] = ox;
          dispY[k] = oy;
          if (ox !== 0 || oy !== 0) {
            algumFora = true;
            x += ox;
            y += oy;
          }
        }
        if (y < -10 || y > alturaTela + 10) continue;
        // nítido: o quadradinho começa e termina em pixels inteiros da tela (sem borrar a borda)
        const ld = Math.max(1, Math.round(l * dpr));
        px[k] = Math.round(x * dpr - ld / 2) / dpr;
        py[k] = Math.round(y * dpr - ld / 2) / dpr;
        lado[k] = ld / dpr;
        const g =
          corIdx * ALFAS +
          Math.min(ALFAS - 1, Math.round(alfa * fracao * (ALFAS - 1)));
        grupo[k] = g;
        contagem[g]++;
      }

      mexendo = algumFora;

      // 2) ordena os pontos por grupo (contagem) e pinta cada grupo de uma vez
      let soma = 0;
      for (let g = 0; g < contagem.length; g++) {
        const c = contagem[g];
        contagem[g] = soma;
        soma += c;
      }
      const inicio = contagem.slice();
      for (let k = 0; k < n; k++) {
        const g = grupo[k];
        if (g >= 0) ordem[contagem[g]++] = k;
      }
      for (let g = 0; g < nCores * ALFAS; g++) {
        const a = inicio[g];
        const b = contagem[g];
        if (a === b) continue;
        ctx.globalAlpha = (g % ALFAS) / (ALFAS - 1);
        ctx.fillStyle = cores[Math.floor(g / ALFAS)];
        ctx.beginPath();
        for (let j = a; j < b; j++) {
          const k = ordem[j];
          const l = lado[k];
          ctx.rect(px[k], py[k], l, l);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // A linha do tempo: a forma k fica parada enquanto a área dela passa pelo meio da tela
    // e viaja até a k + 1 no resto do caminho. A duração de cada trecho é a distância em pixels.
    function montarRolagem() {
      gatilho?.kill();
      linha?.kill();
      if (formas.length < 2) return;
      const s = formas.map((f) =>
        Math.max(
          0,
          f.topo +
            (f.escala * Number(f.el.dataset.altura ?? 900)) / 2 -
            window.innerHeight / 2,
        ),
      );
      linha = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      for (let k = 0; k < formas.length - 1; k++) {
        const dist = Math.max(1, s[k + 1] - s[k]);
        const parada = dist * 0.22;
        linha.to(
          estado,
          { p: k + 1, duration: dist - 2 * parada },
          s[k] - s[0] + parada,
        );
      }
      linha.set({}, {}, s[s.length - 1] - s[0]); // o fim da linha é a última forma
      gatilho = ScrollTrigger.create({
        start: s[0],
        end: s[s.length - 1],
        animation: linha,
        scrub: true, // a inércia já vem do ScrollSmoother
      });
    }

    // Os textos das seções sobem e aparecem quando chegam na tela.
    const revelar = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-revelar]").forEach((t) => {
        gsap.from(t, {
          y: reduzir ? 0 : 28,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: t.firstElementChild ?? t,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });
    });

    // Hover (e toque) nos cards de "Como funciona": a nuvem vai para o card.
    const aoEntrar = (ev: Event) =>
      irParaCard(Number((ev.currentTarget as HTMLElement).dataset.card));
    const cards = [...document.querySelectorAll<HTMLElement>("[data-card]")];
    cards.forEach((c) => {
      c.addEventListener("pointerenter", aoEntrar);
      c.addEventListener("focusin", aoEntrar);
    });

    let espera: ReturnType<typeof setTimeout> | undefined;
    const refazer = () => {
      clearTimeout(espera);
      espera = setTimeout(async () => {
        ajustarCanvas();
        if (!dados) {
          try {
            dados = (await (
              await fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH}/nuvem/home.json`,
              )
            ).json()) as Dados;
          } catch {
            return;
          }
          cores = [...new Set(dados.estilos.map((s) => s[0]))];
          corDoEstilo = Int16Array.from(dados.estilos, (s) =>
            cores.indexOf(s[0]),
          );
        }
        if (!vivo) return;
        tweenDoCard?.kill();
        ({ formas, n } = montarFormas(dados, rolagemAtual()));
        para = CARD_INICIAL;
        mistura.m = 1;
        if (desvio.length !== n * 4) {
          const r = sorteio(7);
          desvio = Float32Array.from({ length: n * 4 }, (_, k) => {
            const qual = k % 4;
            if (qual === 0) return r() * 2 - 1; // lado
            if (qual === 1) return r(); // subida
            if (qual === 2) return r() * Math.PI * 2; // direção da explosão
            return 0.35 + 0.65 * Math.sqrt(r()); // distância da explosão
          });
          dispX = new Float32Array(n);
          dispY = new Float32Array(n);
          px = new Float32Array(n);
          py = new Float32Array(n);
          lado = new Float32Array(n);
          grupo = new Int32Array(n);
          ordem = new Int32Array(n);
        }
        contagem = new Int32Array(cores.length * ALFAS);
        irParaCard(CARD_INICIAL);
        montarRolagem();
        // avisa o ScrollSmoother e o ScrollTrigger da altura nova da página
        ScrollTrigger.refresh();
        sujo = true;
      }, 150);
    };

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const aoMudarMovimento = () => {
      reduzir = reduzMovimento.matches;
      montarRolagem();
    };
    reduzMovimento.addEventListener("change", aoMudarMovimento);

    // O conteúdo muda de altura quando as fontes carregam: as áreas são medidas de novo.
    // (Observa só o conteúdo, não o <body>: o ScrollSmoother muda a altura do <body> e isso
    // refazia tudo no meio da rolagem, causando as travadas.)
    const conteudo =
      document.getElementById("rolagem-suave-conteudo") ?? document.body;
    let alturaConteudo = 0;
    const observador = new ResizeObserver(() => {
      const h = Math.round(conteudo.offsetHeight);
      if (h === alturaConteudo) return;
      alturaConteudo = h;
      refazer();
    });
    observador.observe(conteudo);
    window.addEventListener("resize", refazer);
    refazer();
    gsap.ticker.add(desenhar);
    if (comMouse) {
      window.addEventListener("pointermove", aoMover, { passive: true });
      document.documentElement.addEventListener("pointerleave", aoSair);
    }

    return () => {
      vivo = false;
      clearTimeout(espera);
      gsap.ticker.remove(desenhar);
      window.removeEventListener("pointermove", aoMover);
      document.documentElement.removeEventListener("pointerleave", aoSair);
      observador.disconnect();
      window.removeEventListener("resize", refazer);
      reduzMovimento.removeEventListener("change", aoMudarMovimento);
      cards.forEach((c) => {
        c.removeEventListener("pointerenter", aoEntrar);
        c.removeEventListener("focusin", aoEntrar);
      });
      suave?.kill();
      tweenDoCard?.kill();
      gatilho?.kill();
      linha?.kill();
      revelar.revert();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    />
  );
}
