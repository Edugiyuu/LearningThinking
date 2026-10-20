"use client";

import { Aqua, type PoseAqua } from "@/components/mascote";
import { formatar } from "@/lib/rede";
import type { Visual } from "@/lib/tutoriais";

// O "palco" dos tutoriais: a visualização à esquerda de cada passo (frame "Tutorial · O neurônio · Desktop").
// Usa a mesma gramática do laboratório (docs/04-design-system.md, 4.4): linhas verdes/vermelhas pelo
// sinal do peso, bolinhas carregando o número de verdade, fios cinza tracejados entre blocos.

const VERDE = "#16A34A";
const VERMELHO = "#DC2626";
const VERDE_TEXTO = "#15803D";
const VERMELHO_TEXTO = "#B91C1C";
const CINZA = "#8E8E93";
const AQUA = "#5ED3DB";
const AQUA_TEXTO = "#0E7C86";
const AQUA_FUNDO = "#E8FAFB";
const TEXTO = "#1D1D1F";
const MUDO = "#6E6E73";
const SUTIL = "#86868B";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

export const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

const corDoSinal = (n: number) => (Math.abs(n) < 0.005 ? CINZA : n > 0 ? VERDE : VERMELHO);
const textoDoSinal = (n: number) => (Math.abs(n) < 0.005 ? MUDO : n > 0 ? VERDE_TEXTO : VERMELHO_TEXTO);

// Movimento só quando o sistema não pede menos movimento (ADR-0011)
const ANIMA = "motion-safe:transition-[transform,opacity] motion-safe:duration-700 ease-[cubic-bezier(.22,1,.36,1)]";

function AquaEm({ x, y, unidade, pose = "normal" }: { x: number; y: number; unidade: number; pose?: PoseAqua }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Aqua unidade={unidade} pose={pose} />
    </g>
  );
}

/** Bolinha com o número de verdade, como no laboratório (ADR-0021). */
function Bolinha({ x, y, valor, neutra, r = 22, visivel = true }: { x: number; y: number; valor: number; neutra?: boolean; r?: number; visivel?: boolean }) {
  return (
    <g className={ANIMA} style={{ transform: `translate(${x}px, ${y}px) scale(${visivel ? 1 : 0.2})`, opacity: visivel ? 1 : 0 }}>
      <circle r={r} fill={neutra ? "#FFFFFF" : corDoSinal(valor)} stroke={neutra ? AQUA_TEXTO : "none"} strokeWidth={2} />
      <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={600} fontFamily={MONO} fill={neutra ? TEXTO : "#FFFFFF"}>
        {formatar(valor)}
      </text>
    </g>
  );
}

function Etiqueta({ x, y, texto, cor = TEXTO, largura = 64, visivel = true }: { x: number; y: number; texto: string; cor?: string; largura?: number; visivel?: boolean }) {
  return (
    <g className={ANIMA} style={{ opacity: visivel ? 1 : 0 }}>
      <rect x={x - largura / 2} y={y - 13} width={largura} height={26} rx={13} fill="#FFFFFF" />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={600} fontFamily={MONO} fill={cor}>
        {texto}
      </text>
    </g>
  );
}

const ponto = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* ---------------- 01 · O neurônio do cérebro ---------------- */

// Cores do neurônio biológico: um rosa que não se confunde com o aqua da IA nem com o vermelho do peso
const BIO = "#FBD5DE";
const BIO_TRACO = "#D9708A";
const BIO_TEXTO = "#A3435C";
const BIO_FUNDO = "#FDEEF1";
const PULSO = "#FFD54A";
const PULSO_TRACO = "#F59E0B";

const DENDRITOS = [
  "M-38 -24 Q-90 -60 -150 -100", "M-110 -74 Q-130 -100 -128 -130", "M-130 -86 Q-170 -80 -190 -70",
  "M-50 0 Q-110 4 -180 0", "M-130 2 Q-150 -20 -175 -30", "M-140 2 Q-160 26 -185 34",
  "M-38 24 Q-90 60 -150 100", "M-110 74 Q-130 100 -128 130", "M-130 86 Q-170 80 -190 70",
];
const TERMINAIS = [
  [350, -40],
  [355, 0],
  [350, 40],
];

/** Neurônio do cérebro, com o corpo da célula em (0, 0): dendritos à esquerda, axônio e terminais à direita. */
function NeuronioBio({ disparou = false }: { disparou?: boolean }) {
  return (
    <g>
      <g fill="none" stroke={BIO_TRACO} strokeWidth={6} strokeLinecap="round">
        {DENDRITOS.map((d) => (
          <path key={d} d={d} />
        ))}
        <line x1={50} y1={0} x2={300} y2={0} />
        <path d="M300 0 Q330 -10 350 -40 M300 0 L355 0 M300 0 Q330 10 350 40" />
      </g>
      {[70, 130, 190, 250].map((x) => (
        <rect key={x} x={x} y={-9} width={44} height={18} rx={9} fill={BIO_FUNDO} stroke={BIO_TRACO} strokeWidth={2} />
      ))}
      {TERMINAIS.map(([x, y]) => (
        <circle key={y} cx={x} cy={y} r={8} fill={BIO} stroke={BIO_TRACO} strokeWidth={2} />
      ))}
      <circle
        r={50}
        fill={disparou ? "#FDE68A" : BIO}
        stroke={disparou ? PULSO_TRACO : BIO_TRACO}
        strokeWidth={3}
        className="motion-safe:transition-colors motion-safe:duration-500"
      />
      <circle r={16} fill={BIO_TRACO} fillOpacity={0.35} />
    </g>
  );
}

function Rotulo({ x, y, titulo, texto }: { x: number; y: number; titulo: string; texto?: string }) {
  return (
    <g>
      <text x={x} y={y} textAnchor="middle" fontSize={15} fontWeight={600} fill={BIO_TEXTO}>{titulo}</text>
      {texto && <text x={x} y={y + 20} textAnchor="middle" fontSize={13} fill={MUDO}>{texto}</text>}
    </g>
  );
}

function Chip({ x, y, texto, fundo, cor, largura = 220 }: { x: number; y: number; texto: string; fundo: string; cor: string; largura?: number }) {
  return (
    <g>
      <rect x={x - largura / 2} y={y - 22} width={largura} height={44} rx={22} fill={fundo} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={cor}>{texto}</text>
    </g>
  );
}

/** Sinapse: o terminal de um neurônio quase encostando no dendrito do outro, com mensageiros no meio. */
function Sinapse({ y, forte }: { y: number; forte: boolean }) {
  const largura = forte ? 8 : 3;
  const pontos = forte
    ? [[318, -10], [324, 4], [330, -4], [320, 12], [327, -14], [333, 9], [322, -2]]
    : [[322, -4], [329, 6]];
  return (
    <g transform={`translate(0 ${y})`}>
      <line x1={110} y1={0} x2={272} y2={0} stroke={BIO_TRACO} strokeWidth={largura} strokeLinecap="round" />
      <circle cx={290} r={22} fill={BIO} stroke={BIO_TRACO} strokeWidth={2.5} />
      {pontos.map(([px, py]) => (
        <circle key={`${px}:${py}`} cx={px} cy={py} r={3} fill={PULSO_TRACO} />
      ))}
      <circle cx={350} r={14} fill={BIO_FUNDO} stroke={BIO_TRACO} strokeWidth={2.5} />
      <line x1={364} y1={0} x2={500} y2={0} stroke={BIO_TRACO} strokeWidth={largura} strokeLinecap="round" />
    </g>
  );
}

const PARES_CEREBRO_IA = [
  ["dendritos", "entradas"],
  ["sinapses", "pesos"],
  ["corpo da célula", "soma"],
  ["disparar", "acender (ReLU)"],
];

function Cerebro({ fase }: { fase: "partes" | "dispara" | "sinapse" | "compara" }) {
  if (fase === "sinapse")
    return (
      <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label="Duas sinapses: uma forte, que passa muito sinal, e uma fraca.">
        <text x={110} y={80} fontSize={13} fontWeight={500} fill={MUDO}>sinapse: onde um neurônio quase encosta no outro</text>
        <Sinapse y={170} forte />
        <Rotulo x={320} y={226} titulo="ligação forte" texto="passa muito sinal" />
        <Chip x={640} y={170} texto="na IA: peso alto" fundo={AQUA_FUNDO} cor={AQUA_TEXTO} largura={180} />
        <Sinapse y={340} forte={false} />
        <Rotulo x={320} y={396} titulo="ligação fraca" texto="passa pouco sinal" />
        <Chip x={640} y={340} texto="na IA: peso baixo" fundo={AQUA_FUNDO} cor={AQUA_TEXTO} largura={180} />
        <AquaEm x={610} y={440} unidade={6} pose="contente" />
      </svg>
    );
  if (fase === "compara")
    return (
      <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label="Comparação entre as partes do neurônio do cérebro e do neurônio da IA.">
        <g transform="translate(171 120) scale(0.35)">
          <NeuronioBio />
        </g>
        <AquaEm x={570} y={102} unidade={6} />
        <text x={200} y={196} textAnchor="middle" fontSize={15} fontWeight={600} fill={BIO_TEXTO}>No cérebro</text>
        <text x={600} y={196} textAnchor="middle" fontSize={15} fontWeight={600} fill={AQUA_TEXTO}>Na IA</text>
        {PARES_CEREBRO_IA.map(([bio, ia], i) => (
          <g key={bio}>
            <Chip x={200} y={250 + i * 66} texto={bio} fundo={BIO_FUNDO} cor={BIO_TEXTO} />
            <text x={400} y={256 + i * 66} textAnchor="middle" fontSize={18} fill={SUTIL}>→</text>
            <Chip x={600} y={250 + i * 66} texto={ia} fundo={AQUA_FUNDO} cor={AQUA_TEXTO} />
          </g>
        ))}
      </svg>
    );
  const dispara = fase === "dispara";
  return (
    <svg
      viewBox="0 0 800 520"
      className="h-auto w-full"
      role="img"
      aria-label={dispara ? "O neurônio dispara e um pulso corre pelo axônio." : "As partes de um neurônio: dendritos, corpo da célula e axônio."}
    >
      <g transform="translate(270 250)">
        <NeuronioBio disparou={dispara} />
        {dispara && (
          <>
            {[[-120, -72], [-120, 2], [-120, 72], [-156, -20]].map(([x, y]) => (
              <circle key={`${x}:${y}`} cx={x} cy={y} r={7} fill={PULSO} stroke={PULSO_TRACO} strokeWidth={2} />
            ))}
            <circle cx={60} cy={0} r={11} fill={PULSO} stroke={PULSO_TRACO} strokeWidth={2.5} className="pulso-axonio" />
          </>
        )}
      </g>
      {dispara ? (
        <>
          <text x={80} y={110} fontSize={13} fontWeight={500} fill={MUDO}>sinais chegando</text>
          <text x={150} y={420} fontSize={13} fontWeight={500} fill={MUDO}>soma dos sinais</text>
          <rect x={150} y={432} width={240} height={12} rx={6} fill="#E5E5EA" />
          <rect x={150} y={432} width={196} height={12} rx={6} fill={PULSO_TRACO} />
          <line x1={294} y1={424} x2={294} y2={452} stroke={TEXTO} strokeWidth={2} />
          <text x={294} y={472} textAnchor="middle" fontSize={12} fontWeight={600} fill={TEXTO}>limite</text>
          <text x={640} y={170} textAnchor="middle" fontSize={16} fontWeight={700} fill="#B45309">disparou!</text>
          <text x={640} y={190} textAnchor="middle" fontSize={13} fill={MUDO}>o pulso segue adiante</text>
        </>
      ) : (
        <>
          <Rotulo x={110} y={90} titulo="dendritos" texto="recebem sinais" />
          <Rotulo x={270} y={170} titulo="corpo da célula" texto="junta tudo" />
          <Rotulo x={460} y={228} titulo="axônio" />
          <text x={460} y={290} textAnchor="middle" fontSize={13} fill={MUDO}>leva o sinal adiante</text>
          <Rotulo x={630} y={170} titulo="terminais" texto="ligam no próximo" />
          <AquaEm x={640} y={420} unidade={6} />
        </>
      )}
    </svg>
  );
}

/* ---------------- 01 · O neurônio da IA ---------------- */

const ENTRADAS = [
  { nome: "R", valor: 0.44, peso: 0.6, y: 120 },
  { nome: "G", valor: 1, peso: -0.4, y: 260 },
  { nome: "B", valor: 0.93, peso: 0.5, y: 400 },
];

function Neuronio({ fase }: { fase: "entradas" | "multiplica" | "soma" | "decide" }) {
  const ordem = ["entradas", "multiplica", "soma", "decide"].indexOf(fase);
  const porta: [number, number] = [442, 248];
  const soma = ENTRADAS.reduce((s, e) => s + e.valor * e.peso, 0);
  const passa = Math.max(0, soma);
  return (
    <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label="Um neurônio recebendo três números.">
      {ENTRADAS.map((e) => {
        const inicio: [number, number] = [158, e.y];
        const meio = ponto(inicio, porta, 0.38);
        // a bolinha sai da entrada, passa pelo peso e para antes do neurônio, sem encostar nas outras
        const bolinha = ponto(inicio, porta, ordem === 0 ? 0.18 : ordem === 1 ? 0.64 : 1);
        const produto = e.valor * e.peso;
        return (
          <g key={e.nome}>
            <line
              x1={inicio[0]} y1={inicio[1]} x2={porta[0]} y2={porta[1]}
              stroke={ordem === 0 ? CINZA : corDoSinal(e.peso)}
              strokeOpacity={ordem === 0 ? 0.4 : 0.7}
              strokeWidth={1.5 + Math.abs(e.peso) * 3}
              className="motion-safe:transition-[stroke] motion-safe:duration-500"
            />
            <text x={70} y={e.y + 5} textAnchor="end" fontSize={15} fontWeight={600} fill={MUDO}>{e.nome}</text>
            <text x={132} y={e.y + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={TEXTO}>{formatar(e.valor)}</text>
            <circle cx={150} cy={e.y} r={8} fill="#FFFFFF" stroke={CINZA} strokeWidth={2} />
            <Etiqueta x={meio[0]} y={meio[1]} texto={`× ${formatar(e.peso)}`} cor={textoDoSinal(e.peso)} largura={78} visivel={ordem >= 1} />
            <Bolinha x={bolinha[0]} y={bolinha[1]} valor={ordem === 0 ? e.valor : produto} neutra={ordem === 0} visivel={ordem <= 1} />
          </g>
        );
      })}
      <AquaEm x={440} y={218} unidade={12} pose={ordem >= 2 ? "contente" : "normal"} />
      <g className={ANIMA} style={{ opacity: ordem >= 2 ? 1 : 0 }}>
        <rect x={420} y={140} width={160} height={44} rx={22} fill="#FFFFFF" stroke={AQUA} strokeWidth={2} />
        <text x={500} y={168} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={MONO} fill={TEXTO}>
          soma {formatar(soma)}
        </text>
      </g>
      <g className={ANIMA} style={{ opacity: ordem >= 3 ? 1 : 0 }}>
        <line x1={560} y1={248} x2={690} y2={248} stroke={AQUA} strokeWidth={3} />
        <Bolinha x={712} y={248} valor={passa} />
        <text x={712} y={300} textAnchor="middle" fontSize={13} fontWeight={500} fill={MUDO}>passa adiante</text>
      </g>
    </svg>
  );
}

/* ---------------- 02 · Os pesos ---------------- */

function Peso({ entrada, peso, noLab }: { entrada: number; peso: number; noLab?: boolean }) {
  const produto = entrada * peso;
  return (
    <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label={`Uma entrada de ${formatar(entrada)} passando por um peso de ${formatar(peso)}.`}>
      <line
        x1={168} y1={260} x2={580} y2={260}
        stroke={corDoSinal(peso)}
        strokeOpacity={Math.abs(peso) < 0.005 ? 0.25 : 0.85}
        strokeWidth={1.5 + Math.abs(peso) * 3}
        className="motion-safe:transition-[stroke,stroke-width] motion-safe:duration-300"
      />
      <text x={150} y={222} textAnchor="middle" fontSize={13} fontWeight={500} fill={MUDO}>entrada</text>
      <circle cx={150} cy={260} r={10} fill="#FFFFFF" stroke={CINZA} strokeWidth={2.5} />
      <text x={150} y={300} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={MONO} fill={TEXTO}>{formatar(entrada)}</text>
      {noLab ? (
        <>
          <Etiqueta x={350} y={260} texto={formatar(peso)} cor={textoDoSinal(peso)} largura={62} />
          <text x={350} y={222} textAnchor="middle" fontSize={13} fontWeight={500} fill={AQUA_TEXTO}>2 cliques para editar</text>
          <path d="M372 274 l0 22 l6 -6 l5 10 l4 -2 l-5 -10 l8 0 z" fill={TEXTO} stroke="#FFFFFF" strokeWidth={1.5} />
        </>
      ) : (
        <Etiqueta x={350} y={260} texto={`× ${formatar(peso)}`} cor={textoDoSinal(peso)} largura={84} />
      )}
      <Bolinha x={490} y={260} valor={produto} r={26} />
      <circle cx={630} cy={260} r={44} fill={AQUA_FUNDO} stroke={AQUA} strokeWidth={3} />
      <text x={630} y={232} textAnchor="middle" fontSize={11} fontWeight={600} fill={AQUA_TEXTO}>neurônio</text>
      <text x={630} y={266} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={MONO} fill={TEXTO}>{formatar(produto)}</text>
      <AquaEm x={600} y={350} unidade={6} pose={produto > 0.005 ? "contente" : "normal"} />
    </svg>
  );
}

/* ---------------- 03 · A sigmoide ---------------- */

const SOMAS = [-3.4, 0.33, 1.2, 8.7];

function Reta({ naFaixa }: { naFaixa: boolean }) {
  const xSoma = (s: number) => 400 + 34 * s;
  const xNaFaixa = (s: number) => 200 + 400 * sigmoide(s);
  return (
    <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label="Somas soltas numa reta e, embaixo, as mesmas somas levadas para entre 0 e 1.">
      <text x={60} y={90} fontSize={13} fontWeight={500} fill={MUDO}>soma (qualquer número)</text>
      <line x1={60} y1={190} x2={740} y2={190} stroke="#000" strokeOpacity={0.18} strokeWidth={2} />
      {[-10, -5, 0, 5, 10].map((t) => (
        <g key={t}>
          <line x1={xSoma(t)} y1={184} x2={xSoma(t)} y2={196} stroke="#000" strokeOpacity={0.18} />
          <text x={xSoma(t)} y={218} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={SUTIL}>{formatar(t).replace(",00", "")}</text>
        </g>
      ))}
      {SOMAS.map((s, i) => {
        const alto = i % 2 === 1 ? 108 : 142;
        return (
          <g key={s}>
            <line x1={xSoma(s)} y1={alto + 13} x2={xSoma(s)} y2={190} stroke={CINZA} strokeOpacity={0.5} />
            <Etiqueta x={xSoma(s)} y={alto} texto={formatar(s)} cor={textoDoSinal(s)} largura={60} />
            <circle cx={xSoma(s)} cy={190} r={6} fill={AQUA_TEXTO} />
            <line
              x1={xSoma(s)} y1={196} x2={xNaFaixa(s)} y2={374}
              stroke={AQUA_TEXTO} strokeOpacity={0.5} strokeDasharray="4 5"
              className={ANIMA} style={{ opacity: naFaixa ? 1 : 0 }}
            />
          </g>
        );
      })}
      <g className={ANIMA} style={{ opacity: naFaixa ? 1 : 0 }}>
        <text x={200} y={344} fontSize={13} fontWeight={500} fill={MUDO}>resultado (de 0 a 1)</text>
        <rect x={200} y={376} width={400} height={8} rx={4} fill={AQUA_FUNDO} stroke={AQUA} strokeWidth={2} />
        <text x={186} y={385} textAnchor="end" fontSize={13} fontFamily={MONO} fill={SUTIL}>0</text>
        <text x={614} y={385} fontSize={13} fontFamily={MONO} fill={SUTIL}>1</text>
        {SOMAS.map((s) => (
          <g key={s}>
            <circle cx={xNaFaixa(s)} cy={380} r={6} fill={AQUA_TEXTO} />
            <Etiqueta x={xNaFaixa(s)} y={418} texto={formatar(sigmoide(s))} cor={TEXTO} largura={56} />
          </g>
        ))}
      </g>
      <AquaEm x={60} y={440} unidade={6} pose={naFaixa ? "contente" : "normal"} />
    </svg>
  );
}

const CX0 = 80;
const CX1 = 760;
const CY0 = 450; // resultado 0
const CY1 = 50; // resultado 1
const xCurva = (s: number) => CX0 + ((s + 6) * (CX1 - CX0)) / 12;
const yCurva = (v: number) => CY0 - (CY0 - CY1) * v;
const CAMINHO_S = Array.from({ length: 49 }, (_, i) => -6 + i * 0.25)
  .map((s, i) => `${i ? "L" : "M"}${xCurva(s).toFixed(1)} ${yCurva(sigmoide(s)).toFixed(1)}`)
  .join(" ");

function Curva({ soma, marcos }: { soma: number; marcos?: boolean }) {
  const v = sigmoide(soma);
  const x = xCurva(soma);
  const y = yCurva(v);
  const rotulosY = [
    { v: 1, t: "1" },
    { v: 0.5, t: "0,5" },
    { v: 0, t: "0" },
  ];
  return (
    <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label={`Curva em S. A soma ${formatar(soma)} vira ${formatar(v)}.`}>
      <text x={CX0} y={30} fontSize={13} fontWeight={500} fill={MUDO}>resultado</text>
      <line x1={CX0} y1={CY1} x2={CX1} y2={CY1} stroke="#000" strokeOpacity={0.08} strokeDasharray="4 5" />
      <line x1={CX0} y1={yCurva(0.5)} x2={CX1} y2={yCurva(0.5)} stroke="#000" strokeOpacity={0.08} strokeDasharray="4 5" />
      <line x1={CX0} y1={CY0} x2={CX1} y2={CY0} stroke="#000" strokeOpacity={0.15} />
      <line x1={xCurva(0)} y1={CY1 - 8} x2={xCurva(0)} y2={CY0 + 8} stroke="#000" strokeOpacity={0.08} />
      {rotulosY
        .filter((r) => Math.abs(yCurva(r.v) - y) > 18)
        .map((r) => (
          <text key={r.t} x={CX0 - 14} y={yCurva(r.v) + 4} textAnchor="end" fontSize={12} fontFamily={MONO} fill={SUTIL}>{r.t}</text>
        ))}
      {[-6, -3, 0, 3, 6]
        .filter((t) => Math.abs(xCurva(t) - x) > 34)
        .map((t) => (
          <text key={t} x={xCurva(t)} y={CY0 + 26} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={SUTIL}>{t < 0 ? `−${-t}` : t}</text>
        ))}
      <text x={CX1} y={CY0 + 50} textAnchor="end" fontSize={13} fontWeight={500} fill={MUDO}>soma →</text>
      <path d={CAMINHO_S} fill="none" stroke={AQUA} strokeWidth={3} strokeLinejoin="round" />
      {marcos &&
        [0, 4].map((s) => (
          <g key={s}>
            <circle cx={xCurva(s)} cy={yCurva(sigmoide(s))} r={6} fill="#FFFFFF" stroke={AQUA_TEXTO} strokeWidth={2} />
            <text x={xCurva(s) + 14} y={yCurva(sigmoide(s)) + 22} fontSize={13} fontWeight={600} fontFamily={MONO} fill={AQUA_TEXTO}>
              {formatar(s)} → {formatar(sigmoide(s))}
            </text>
          </g>
        ))}
      <g stroke={AQUA_TEXTO} strokeWidth={1.5} strokeDasharray="4 4">
        <line x1={x} y1={y + 6} x2={x} y2={CY0} />
        <line x1={CX0} y1={y} x2={x - 34} y2={y} />
      </g>
      <rect x={x - 28} y={CY0 - 12} width={56} height={24} rx={12} fill="#FFFFFF" stroke={AQUA_TEXTO} strokeWidth={1.5} />
      <text x={x} y={CY0 + 5} textAnchor="middle" fontSize={12} fontWeight={600} fontFamily={MONO} fill={AQUA_TEXTO}>{formatar(soma)}</text>
      <rect x={CX0 - 56} y={y - 12} width={52} height={24} rx={12} fill={VERDE} />
      <text x={CX0 - 30} y={y + 5} textAnchor="middle" fontSize={12} fontWeight={600} fontFamily={MONO} fill="#FFFFFF">{formatar(v)}</text>
      <AquaEm x={x - 30} y={y - 36} unidade={6} pose="contente" />
    </svg>
  );
}

function PainelLab() {
  return (
    <div className="flex flex-col items-center gap-8 px-6 py-10 sm:flex-row sm:items-end sm:justify-center">
      <div className="w-full max-w-[360px] rounded-2xl border border-black/[.08] bg-white p-5">
        <span className="rounded-full bg-aqua-50 px-3 py-1 text-xs font-semibold text-aqua-ink">Passo 9 de 9 · Camada 2</span>
        <div className="mt-4 rounded-xl bg-bg-subtle p-4">
          <p className="text-[13px] font-semibold text-text-muted">Sigmoide (deixa entre 0 e 1) · soma 1,20</p>
          <p className="mt-2 font-mono text-xl font-medium">
            1 ÷ (1 + 0,30) = <b className="text-[#15803D]">0,77</b>
          </p>
          <p className="mt-2 text-[13px] text-text-subtle">Fórmula completa: 1 ÷ (1 + e^(−1,20)).</p>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[.08] p-3">
          <span className="size-9 rounded-lg" style={{ background: "#F97316" }} aria-hidden />
          <div>
            <p className="text-xs text-text-muted">Saída</p>
            <p className="text-[15px] font-semibold">
              <span className="font-mono">0,77</span> · laranja (1)
            </p>
          </div>
        </div>
      </div>
      <Aqua unidade={8} pose="contente" />
    </div>
  );
}

/* ---------------- 04 · Camadas e fios ---------------- */

type Bloco = { x: number; y: number };
const ALTURA_NEURONIO = 52;
const alturaCamada = (n: number) => 70 + n * ALTURA_NEURONIO;
const neuronioY = (b: Bloco, i: number) => b.y + 64 + i * ALTURA_NEURONIO;
const LINHAS_ENTRADA = [0, 1, 2];
const entradaY = (b: Bloco, i: number) => b.y + 70 + i * 40;

function fio(a: [number, number], b: [number, number]) {
  return `M${a[0]} ${a[1]} C${a[0] + 60} ${a[1]} ${b[0] - 60} ${b[1]} ${b[0]} ${b[1]}`;
}

function BlocoEntrada({ b }: { b: Bloco }) {
  return (
    <g className={ANIMA} style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
      <rect width={130} height={180} rx={14} fill="#FFFFFF" stroke="#000" strokeOpacity={0.15} />
      <text x={16} y={30} fontSize={14} fontWeight={600} fill={TEXTO}>Entrada</text>
      {["R", "G", "B"].map((n, i) => (
        <g key={n}>
          <text x={16} y={74 + i * 40} fontSize={13} fontWeight={600} fill={MUDO}>{n}</text>
          <text x={36} y={74 + i * 40} fontSize={13} fontFamily={MONO} fill={TEXTO}>{["0,90", "0,55", "0,20"][i]}</text>
          <circle cx={108} cy={70 + i * 40} r={5} fill="#FFFFFF" stroke={CINZA} strokeWidth={2} />
        </g>
      ))}
      <circle cx={130} cy={90} r={6} fill={AQUA} />
    </g>
  );
}

/** A caixa e os neurônios são desenhados em camadas separadas, para as linhas ficarem entre os dois. */
function BlocoCamada({ b, n, titulo, solta, so }: { b: Bloco; n: number; titulo: string; solta?: boolean; so: "caixa" | "neuronios" }) {
  const h = alturaCamada(n);
  if (so === "neuronios")
    return (
      <g className={ANIMA} style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx={60} cy={64 + i * ALTURA_NEURONIO} r={18} fill={AQUA_FUNDO} stroke={AQUA} strokeWidth={2.5} />
        ))}
      </g>
    );
  return (
    <g className={ANIMA} style={{ transform: `translate(${b.x}px, ${b.y}px)`, opacity: solta ? 0.75 : 1 }}>
      <rect
        width={120} height={h} rx={14} fill="#FFFFFF"
        stroke={solta ? "#F5A524" : "#000"} strokeOpacity={solta ? 1 : 0.15}
        strokeWidth={solta ? 2 : 1} strokeDasharray={solta ? "6 5" : undefined}
      />
      <text x={60} y={30} textAnchor="middle" fontSize={14} fontWeight={600} fill={TEXTO}>{titulo}</text>
      <circle cx={0} cy={h / 2} r={6} fill={AQUA} />
      <circle cx={120} cy={h / 2} r={6} fill={AQUA} />
    </g>
  );
}

// Pesos da montagem básica (web/lib/rede.ts): R, G, B → detector de laranja e de azul → resposta
const PESOS_C1 = [
  [2, -1],
  [0.5, 0.5],
  [-2, 1.5],
];
const PESOS_C2 = [1.5, -1.5];

function Linha({ a, b, peso, visivel }: { a: [number, number]; b: [number, number]; peso: number; visivel: boolean }) {
  return (
    <line
      x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
      stroke={corDoSinal(peso)} strokeOpacity={0.55} strokeWidth={1 + Math.abs(peso)}
      className={ANIMA} style={{ opacity: visivel ? 1 : 0 }}
    />
  );
}

function Montagem({ fase }: { fase: "blocos" | "fios" | "todos" | "solta" | "basica" }) {
  const basica = fase === "basica";
  const entrada: Bloco = basica ? { x: 30, y: 170 } : { x: 50, y: 170 };
  const c1: Bloco = basica ? { x: 245, y: 156 } : { x: 330, y: 156 };
  const c2: Bloco = basica ? { x: 455, y: 197 } : { x: 330, y: 390 };
  const saida: Bloco = basica ? { x: 650, y: 230 } : { x: 620, y: 230 };
  const h1 = alturaCamada(2);
  const h2 = alturaCamada(1);
  const comFios = fase !== "blocos";
  const comLinhas = fase === "todos" || fase === "solta" || basica;
  const c2Visivel = fase === "solta" || basica;
  const portaSaida: [number, number] = [saida.x, saida.y + 20];
  // depois da Camada 1 vem a Saída, ou a Camada 2 na montagem básica
  const destinoC1: [number, number] = basica ? [c2.x, c2.y + h2 / 2] : portaSaida;
  const neuroniosC1 = [0, 1].map((i): [number, number] => [c1.x + 60, neuronioY(c1, i)]);
  const neuronioC2: [number, number] = [c2.x + 60, neuronioY(c2, 0)];
  return (
    <svg viewBox="0 130 800 390" className="h-auto w-full" role="img" aria-label="Blocos Entrada, Camada e Saída ligados por fios.">
      <g fill="none" stroke={CINZA} strokeWidth={2} strokeDasharray="6 5" className={ANIMA} style={{ opacity: comFios ? 1 : 0 }}>
        <path d={fio([entrada.x + 130, entrada.y + 90], [c1.x, c1.y + h1 / 2])} />
        <path d={fio([c1.x + 120, c1.y + h1 / 2], destinoC1)} />
        <path d={fio([c2.x + 120, c2.y + h2 / 2], portaSaida)} style={{ opacity: basica ? 1 : 0 }} />
      </g>
      <BlocoEntrada b={entrada} />
      <BlocoCamada b={c1} n={2} titulo="Camada 1" so="caixa" />
      <g className={ANIMA} style={{ opacity: c2Visivel ? 1 : 0 }}>
        <BlocoCamada b={c2} n={1} titulo="Camada 2" solta={fase === "solta"} so="caixa" />
      </g>
      {LINHAS_ENTRADA.map((i) =>
        neuroniosC1.map((alvo, j) => (
          <Linha key={`${i}-${j}`} a={[entrada.x + 113, entradaY(entrada, i)]} b={alvo} peso={PESOS_C1[i][j]} visivel={comLinhas} />
        )),
      )}
      {neuroniosC1.map((de, j) => (
        <Linha key={`c1-${j}`} a={de} b={basica ? neuronioC2 : portaSaida} peso={PESOS_C2[j]} visivel={comLinhas} />
      ))}
      <Linha a={neuronioC2} b={portaSaida} peso={1} visivel={basica} />
      <BlocoCamada b={c1} n={2} titulo="Camada 1" so="neuronios" />
      <g className={ANIMA} style={{ opacity: c2Visivel ? (fase === "solta" ? 0.75 : 1) : 0 }}>
        <BlocoCamada b={c2} n={1} titulo="Camada 2" so="neuronios" />
      </g>
      <text x={c2.x + 140} y={c2.y + 66} fontSize={13} fontWeight={600} fill="#8A5A00" className={ANIMA} style={{ opacity: fase === "solta" ? 1 : 0 }}>
        Sem fio: fica de fora das contas
      </text>
      <AquaEm x={saida.x} y={saida.y} unidade={8} pose={basica ? "contente" : "normal"} />
      <text x={saida.x + 40} y={saida.y + 76} textAnchor="middle" fontSize={13} fontWeight={600} fill={AQUA_TEXTO}>Saída</text>
    </svg>
  );
}

/* ---------------- Fim: a Aqua com a lâmpada ---------------- */

/** Aqua com a lâmpada (pose "Com a lâmpada", seção 7.1). Apagada até o aluno acertar o teste. */
export function AquaLampada({ acesa, className }: { acesa: boolean; className?: string }) {
  const luz = acesa ? "#FFD54A" : "#E5E5EA";
  return (
    <svg viewBox="150 16 100 152" className={className} shapeRendering="crispEdges" role="img" aria-label={acesa ? "Aqua com a lâmpada acesa." : "Aqua com a lâmpada apagada."}>
      <circle cx={200} cy={72} r={44} fill="#FFD54A" fillOpacity={acesa ? 0.18 : 0} className={ANIMA} />
      <rect x={188} y={40} width={24} height={8} fill={luz} />
      <rect x={180} y={48} width={40} height={24} fill={luz} />
      <rect x={188} y={72} width={24} height={8} fill={luz} />
      <rect x={188} y={48} width={8} height={8} fill={acesa ? "#FFF3C4" : "#F5F5F7"} />
      <rect x={188} y={80} width={24} height={8} fill={CINZA} />
      <rect x={196} y={88} width={8} height={8} fill={MUDO} />
      <g fill="#F59E0B" className={ANIMA} style={{ opacity: acesa ? 1 : 0 }}>
        <rect x={164} y={56} width={8} height={8} />
        <rect x={228} y={56} width={8} height={8} />
        <rect x={196} y={24} width={8} height={8} />
        <rect x={172} y={32} width={8} height={8} />
        <rect x={220} y={32} width={8} height={8} />
      </g>
      <rect x={168} y={112} width={64} height={40} fill={AQUA} />
      <rect x={184} y={120} width={8} height={16} fill="#06363A" />
      <rect x={208} y={120} width={8} height={16} fill="#06363A" />
      {acesa && (
        <>
          <rect x={176} y={136} width={8} height={8} fill="#F4A3B5" />
          <rect x={216} y={136} width={8} height={8} fill="#F4A3B5" />
        </>
      )}
      <rect x={160} y={128} width={8} height={8} fill={AQUA_TEXTO} />
      <rect x={232} y={128} width={8} height={8} fill={AQUA_TEXTO} />
      <rect x={176} y={152} width={8} height={8} fill={AQUA} />
      <rect x={216} y={152} width={8} height={8} fill={AQUA} />
    </svg>
  );
}

/* ---------------- Palco ---------------- */

export function Palco({ visual, valor }: { visual: Visual; valor: number }) {
  switch (visual.tipo) {
    case "cerebro":
      return <Cerebro fase={visual.fase} />;
    case "neuronio":
      return <Neuronio fase={visual.fase} />;
    case "peso":
      return <Peso entrada={visual.entrada} peso={valor} noLab={visual.noLab} />;
    case "reta":
      return <Reta naFaixa={visual.naFaixa} />;
    case "curva":
      return <Curva soma={valor} marcos={visual.marcos} />;
    case "painel-lab":
      return <PainelLab />;
    case "montagem":
      return <Montagem fase={visual.fase} />;
  }
}

/** O valor que o controle deslizante do passo mexe (peso ou soma), se houver. */
export function valorInicial(visual: Visual): number {
  if (visual.tipo === "peso") return visual.peso;
  if (visual.tipo === "curva") return visual.soma;
  return 0;
}

/* ---------------- Miniaturas da lista (frame "Tutoriais · Desktop") ---------------- */

export function Miniatura({ slug }: { slug: string }) {
  const caixa = "h-auto w-full";
  if (slug === "neuronio")
    return (
      <svg viewBox="0 0 278 200" className={caixa} aria-hidden>
        <g transform="translate(72 100) scale(0.3)">
          <NeuronioBio />
        </g>
        <text x={190} y={106} textAnchor="middle" fontSize={16} fill={SUTIL}>→</text>
        <AquaEm x={206} y={82} unidade={6} />
        <text x={84} y={170} textAnchor="middle" fontSize={11} fontWeight={600} fill={BIO_TEXTO}>no cérebro</text>
        <text x={236} y={170} textAnchor="middle" fontSize={11} fontWeight={600} fill={AQUA_TEXTO}>na IA</text>
      </svg>
    );
  if (slug === "pesos")
    return (
      <svg viewBox="0 0 278 200" className={caixa} aria-hidden>
        <line x1={56} y1={64} x2={168} y2={100} stroke={VERDE} strokeWidth={5} strokeOpacity={0.8} />
        <line x1={56} y1={136} x2={168} y2={100} stroke={VERMELHO} strokeWidth={2} strokeOpacity={0.8} />
        <text x={14} y={68} fontSize={12} fontFamily={MONO} fill={MUDO}>1,00</text>
        <text x={14} y={140} fontSize={12} fontFamily={MONO} fill={MUDO}>1,00</text>
        <circle cx={56} cy={64} r={5} fill="#FFFFFF" stroke={CINZA} strokeWidth={2} />
        <circle cx={56} cy={136} r={5} fill="#FFFFFF" stroke={CINZA} strokeWidth={2} />
        <rect x={88} y={64} width={54} height={20} rx={10} fill="#FFFFFF" />
        <text x={115} y={78} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily={MONO} fill={VERDE_TEXTO}>× 0,80</text>
        <rect x={86} y={116} width={58} height={20} rx={10} fill="#FFFFFF" />
        <text x={115} y={130} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily={MONO} fill={VERMELHO_TEXTO}>× −0,30</text>
        <circle cx={190} cy={100} r={22} fill={VERDE} stroke={AQUA} strokeWidth={2.5} />
        <text x={190} y={104} textAnchor="middle" fontSize={12} fontWeight={600} fontFamily={MONO} fill="#FFFFFF">0,50</text>
        <AquaEm x={222} y={160} unidade={4} pose="contente" />
      </svg>
    );
  if (slug === "sigmoide")
    return (
      <svg viewBox="0 0 278 200" className={caixa} aria-hidden>
        <line x1={20} y1={32.5} x2={258} y2={32.5} stroke="#000" strokeOpacity={0.08} strokeDasharray="4 4" />
        <line x1={20} y1={170} x2={258} y2={170} stroke="#000" strokeOpacity={0.12} />
        <text x={8} y={36} fontSize={11} fontFamily={MONO} fill={SUTIL}>1</text>
        <text x={8} y={174} fontSize={11} fontFamily={MONO} fill={SUTIL}>0</text>
        <path
          d={Array.from({ length: 33 }, (_, i) => -4 + i * 0.25)
            .map((s, i) => `${i ? "L" : "M"}${(20 + (s + 4) * 29.75).toFixed(1)} ${(170 - 137.5 * sigmoide(s)).toFixed(1)}`)
            .join(" ")}
          fill="none" stroke={AQUA} strokeWidth={3} strokeLinejoin="round"
        />
        <AquaEm x={155} y={38} unidade={4} pose="contente" />
      </svg>
    );
  return (
    <svg viewBox="0 0 278 200" className={caixa} aria-hidden>
      <g stroke={CINZA} strokeWidth={2} strokeDasharray="5 4">
        <line x1={80} y1={100} x2={108} y2={100} />
        <line x1={170} y1={100} x2={200} y2={100} />
      </g>
      <rect x={20} y={70} width={58} height={60} rx={10} fill="#FFFFFF" stroke="#000" strokeOpacity={0.15} />
      <text x={49} y={96} textAnchor="middle" fontSize={10} fontWeight={600} fill={TEXTO}>Entrada</text>
      {[36, 49, 62].map((x) => (
        <circle key={x} cx={x} cy={112} r={3.5} fill="#FFFFFF" stroke={CINZA} strokeWidth={1.5} />
      ))}
      <rect x={110} y={56} width={58} height={88} rx={10} fill="#FFFFFF" stroke="#000" strokeOpacity={0.15} />
      <text x={139} y={76} textAnchor="middle" fontSize={10} fontWeight={600} fill={TEXTO}>Camada</text>
      <circle cx={139} cy={96} r={10} fill={AQUA_FUNDO} stroke={AQUA} strokeWidth={2} />
      <circle cx={139} cy={122} r={10} fill={AQUA_FUNDO} stroke={AQUA} strokeWidth={2} />
      {[78, 110, 168].map((x) => (
        <circle key={x} cx={x} cy={100} r={4} fill={AQUA} />
      ))}
      <AquaEm x={200} y={85} unidade={5} />
      <text x={225} y={140} textAnchor="middle" fontSize={10} fontWeight={600} fill={AQUA_TEXTO}>Saída</text>
    </svg>
  );
}
