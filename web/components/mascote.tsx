// Mascotes em pixel art (docs/04-design-system.md, seção 7.1).
// Cada desenho é uma lista de células [coluna, linha, largura, altura, cor] numa grade.
// Só amplie em múltiplos inteiros da unidade, sem suavizar.

type Celula = [x: number, y: number, w: number, h: number, cor: string];

const AQUA = "#5ED3DB";
const OLHO = "#06363A";
const PORTA = "#0E7C86";
const BOCHECHA = "#F4A3B5";

export type PoseAqua = "normal" | "contente" | "dormindo";

function celulasAqua(pose: PoseAqua): Celula[] {
  const olhos: Celula[] =
    pose === "dormindo"
      ? [
          [2, 2, 2, 1, OLHO],
          [6, 2, 2, 1, OLHO],
        ]
      : [
          [3, 1, 1, 2, OLHO],
          [6, 1, 1, 2, OLHO],
        ];
  const bochechas: Celula[] =
    pose === "contente"
      ? [
          [2, 3, 1, 1, BOCHECHA],
          [7, 3, 1, 1, BOCHECHA],
        ]
      : [];
  return [
    [1, 0, 8, 5, AQUA], // corpo
    ...olhos,
    ...bochechas,
    [0, 2, 1, 1, PORTA], // portas, onde entram e saem os fios
    [9, 2, 1, 1, PORTA],
    [2, 5, 1, 1, AQUA], // perninhas
    [7, 5, 1, 1, AQUA],
  ];
}

const CLAUDE = "#D97757";
const CLAUDE_OLHO = "#1D1D1F";

const celulasClaude: Celula[] = [
  [1, 0, 10, 5, CLAUDE],
  [0, 2, 1, 2, CLAUDE],
  [11, 2, 1, 2, CLAUDE],
  [3, 1, 1, 2, CLAUDE_OLHO],
  [8, 1, 1, 2, CLAUDE_OLHO],
  [2, 5, 1, 2, CLAUDE],
  [4, 5, 1, 2, CLAUDE],
  [7, 5, 1, 2, CLAUDE],
  [9, 5, 1, 2, CLAUDE],
];

function Pixels({
  celulas,
  colunas,
  linhas,
  unidade,
  rotulo,
  className,
  style,
}: {
  celulas: Celula[];
  colunas: number;
  linhas: number;
  unidade: number;
  rotulo?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const w = colunas * unidade;
  const h = linhas * unidade;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${colunas} ${linhas}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      {celulas.map(([x, y, cw, ch, cor], i) => (
        <rect key={i} x={x} y={y} width={cw} height={ch} fill={cor} />
      ))}
    </svg>
  );
}

/** Aqua, o mascote do LearningThinking: um bloco do laboratório com olhos (grade 10 × 6). */
export function Aqua({
  pose = "normal",
  unidade = 3,
  rotulo,
  className,
  style,
}: {
  pose?: PoseAqua;
  unidade?: number;
  rotulo?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Pixels
      celulas={celulasAqua(pose)}
      colunas={10}
      linhas={6}
      unidade={unidade}
      rotulo={rotulo}
      className={className}
      style={style}
    />
  );
}

/** Mascote em pixel do Claude (grade 12 × 7). */
export function Claude({
  unidade = 8,
  className,
}: {
  unidade?: number;
  className?: string;
}) {
  return (
    <Pixels
      celulas={celulasClaude}
      colunas={12}
      linhas={7}
      unidade={unidade}
      className={className}
    />
  );
}
