"use client";

import { Aqua, AquaAcendendo, AquaFantasia, AquaSeparando, type FantasiaAqua } from "@/components/mascote";
import Link from "next/link";
import { formatar } from "@/lib/rede";

// Palcos do tutorial 01 · O neurônio, iguais ao frame "Tutorial 01 · O neurônio · roteiro" no Figma.
// Cada palco usa o mesmo tamanho (420 × 368) e é ampliado pelo SVG.
// O exemplo é o mesmo do laboratório: o detector de laranja da montagem básica (lib/rede.ts),
// com a cor laranja #FF8C00 entrando como R, G e B.

const AQUA = "#5ED3DB";
const AQUA_TEXTO = "#0E7C86";
const AQUA_FUNDO = "#E6F7F8";
const TEXTO = "#1D1D1F";
const MUDO = "#6E6E73";
const SUTIL = "#86868B";
const BORDA = "#E5E5EA";
const VERDE = "#16A34A";
const VERDE_TEXTO = "#15803D";
const VERDE_CLARO = "#4ADE80";
const VERMELHO = "#DC2626";
const VERMELHO_TEXTO = "#B91C1C";
const LARANJA = "#FF8C00";
const AZUL = "#378ADD";
const ROXO = "#8000FF";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

const VIEWBOX = "0 0 420 368";
const SUB = ["₁", "₂", "₃"];

/** O detector de laranja: a cor laranja entrando como R, G e B, com os pesos da montagem básica. */
export const DETECTOR = [
  { nome: "vermelho", canal: "R", x: 1, w: 2, cor: "#EF4444" },
  { nome: "verde", canal: "G", x: 0.55, w: 0.5, cor: "#22C55E" },
  { nome: "azul", canal: "B", x: 0, w: -2, cor: "#3B82F6" },
] as const;
const Z = DETECTOR.reduce((s, e) => s + e.x * e.w, 0); // 2,28
const Z_AZUL = 0.22 * 2 + 0.54 * 0.5 + 0.87 * -2; // −1,03: o azul #378ADD no mesmo detector

/** O roxo do teste: (0,50; 0,00; 1,00) no mesmo detector. */
const ROXO_X = [0.5, 0, 1];
const Z_ROXO = ROXO_X.reduce((s, x, i) => s + x * DETECTOR[i].w, 0); // −1,00

/* ---------------- Peças em comum ---------------- */

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
const textoDoPeso = (w: number) => (w > 0 ? VERDE_TEXTO : VERMELHO_TEXTO);
const espessura = (w: number) => 2 + Math.abs(w) * 2;

/* ---------------- Passo 2 · A Aqua aprendendo cores ---------------- */

function Tentativa({ y, titulo, treinada }: { y: number; titulo: string; treinada: boolean }) {
  const no: [number, number] = [292, y + 76];
  return (
    <g>
      <text x={12} y={y + 14} fontSize={12} fontWeight={700} fill={treinada ? VERDE_TEXTO : VERMELHO_TEXTO}>
        {titulo}
      </text>
      <rect x={12} y={y + 26} width={22} height={22} rx={5} fill={LARANJA} />
      <text x={23} y={y + 60} textAnchor="middle" fontSize={9} fill={SUTIL}>
        laranja
      </text>
      {DETECTOR.map((e, i) => {
        const cy = y + 36 + i * 40;
        const cor = !treinada ? "#B5B5BA" : i === 1 ? "#D2D2D7" : corDoPeso(e.w);
        const largura = !treinada ? 2.5 : i === 1 ? 1 : 6;
        return (
          <g key={e.nome}>
            <line data-traco x1={150} y1={cy} x2={no[0]} y2={no[1]} stroke={cor} strokeWidth={largura} strokeLinecap="round" />
            <rect x={50} y={cy - 13} width={100} height={26} rx={13} fill="#FFFFFF" stroke={BORDA} />
            <text x={100} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={treinada && i === 1 ? SUTIL : TEXTO}>
              {e.nome}
            </text>
          </g>
        );
      })}
      <circle cx={no[0]} cy={no[1]} r={16} fill={AQUA} />
      <text x={no[0]} y={no[1] + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#06363A">
        Aqua
      </text>
      <text x={318} y={no[1] - 2} fontSize={12} fontWeight={700} fill={TEXTO}>
        {treinada ? "“laranja!”" : "“azul?”"}
      </text>
      <text x={318} y={no[1] + 14} fontSize={11} fill={treinada ? VERDE_TEXTO : VERMELHO_TEXTO}>
        {treinada ? "acertou" : "errou"}
      </text>
    </g>
  );
}

export function Cores() {
  return (
    <svg
      viewBox={VIEWBOX}
      className="h-auto w-full"
      role="img"
      aria-label="Na primeira tentativa a Aqua dá a mesma atenção ao vermelho, ao verde e ao azul e erra. Depois de muitas cores, vermelho e azul ficam fortes, o verde fica fraco, e ela acerta."
    >
      <Tentativa y={0} titulo="1ª tentativa: errou" treinada={false} />
      <line x1={12} y1={160} x2={408} y2={160} stroke={BORDA} />
      <Tentativa y={164} titulo="depois de muitas cores: acertou" treinada />
      <Em x={12} y={326}>
        <AquaSeparando unidade={3} rotulo="A Aqua separando cartões laranja e azul em dois cestos" />
      </Em>
      <rect x={136} y={337} width={272} height={22} rx={11} fill={AQUA_FUNDO} />
      <text x={272} y={351.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={AQUA_TEXTO}>
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

function Entradas() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="O laranja #FF8C00 vira três números: vermelho 1,00, verde 0,55 e azul 0,00.">
      <text x={210} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        a Aqua olha a cor e anota três números
      </text>
      <rect x={20} y={44} width={96} height={96} rx={14} fill={LARANJA} />
      <text x={68} y={158} textAnchor="middle" fontSize={11} fontFamily={MONO} fill={MUDO}>
        #FF8C00
      </text>
      {DETECTOR.map((e, i) => {
        const y = 64 + i * 42;
        return (
          <g key={e.nome}>
            <text x={140} y={y - 6} fontSize={12} fill={TEXTO}>
              {e.nome} <tspan fill={SUTIL}>x{SUB[i]}</tspan>
            </text>
            <rect x={140} y={y} width={190} height={10} rx={5} fill={BORDA} />
            {e.x > 0 && <rect data-cresce x={140} y={y} width={190 * e.x} height={10} rx={5} fill={e.cor} />}
            <text x={400} y={y + 10} textAnchor="end" fontSize={12} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
              {formatar(e.x)}
            </text>
          </g>
        );
      })}
      <rect x={20} y={204} width={380} height={96} rx={12} fill="#FFFFFF" />
      <text x={210} y={252} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        x = (1,00; 0,55; 0,00)
      </text>
      <text x={210} y={278} textAnchor="middle" fontSize={11} fill={SUTIL}>
        vetor de entrada: um número para cada parte da cor
      </text>
      <NoLab texto="no laboratório: o R, o G e o B do bloco Entrada" largura={280} />
    </svg>
  );
}

function Pesos() {
  const no: [number, number] = [330, 120];
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Cada parte da cor é multiplicada pelo seu peso: 1,00 × 2,00 = 2,00; 0,55 × 0,50 = 0,28; 0,00 × −2,00 = 0,00.">
      <text x={210} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        quanto a Aqua confia em cada parte da cor
      </text>
      {DETECTOR.map((e, i) => {
        const y = 60 + i * 60;
        return (
          <g key={e.nome}>
            <line data-traco x1={92} y1={y} x2={no[0]} y2={no[1]} stroke={corDoPeso(e.w)} strokeWidth={espessura(e.w)} strokeLinecap="round" />
            <text x={54} y={y + 4} textAnchor="end" fontSize={10} fill={SUTIL}>
              {e.canal}
            </text>
            <circle cx={76} cy={y} r={16} fill="#FFFFFF" stroke={e.cor} strokeWidth={2} />
            <text x={76} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
              {formatar(e.x)}
            </text>
            <Pilula x={196} y={y + (no[1] - y) * 0.4} texto={`w${SUB[i]} = ${formatar(e.w)}`} cor={textoDoPeso(e.w)} largura={66} />
          </g>
        );
      })}
      <circle cx={no[0]} cy={no[1]} r={20} fill="#FFFFFF" stroke={AQUA} strokeWidth={3} />
      <text x={no[0]} y={no[1] + 36} textAnchor="middle" fontSize={10} fill={AQUA_TEXTO}>
        detector
      </text>
      <text x={no[0]} y={no[1] + 48} textAnchor="middle" fontSize={10} fill={AQUA_TEXTO}>
        de laranja
      </text>
      <rect x={20} y={222} width={380} height={104} rx={12} fill="#FFFFFF" />
      {DETECTOR.map((e, i) => (
        <text key={e.nome} x={36} y={252 + i * 28} fontSize={13} fontFamily={MONO} fill={TEXTO}>
          w{SUB[i]}·x{SUB[i]} = {formatar(e.x)} × {formatar(e.w)} ={" "}
          <tspan fontWeight={700} fill={e.x * e.w === 0 ? SUTIL : textoDoPeso(e.w)}>
            {formatar(e.x * e.w)}
          </tspan>
        </text>
      ))}
      <NoLab texto="no laboratório: o peso é o número na linha" largura={240} />
    </svg>
  );
}

export function Cor({ fase }: { fase: "entradas" | "pesos" }) {
  return fase === "entradas" ? <Entradas /> : <Pesos />;
}

/* ---------------- Passo 7 · Soma ponderada ---------------- */

export function Soma() {
  const [r, g] = DETECTOR.map((e) => e.x * e.w);
  const x0 = 40;
  const porUnidade = 300 / Z;
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Soma ponderada: 2,00 + 0,28 + 0,00 = 2,28.">
      <text x={210} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        a Aqua junta as três partes
      </text>
      {DETECTOR.map((e, i) => {
        const y = 36 + i * 42;
        const p = e.x * e.w;
        return (
          <g key={e.nome}>
            <rect x={20} y={y} width={380} height={34} rx={10} fill="#FFFFFF" />
            <text x={36} y={y + 22} fontSize={13} fill={TEXTO}>
              {e.nome}
            </text>
            <text x={384} y={y + 22} textAnchor="end" fontSize={13} fontFamily={MONO} fill={TEXTO}>
              {formatar(e.x)} × {formatar(e.w)} ={" "}
              <tspan fontWeight={700} fill={p === 0 ? SUTIL : textoDoPeso(p)}>
                {formatar(p)}
              </tspan>
            </text>
          </g>
        );
      })}
      <text x={210} y={182} textAnchor="middle" fontSize={12} fill={MUDO}>
        soma tudo
      </text>
      <text x={210} y={216} textAnchor="middle" fontSize={24} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        2,00 + 0,28 + 0,00 = {formatar(Z)}
      </text>
      <rect x={x0} y={240} width={300} height={22} rx={4} fill={BORDA} />
      <rect data-cresce x={x0} y={240} width={r * porUnidade} height={22} fill={VERDE} />
      <rect data-cresce x={x0 + r * porUnidade} y={240} width={g * porUnidade} height={22} fill={VERDE_CLARO} />
      <text x={x0 + (r * porUnidade) / 2} y={255} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#FFFFFF">
        vermelho {formatar(r)}
      </text>
      <text x={x0 + r * porUnidade + (g * porUnidade) / 2} y={278} textAnchor="middle" fontSize={10} fill={VERDE_TEXTO}>
        verde {formatar(g)}
      </text>
      <text x={x0 + 308} y={255} fontSize={12} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
        {formatar(Z)}
      </text>
      <NoLab texto="no laboratório: o painel de contas mostra cada parcela" largura={300} />
    </svg>
  );
}

/* ---------------- Passo 8 · Função de ativação ---------------- */

export function Ativacao() {
  const px = (s: number) => 210 + s * 55;
  const py = (v: number) => 222 - v * 55;
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="ReLU: a soma do laranja, 2,28, é positiva e o detector acende. A do azul, −1,03, é negativa e passa 0.">
      <rect x={14} y={8} width={392} height={240} rx={12} fill="#FFFFFF" />
      <Em x={30} y={20}>
        <AquaAcendendo unidade={3} rotulo="A Aqua ligada a uma lâmpada acesa" />
      </Em>
      <text x={392} y={30} textAnchor="end" fontSize={13} fontWeight={700} fill={AQUA_TEXTO}>
        ReLU
      </text>
      <text x={392} y={46} textAnchor="end" fontSize={10.5} fill={SUTIL}>
        negativo vira 0 · positivo passa igual
      </text>
      <line x1={36} y1={py(0)} x2={392} y2={py(0)} stroke="#C7C7CC" />
      <line x1={px(0)} y1={60} x2={px(0)} y2={py(0) + 8} stroke={BORDA} strokeDasharray="3 3" />
      <text x={px(0)} y={py(0) + 20} textAnchor="middle" fontSize={10} fill={SUTIL}>
        soma 0
      </text>
      <path
        data-traco
        d={`M40 ${py(0)} L${px(0)} ${py(0)} L${px(3)} ${py(3)}`}
        fill="none"
        stroke={AQUA_TEXTO}
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={px(Z_AZUL)} cy={py(0)} r={8} fill={AZUL} stroke="#FFFFFF" strokeWidth={2.5} />
      <rect x={px(Z_AZUL) - 70} y={py(0) - 40} width={140} height={24} rx={12} fill="#F5F5F7" />
      <text x={px(Z_AZUL)} y={py(0) - 24} textAnchor="middle" fontSize={11.5} fill={MUDO}>
        azul {formatar(Z_AZUL)} → passa 0
      </text>
      <circle cx={px(Z)} cy={py(Z)} r={9} fill={LARANJA} stroke="#FFFFFF" strokeWidth={3} />
      <rect x={px(Z) - 170} y={py(Z) - 12} width={146} height={24} rx={12} fill={VERDE} />
      <text x={px(Z) - 97} y={py(Z) + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#FFFFFF">
        laranja {formatar(Z)} → acende
      </text>
      <rect x={14} y={258} width={392} height={100} rx={12} fill="#FFFFFF" stroke="#BFEFF2" />
      <text x={30} y={282} fontSize={12} fontWeight={700} fill={AQUA_TEXTO}>
        E o último neurônio?
      </text>
      <text x={30} y={302} fontSize={12} fill="#3B6E72">
        Usa outra regra, a sigmoide, que deixa tudo
      </text>
      <text x={30} y={319} fontSize={12} fill="#3B6E72">
        entre 0 e 1. Ela tem um tutorial só dela.
      </text>
      <Link href="/tutoriais/sigmoide">
        <text x={390} y={344} textAnchor="end" fontSize={11.5} fontWeight={700} fill={AQUA_TEXTO} className="hover:underline">
          Tutorial 03 · A sigmoide →
        </text>
      </Link>
    </svg>
  );
}

/* ---------------- Passo 9 · Revisão ---------------- */

const REVISAO = [
  { titulo: "1 · Olha", nome: "entradas", conta: "vermelho 1,00 · verde 0,55 · azul 0,00" },
  { titulo: "2 · Confia mais em umas", nome: "pesos", conta: "vermelho 2,00 · verde 0,50 · azul −2,00" },
  { titulo: "3 · Junta tudo", nome: "soma ponderada", conta: `2,00 + 0,28 + 0,00 = ${formatar(Z)}` },
  { titulo: "4 · Decide", nome: "função de ativação", conta: `positiva, então acende: ${formatar(Z)}` },
];

export function Revisao() {
  return (
    <svg viewBox={VIEWBOX} className="h-auto w-full" role="img" aria-label="Revisão: a Aqua olha a cor, confia mais em umas partes, junta tudo e decide. O detector de laranja acende.">
      <text x={210} y={18} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        o detector de laranja, do começo ao fim
      </text>
      {REVISAO.map((r, i) => {
        const y = 28 + i * 60;
        return (
          <g key={r.titulo}>
            <rect x={14} y={y} width={392} height={52} rx={10} fill="#FFFFFF" />
            <text x={30} y={y + 21} fontSize={12.5} fontWeight={700} fill={TEXTO}>
              {r.titulo}
            </text>
            <text x={390} y={y + 21} textAnchor="end" fontSize={10.5} fontWeight={700} fill={AQUA_TEXTO}>
              {r.nome}
            </text>
            <text x={30} y={y + 40} fontSize={11.5} fontFamily={MONO} fill={MUDO}>
              {r.conta}
            </text>
          </g>
        );
      })}
      <rect x={14} y={276} width={392} height={64} rx={12} fill="#FFFFFF" stroke={VERDE} />
      <rect x={30} y={292} width={32} height={32} rx={6} fill={LARANJA} />
      <text x={76} y={305} fontSize={14} fontWeight={700} fill={VERDE_TEXTO}>
        detector de laranja acendeu!
      </text>
      <text x={76} y={324} fontSize={11} fill={MUDO}>
        é o 1º neurônio da Camada 1 da montagem básica
      </text>
    </svg>
  );
}

/* ---------------- Passo 10 · Teste rápido ---------------- */

export type EstadoTeste = "pergunta" | "certo" | "errado";

/** O roxo no detector de laranja: na 1ª pergunta, quanto dá a soma; na 2ª, se acende. */
export function TesteCor({ fase, estado }: { fase: "soma" | "acende"; estado: EstadoTeste }) {
  const certo = estado === "certo";
  const acende = fase === "acende";
  const no: [number, number] = [334, 120];
  const valorNo = acende ? (certo ? "0,00" : formatar(Z_ROXO)) : certo ? formatar(Z_ROXO) : "?";
  return (
    <svg
      viewBox={VIEWBOX}
      className="h-auto w-full"
      role="img"
      aria-label={
        acende
          ? "O roxo no detector de laranja: a soma deu −1,00. O detector acende?"
          : "Teste: roxo (0,50; 0,00; 1,00) com os pesos 2,00, 0,50 e −2,00. Quanto dá a soma?"
      }
    >
      <text x={210} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUDO}>
        {acende ? "o roxo: a soma já deu −1,00" : "uma cor nova no mesmo detector de laranja"}
      </text>
      <rect x={14} y={100} width={40} height={40} rx={8} fill={ROXO} />
      <text x={34} y={156} textAnchor="middle" fontSize={10} fill={MUDO}>
        roxo
      </text>
      <g opacity={acende ? 0.35 : 1}>
        {DETECTOR.map((e, i) => {
          const y = 60 + i * 60;
          return (
            <g key={e.nome}>
              <line x1={104} y1={y} x2={no[0]} y2={no[1]} stroke={corDoPeso(e.w)} strokeWidth={espessura(e.w)} strokeLinecap="round" />
              <circle cx={90} cy={y} r={16} fill="#FFFFFF" stroke={e.cor} strokeWidth={2} />
              <text x={90} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={TEXTO}>
                {formatar(ROXO_X[i])}
              </text>
              {!acende && <Pilula x={210} y={y + (no[1] - y) * 0.45} texto={formatar(e.w)} cor={textoDoPeso(e.w)} largura={50} />}
            </g>
          );
        })}
      </g>
      <g data-pulo={certo ? "" : undefined}>
        <circle cx={no[0]} cy={no[1]} r={24} fill={acende && certo ? BORDA : "#FFFFFF"} stroke={AQUA} strokeWidth={3} />
        <text
          x={no[0]}
          y={no[1] + 5}
          textAnchor="middle"
          fontSize={valorNo === "?" ? 16 : 12}
          fontWeight={700}
          fontFamily={MONO}
          fill={valorNo === "?" ? AQUA_TEXTO : valorNo === "0,00" ? MUDO : VERMELHO_TEXTO}
        >
          {valorNo}
        </text>
      </g>
      <text x={no[0]} y={no[1] + 42} textAnchor="middle" fontSize={11} fill={MUDO}>
        {acende && certo ? "não acendeu: passa 0" : "soma"}
      </text>
      {acende ? (
        <g>
          <rect x={20} y={222} width={380} height={108} rx={12} fill="#FFFFFF" />
          <text x={36} y={246} fontSize={12.5} fontWeight={700} fill={AQUA_TEXTO}>
            Lembrete: a regra (ReLU)
          </text>
          <rect x={36} y={258} width={166} height={56} rx={10} fill="#EEFBF2" />
          <text x={119} y={281} textAnchor="middle" fontSize={12} fontWeight={700} fill={VERDE_TEXTO}>
            soma positiva
          </text>
          <text x={119} y={300} textAnchor="middle" fontSize={12} fill={TEXTO}>
            acende, passa igual
          </text>
          <rect x={218} y={258} width={166} height={56} rx={10} fill="#F5F5F7" />
          <text x={301} y={281} textAnchor="middle" fontSize={12} fontWeight={700} fill={MUDO}>
            soma negativa
          </text>
          <text x={301} y={300} textAnchor="middle" fontSize={12} fill={TEXTO}>
            não acende, passa 0
          </text>
        </g>
      ) : (
        <g>
          <rect x={20} y={222} width={380} height={96} rx={12} fill="#FFFFFF" />
          <text x={36} y={244} fontSize={11} fill={SUTIL}>
            a conta, de cabeça
          </text>
          <text x={36} y={272} fontSize={13.5} fontFamily={MONO} fill={TEXTO}>
            0,50 × 2,00 + 0,00 × 0,50 + 1,00 × −2,00
          </text>
          <text data-pulo={certo ? "" : undefined} x={36} y={298} fontSize={15} fontWeight={700} fontFamily={MONO} fill={certo ? VERMELHO_TEXTO : AQUA_TEXTO}>
            = {certo ? formatar(Z_ROXO) : "?"}
          </text>
        </g>
      )}
      <text x={210} y={352} textAnchor="middle" fontSize={11} fill={SUTIL}>
        {acende ? "olhe o sinal da soma" : "verde soma, vermelho tira"}
      </text>
    </svg>
  );
}
