"use client";

import { Aqua, AquaCozinhando, AquaFantasia, AquaReacao, type FantasiaAqua, type ReacaoAqua } from "@/components/mascote";
import { formatar } from "@/lib/rede";

// Palcos do tutorial 01 · O neurônio, iguais ao frame "Tutorial 01 · O neurônio · roteiro" no Figma.
// Cada palco usa o mesmo tamanho do Figma (420 × 368) e é ampliado pelo SVG.
// Os números são os da Aqua fazendo panqueca (docs/07-guia-de-conteudo.md).

const AQUA = "#5ED3DB";
const AQUA_TEXTO = "#0E7C86";
const AQUA_FUNDO = "#E6F7F8";
const TEXTO = "#1D1D1F";
const MUDO = "#6E6E73";
const SUTIL = "#86868B";
const BORDA = "#E5E5EA";
const VERDE = "#30A46C";
const VERDE_CLARO = "#7FCFA3";
const VERMELHO = "#E5484D";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

const VIEWBOX = "0 0 420 368";

/** Panqueca da Aqua: entradas, pesos e o que sai de cada conta. */
export const PANQUECA = {
  entradas: [
    { nome: "cor da massa", x: 0.9, w: 0.8, icone: "panqueca" },
    { nome: "tempo no fogo", x: 0.6, w: 0.5, icone: "relogio" },
    { nome: "música", x: 0.3, w: -0.1, icone: "musica" },
  ],
} as const;
const Z = PANQUECA.entradas.reduce((s, e) => s + e.x * e.w, 0); // 0,99
const sigmoide = (z: number) => 1 / (1 + Math.exp(-z));

/* ---------------- Peças em comum ---------------- */

function Pixel({ x, y, unidade, celulas }: { x: number; y: number; unidade: number; celulas: [number, number, number, number, string][] }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${unidade})`} shapeRendering="crispEdges">
      {celulas.map(([cx, cy, w, h, cor], i) => (
        <rect key={i} x={cx} y={cy} width={w} height={h} fill={cor} />
      ))}
    </g>
  );
}

const ICONES = {
  panqueca: [
    [1, 0, 5, 1, "#E9B44C"],
    [0, 1, 7, 2, "#E9B44C"],
    [1, 3, 5, 1, "#C98A2B"],
    [2, 1, 1, 1, "#F6D58E"],
  ],
  relogio: [
    [1, 2, 5, 3, "#FFFFFF"],
    [2, 1, 3, 1, "#FFFFFF"],
    [2, 5, 3, 1, "#FFFFFF"],
    [2, 0, 3, 1, MUDO],
    [1, 1, 1, 1, MUDO],
    [5, 1, 1, 1, MUDO],
    [0, 2, 1, 3, MUDO],
    [6, 2, 1, 3, MUDO],
    [1, 5, 1, 1, MUDO],
    [5, 5, 1, 1, MUDO],
    [2, 6, 3, 1, MUDO],
    [3, 2, 1, 2, TEXTO],
    [4, 3, 1, 1, TEXTO],
  ],
  musica: [
    [3, 0, 1, 5, MUDO],
    [4, 0, 2, 1, MUDO],
    [5, 1, 1, 1, MUDO],
    [1, 4, 2, 2, MUDO],
    [0, 5, 1, 1, MUDO],
  ],
} satisfies Record<string, [number, number, number, number, string][]>;

function Icone({ nome, x, y }: { nome: keyof typeof ICONES; x: number; y: number }) {
  return <Pixel x={x} y={y} unidade={3} celulas={ICONES[nome]} />;
}

/** As peças de pixel art da Aqua dentro do SVG do palco. */
function Em({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <g transform={`translate(${x} ${y})`}>{children}</g>;
}

/** Faixa aqua no pé do palco dizendo onde a ideia aparece no laboratório. */
function NoLab({ texto, largura = 300 }: { texto: string; largura?: number }) {
  return (
    <g>
      <rect x={210 - largura / 2} y={339} width={largura} height={20} rx={10} fill={AQUA_FUNDO} />
      <text x={210} y={352.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={AQUA_TEXTO}>
        {texto}
      </text>
    </g>
  );
}

function Pilula({ x, y, texto, cor, largura }: { x: number; y: number; texto: string; cor: string; largura: number }) {
  return (
    <g>
      <rect x={x - largura / 2} y={y - 9} width={largura} height={18} rx={9} fill="#FFFFFF" stroke={cor} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={cor}>
        {texto}
      </text>
    </g>
  );
}

const corDoPeso = (w: number) => (w > 0 ? VERDE : VERMELHO);

/* ---------------- Passo 2 · A Aqua aprendendo a cozinhar ---------------- */

const LIGACOES = ["cor da massa", "tempo no fogo", "música tocando"];

function Tentativa({ y, titulo, treinada }: { y: number; titulo: string; treinada: boolean }) {
  const porta: [number, number] = [266, y + 62];
  return (
    <g>
      <text x={12} y={y + 12} fontSize={12} fontWeight={700} fill={MUDO}>
        {titulo}
      </text>
      {LIGACOES.map((nome, i) => {
        const cy = y + 39 + i * 40;
        const fraca = treinada && i === 2;
        return (
          <g key={nome}>
            <line
              data-traco
              x1={124} y1={cy} x2={porta[0]} y2={porta[1]}
              stroke={!treinada ? "#B5B5BA" : fraca ? "#D2D2D7" : VERDE}
              strokeWidth={!treinada ? 2.5 : fraca ? 1 : 6}
            />
            <rect x={12} y={cy - 13} width={112} height={26} rx={13} fill="#FFFFFF" stroke={BORDA} />
            <text x={68} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={fraca ? SUTIL : TEXTO}>
              {nome}
            </text>
          </g>
        );
      })}
      <Em x={266} y={y + 34}>
        <AquaCozinhando noPonto={treinada} rotulo={treinada ? "A Aqua confiante com a panqueca no ponto." : "A Aqua preocupada com a panqueca queimada."} />
      </Em>
    </g>
  );
}

export function Cozinha() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Na primeira tentativa a Aqua presta atenção em tudo e a panqueca queima. Depois de treinar, as ligações que ajudam ficam fortes e a da música fica fraca.">
      <Tentativa y={0} titulo="1ª tentativa: queimou" treinada={false} />
      <line x1={12} y1={172} x2={408} y2={172} stroke={BORDA} />
      <Tentativa y={176} titulo="depois de treinar: no ponto" treinada />
      <text x={210} y={351} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={AQUA_TEXTO}>
        na IA, a força de cada ligação é o peso
      </text>
    </svg>
  );
}

/* ---------------- Passo 3 · Do cérebro à matemática ---------------- */

const MARCOS: { ano: string; x: number; em: "cima" | "baixo"; linhas: string[]; aquas: { quem: FantasiaAqua | null; x: number }[]; atual?: boolean }[] = [
  { ano: "1943", x: 60, em: "cima", linhas: ["neurônio de", "McCulloch-Pitts"], aquas: [{ quem: "mcculloch", x: 16 }, { quem: "pitts", x: 62 }] },
  { ano: "1958", x: 160, em: "baixo", linhas: ["perceptron", "(Rosenblatt)"], aquas: [{ quem: "rosenblatt", x: 140 }] },
  { ano: "1986", x: 270, em: "cima", linhas: ["retropropagação", "(backpropagation)"], aquas: [{ quem: "anos80", x: 250 }] },
  { ano: "hoje", x: 370, em: "baixo", linhas: ["redes profundas"], aquas: [{ quem: null, x: 350 }], atual: true },
];

const NOME_FANTASIA: Record<FantasiaAqua, string> = {
  mcculloch: "Aqua de McCulloch, com laterais grisalhas e barba",
  pitts: "Aqua de Pitts, com cabelo escuro repartido de lado",
  rosenblatt: "Aqua de Rosenblatt, com topete e óculos de armação grossa",
  anos80: "Aqua dos anos 80, com cabelo volumoso e suéter",
};

export function Historia() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Linha do tempo: 1943, neurônio de McCulloch-Pitts; 1958, perceptron de Rosenblatt; 1986, retropropagação; hoje, redes profundas.">
      <line x1={18} y1={190} x2={402} y2={190} stroke="#D2D2D7" strokeWidth={2} />
      {MARCOS.map((m) => {
        const cima = m.em === "cima";
        return (
          <g key={m.ano}>
            <circle cx={m.x} cy={190} r={7} fill={m.atual ? AQUA : AQUA_TEXTO} />
            <text x={m.x} y={cima ? 167 : 217} textAnchor="middle" fontSize={13} fontWeight={700} fill={TEXTO}>
              {m.ano}
            </text>
            {m.linhas.map((l, i) => (
              <text key={l} x={m.x} y={(cima ? 127 : 235) + i * 16} textAnchor="middle" fontSize={11} fill={MUDO}>
                {l}
              </text>
            ))}
            {m.aquas.map((a) => (
              <Em key={a.x} x={a.x} y={cima ? 75 : 258}>
                {a.quem ? <AquaFantasia quem={a.quem} rotulo={NOME_FANTASIA[a.quem]} /> : <g transform="translate(0 12)"><Aqua unidade={4} rotulo="A Aqua de hoje" /></g>}
              </Em>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- Passo 4 · Cérebro × IA × laboratório ---------------- */

const PONTE = [
  ["dendritos", "entradas xᵢ", "bloco Entrada"],
  ["força da ligação", "pesos wᵢ", "número na linha"],
  ["corpo celular", "soma ponderada", "painel de contas"],
  ["disparar", "função de ativação", "neurônio acende"],
];

const COLUNAS = [
  { titulo: "no cérebro", x: 74, fundo: "#FDEEF1", cor: "#A3435C", borda: "none" },
  { titulo: "na IA", x: 210, fundo: AQUA_FUNDO, cor: AQUA_TEXTO, borda: "none" },
  { titulo: "no laboratório", x: 346, fundo: "#FFFFFF", cor: TEXTO, borda: BORDA },
];

export function Ponte() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Cada parte do neurônio do cérebro, o nome dela na IA e onde ela aparece no laboratório.">
      {COLUNAS.map((c) => (
        <text key={c.titulo} x={c.x} y={56} textAnchor="middle" fontSize={11} fontWeight={700} fill={c.borda === "none" ? c.cor : MUDO}>
          {c.titulo}
        </text>
      ))}
      {PONTE.map((linha, i) => (
        <g key={linha[0]}>
          {linha.map((t, j) => {
            const c = COLUNAS[j];
            const y = 96 + i * 66;
            return (
              <g key={t}>
                <rect x={c.x - 60} y={y - 15} width={120} height={30} rx={15} fill={c.fundo} stroke={c.borda} />
                <text x={c.x} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={j === 2 ? 500 : 700} fill={c.cor}>
                  {t}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/* ---------------- Passos 5 e 6 · Entradas e pesos ---------------- */

const LINHA_Y = [78, 148, 218];
const PORTA_AQUA: [number, number] = [322, 148];

export function Panqueca({ fase }: { fase: "entradas" | "pesos" }) {
  const pesos = fase === "pesos";
  return (
    <svg
      viewBox={VIEWBOX}
      className="h-auto w-full"
      role="img"
      aria-label={pesos ? "Cada nota da Aqua é multiplicada pelo seu peso: 0,72, 0,30 e −0,03." : "A Aqua dá uma nota de 0 a 1 para a cor da massa, o tempo no fogo e a música."}
    >
      <text x={210} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        o que a Aqua olha antes de virar a panqueca
      </text>
      {PANQUECA.entradas.map((e, i) => {
        const y = LINHA_Y[i];
        return (
          <g key={e.nome}>
            <line
              data-traco
              x1={196} y1={y} x2={PORTA_AQUA[0]} y2={PORTA_AQUA[1]}
              stroke={pesos ? corDoPeso(e.w) : "#C7C7CC"}
              strokeWidth={pesos ? 1 + Math.abs(e.w) * 6 : 2}
              strokeLinecap="round"
              className="motion-safe:transition-[stroke,stroke-width] motion-safe:duration-500"
            />
            <Icone nome={e.icone} x={e.icone === "musica" ? 23 : 20} y={y - (e.icone === "panqueca" ? 7 : 10)} />
            <text x={50} y={y} fontSize={11} fontWeight={700} fill={TEXTO}>
              {e.nome}
            </text>
            <text x={50} y={y + 13} fontSize={9} fill={SUTIL}>
              x{["₁", "₂", "₃"][i]}
            </text>
            <circle cx={180} cy={y} r={16} fill="#FFFFFF" stroke="#D2D2D7" />
            <text x={180} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
              {formatar(e.x)}
            </text>
            {pesos && <Pilula x={262} y={y + (PORTA_AQUA[1] - y) * 0.52 - 10} texto={`w${["₁", "₂", "₃"][i]} = ${formatar(e.w)}`} cor={corDoPeso(e.w)} largura={58} />}
          </g>
        );
      })}
      <Em x={322} y={133}>
        <Aqua unidade={6} rotulo="A Aqua, o neurônio" />
      </Em>
      {pesos ? (
        <>
          {PANQUECA.entradas.map((e, i) => (
            <text key={e.nome} x={210} y={270 + i * 16} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily={MONO} fill={e.w > 0 ? VERDE : VERMELHO}>
              w{["₁", "₂", "₃"][i]}·x{["₁", "₂", "₃"][i]} = {formatar(e.w)} × {formatar(e.x)} = {formatar(e.w * e.x)}
            </text>
          ))}
          <NoLab texto="no laboratório: o peso é o número na linha" largura={220} />
        </>
      ) : (
        <>
          <text x={210} y={290} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
            x = (0,90; 0,60; 0,30)
          </text>
          <text x={210} y={309} textAnchor="middle" fontSize={10} fill={MUDO}>
            vetor de entrada: uma nota para cada coisa
          </text>
          <NoLab texto="exemplo no laboratório: R, G e B da cor do bloco Entrada" largura={300} />
        </>
      )}
    </svg>
  );
}

/* ---------------- Passo 7 · Soma ponderada ---------------- */

export function Soma() {
  const [massa, tempo, musica] = PANQUECA.entradas.map((e) => e.x * e.w);
  const x0 = 50;
  const porUnidade = 266; // 0,72 ocupa 191,5 px, como no Figma
  const xTempo = x0 + massa * porUnidade;
  const xAntes = xTempo + tempo * porUnidade; // 1,02: o que ajuda
  const xZ = xAntes + musica * porUnidade; // 0,99: depois da música tirar
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Soma ponderada: 0,72 + 0,30 − 0,03 = 0,99.">
      <text x={210} y={56} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        z = Σ wᵢ·xᵢ
      </text>
      <text x={210} y={76} textAnchor="middle" fontSize={11} fill={MUDO}>
        Σ (sigma) = “some tudo”
      </text>
      <text x={210} y={110} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={MUDO}>
        z = 0,72 + 0,30 + (−0,03)
      </text>
      <text x={210} y={140} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={MONO} fill={AQUA_TEXTO}>
        z = {formatar(Z)}
      </text>
      <text x={x0} y={176} fontSize={10} fill={MUDO}>
        0
      </text>
      <rect x={x0} y={186} width={319} height={22} rx={4} fill={BORDA} />
      <rect data-cresce x={x0} y={186} width={xTempo - x0} height={22} fill={VERDE} />
      <rect data-cresce x={xTempo} y={186} width={xAntes - xTempo} height={22} fill={VERDE_CLARO} />
      <text x={(x0 + xTempo) / 2} y={201} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF">
        massa {formatar(massa)}
      </text>
      <text x={(xTempo + xZ) / 2} y={201} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0B4D2C">
        tempo {formatar(tempo)}
      </text>
      <text x={xAntes + 6} y={201} fontSize={10} fill={MUDO}>
        {formatar(massa + tempo)}
      </text>
      <rect data-cresce="direita" x={xZ} y={226} width={xAntes - xZ} height={14} fill={VERMELHO} />
      <text x={xZ - 6} y={237} textAnchor="end" fontSize={10} fontWeight={700} fill={VERMELHO}>
        a música tira {formatar(-musica)}
      </text>
      <rect x={xZ - 1} y={178} width={2} height={68} fill={TEXTO} />
      <text x={xZ} y={172} textAnchor="middle" fontSize={11} fontWeight={700} fill={TEXTO}>
        z = {formatar(Z)}
      </text>
      <text x={210} y={279} textAnchor="middle" fontSize={11} fill={MUDO}>
        quanto maior o z, mais tudo indica: “hora de virar!”
      </text>
      <NoLab texto="no laboratório: o painel de contas mostra cada parcela" largura={300} />
    </svg>
  );
}

/* ---------------- Passo 8 · Função de ativação ---------------- */

/** Um gráfico pequeno: f(z) de −3 a 3, com o ponto em z = 0,99. */
function Grafico({ x, f, max }: { x: number; f: (z: number) => number; max: number }) {
  const [z0, z1] = [-3, 3];
  const largura = 156;
  const [yBase, yTopo] = [168, 82];
  const px = (z: number) => x + ((z - z0) / (z1 - z0)) * largura;
  const py = (v: number) => yBase - (v / max) * (yBase - yTopo);
  const caminho = Array.from({ length: 61 }, (_, i) => z0 + i * 0.1)
    .map((z, i) => `${i ? "L" : "M"}${px(z).toFixed(1)} ${Math.max(yTopo - 4, py(f(z))).toFixed(1)}`)
    .join(" ");
  return (
    <g>
      <line x1={px(0)} y1={yTopo - 4} x2={px(0)} y2={yBase + 4} stroke="#D2D2D7" />
      <line x1={px(Z)} y1={py(f(Z))} x2={px(Z)} y2={yBase} stroke={TEXTO} strokeDasharray="2 2" />
      <path data-traco d={caminho} fill="none" stroke={AQUA} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={px(Z)} cy={py(f(Z))} r={5} fill={AQUA_TEXTO} />
    </g>
  );
}

export function Ativacao() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="A mesma soma 0,99 na ReLU dá 0,99 e na sigmoide dá 0,73: 73% de certeza.">
      <text x={210} y={28} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        a = f(z), com z = {formatar(Z)}
      </text>
      <rect x={18} y={44} width={178} height={202} rx={12} fill="#FFFFFF" stroke={BORDA} />
      <rect x={220} y={44} width={182} height={202} rx={12} fill="#FFFFFF" stroke={AQUA} strokeWidth={2} />
      <text x={107} y={70} textAnchor="middle" fontSize={12} fontWeight={700} fill={TEXTO}>
        ReLU
      </text>
      <text x={311} y={70} textAnchor="middle" fontSize={12} fontWeight={700} fill={TEXTO}>
        sigmoide
      </text>
      <Grafico x={29} f={(z) => Math.max(0, z)} max={2.4} />
      <Grafico x={233} f={sigmoide} max={1.05} />
      {[
        { x: 107, formula: "max(0, z)", papel: "negativo vira 0", exemplo: "−0,50 → 0 · 0,99 → 0,99" },
        { x: 311, formula: "1 / (1 + e⁻ᶻ)", papel: "sempre entre 0 e 1", exemplo: `0 → 0,5 · 0,99 → ${formatar(sigmoide(Z))}` },
      ].map((c) => (
        <g key={c.formula}>
          <text x={c.x} y={198} textAnchor="middle" fontSize={10} fontFamily={MONO} fill={MUDO}>
            {c.formula}
          </text>
          <text x={c.x} y={212} textAnchor="middle" fontSize={10} fill={MUDO}>
            {c.papel}
          </text>
          <text x={c.x} y={234} textAnchor="middle" fontSize={10.5} fontWeight={700} fontFamily={MONO} fill={AQUA_TEXTO}>
            {c.exemplo}
          </text>
        </g>
      ))}
      <Em x={134} y={262}>
        <AquaReacao reacao="confiante" unidade={4} rotulo="A Aqua confiante" />
      </Em>
      <text x={186} y={296} fontSize={13} fontWeight={700} fill={TEXTO}>
        {Math.round(sigmoide(Z) * 100)}% de certeza:
      </text>
      <text x={186} y={314} fontSize={13} fontWeight={700} fill={TEXTO}>
        está no ponto, vira!
      </text>
      <text x={210} y={352} textAnchor="middle" fontSize={11} fill={MUDO}>
        como a previsão do tempo: “73% de chance de chuva”
      </text>
    </svg>
  );
}

/* ---------------- Passo 9 · Revisão ---------------- */

const REVISAO: { reacao: ReacaoAqua; titulo: string; nome: string; texto: string; conta: string }[] = [
  { reacao: "observando", titulo: "1 · Olha", nome: "entradas", texto: "dá uma nota de 0 a 1 para massa, tempo e música", conta: "x = (0,90; 0,60; 0,30)" },
  { reacao: "pesando", titulo: "2 · Confia mais em umas", nome: "pesos", texto: "massa muito, tempo médio, música quase nada", conta: "w = (0,80; 0,50; −0,10)" },
  { reacao: "somando", titulo: "3 · Junta tudo", nome: "soma ponderada", texto: "como a média da escola, sem dividir", conta: `z = Σ wᵢ·xᵢ = ${formatar(Z)}` },
  { reacao: "decidindo", titulo: "4 · Decide", nome: "função de ativação", texto: "a sigmoide vira certeza de 0 a 1", conta: `a = sigmoide(${formatar(Z)}) = ${formatar(sigmoide(Z))}` },
];

export function Revisao() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Revisão: a Aqua olha, confia mais em umas coisas, junta tudo e decide. A panqueca fica no ponto.">
      <text x={210} y={25} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        a Aqua virando a panqueca, do começo ao fim
      </text>
      {REVISAO.map((r, i) => {
        const y = 38 + i * 62;
        return (
          <g key={r.titulo}>
            <Em x={28} y={y + 4}>
              <AquaReacao reacao={r.reacao} unidade={3} />
            </Em>
            <text x={82} y={y + 12} fontSize={12.5} fontWeight={700} fill={TEXTO}>
              {r.titulo}
            </text>
            <text x={396} y={y + 12} textAnchor="end" fontSize={10.5} fontWeight={700} fill={AQUA_TEXTO}>
              {r.nome}
            </text>
            <text x={82} y={y + 29} fontSize={11.5} fill={MUDO}>
              {r.texto}
            </text>
            <text x={82} y={y + 46} fontSize={11.5} fontWeight={700} fontFamily={MONO} fill={AQUA_TEXTO}>
              {r.conta}
            </text>
          </g>
        );
      })}
      <rect x={14} y={294} width={392} height={64} rx={12} fill="#FFFFFF" stroke={BORDA} />
      <Em x={26} y={306}>
        <AquaCozinhando noPonto unidade={3} />
      </Em>
      <text x={128} y={318} fontSize={13} fontWeight={700} fill={TEXTO}>
        panqueca no ponto!
      </text>
      <text x={128} y={339} fontSize={12} fontWeight={700} fontFamily={MONO} fill={AQUA_TEXTO}>
        o neurônio inteiro: a = f(Σ wᵢ·xᵢ)
      </text>
    </svg>
  );
}

/* ---------------- Passo 10 · Teste rápido ---------------- */

/** Panqueca nova do teste: sem música, com os pesos que a Aqua aprendeu. */
export const TESTE_PANQUECA = [
  { nome: "cor da massa", x: 0.5, w: 0.8, icone: "panqueca" as const },
  { nome: "tempo", x: 0.4, w: 0.5, icone: "relogio" as const },
];
const Z_TESTE = TESTE_PANQUECA.reduce((s, e) => s + e.x * e.w, 0); // 0,60

export type EstadoTeste = "pergunta" | "certo" | "errado";

function Caixa({ x, largura, titulo, valor, destaque }: { x: number; largura: number; titulo: string; valor: string; destaque?: boolean }) {
  return (
    <g>
      <rect x={x} y={200} width={largura} height={44} rx={8} fill="#FFFFFF" stroke={destaque ? AQUA : BORDA} strokeWidth={destaque ? 2 : 1} />
      <text x={x + largura / 2} y={216} textAnchor="middle" fontSize={9} fontWeight={700} fill={MUDO}>
        {titulo}
      </text>
      <text data-pulo={destaque ? "" : undefined} x={x + largura / 2} y={235} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily={MONO} fill={destaque ? AQUA_TEXTO : TEXTO}>
        {valor}
      </text>
    </g>
  );
}

export function TestePanqueca({ estado }: { estado: EstadoTeste }) {
  const certo = estado === "certo";
  const reacao: ReacaoAqua = certo ? "decidindo" : estado === "errado" ? "preocupada" : "pensando";
  const porta: [number, number] = [300, 100];
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Teste: cor da massa 0,50 com peso 0,80 e tempo 0,40 com peso 0,50. Quanto dá z, e a certeza da Aqua?">
      <text x={210} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        a Aqua tenta uma panqueca nova (hoje sem música)
      </text>
      {TESTE_PANQUECA.map((e, i) => {
        const y = 70 + i * 70;
        return (
          <g key={e.nome}>
            <line data-traco x1={166} y1={y} x2={porta[0]} y2={porta[1]} stroke={VERDE} strokeWidth={1 + e.w * 6} strokeLinecap="round" />
            <Icone nome={e.icone} x={20} y={y - (e.icone === "panqueca" ? 7 : 10)} />
            <text x={48} y={y} fontSize={12} fontWeight={700} fill={TEXTO}>
              {e.nome}
            </text>
            <text x={48} y={y + 13} fontSize={9} fill={SUTIL}>
              x{["₁", "₂"][i]}
            </text>
            <circle cx={148} cy={y} r={18} fill="#FFFFFF" stroke="#D2D2D7" />
            <text x={148} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
              {formatar(e.x)}
            </text>
            <Pilula x={232} y={y + (porta[1] - y) * 0.5} texto={`w${["₁", "₂"][i]} = ${formatar(e.w)}`} cor={VERDE} largura={58} />
          </g>
        );
      })}
      <g key={reacao} data-pulo>
        <Em x={300} y={40}>
          <AquaReacao reacao={reacao} unidade={6} />
        </Em>
      </g>
      <text x={330} y={133} textAnchor="middle" fontSize={11} fill={MUDO}>
        a Aqua decide
      </text>
      <text x={330} y={147} textAnchor="middle" fontSize={11} fill={MUDO}>
        (usa a sigmoide)
      </text>
      <Caixa x={14} largura={94} titulo="w₁·x₁" valor="0,80 × 0,50" />
      <text x={118} y={227} textAnchor="middle" fontSize={14} fill={MUDO}>+</text>
      <Caixa x={128} largura={100} titulo="w₂·x₂" valor="0,50 × 0,40" />
      <text x={241} y={227} textAnchor="middle" fontSize={14} fill={MUDO}>→</text>
      <Caixa x={254} largura={62} titulo="z" valor={certo ? formatar(Z_TESTE) : "?"} destaque />
      <text x={326} y={227} textAnchor="middle" fontSize={14} fill={MUDO}>→</text>
      <Caixa x={336} largura={72} titulo="sigmoide(z)" valor={certo ? formatar(sigmoide(Z_TESTE)) : "?"} destaque />
      {[
        [61, "multiplica"],
        [178, "multiplica"],
        [285, "soma"],
        [372, "ativação"],
      ].map(([x, t], i) => (
        <text key={i} x={x} y={262} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={SUTIL}>
          {t}
        </text>
      ))}
      <rect x={40} y={288} width={340} height={56} rx={12} fill="#FFFFFF" stroke={BORDA} />
      <text x={56} y={308} fontSize={11} fontWeight={700} fill={AQUA_TEXTO}>
        lembrete: a sigmoide
      </text>
      <text x={56} y={330} fontSize={12} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        z = 0 → 0,5 · z positivo → mais de 0,5
      </text>
    </svg>
  );
}
