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

// Reações (frame "Aqua · reações" no Figma): o corpo original começa na linha 6 da grade 10 × 12
// e o ícone fica nas linhas 0–4, acima da cabeça. O rosto nunca muda (sem boca).
const CINZA_ICONE = "#6E6E73";

export type ReacaoAqua = "observando" | "pesando" | "somando" | "decidindo" | "pensando" | "preocupada" | "confiante";

const ICONES: Record<ReacaoAqua, Celula[]> = {
  observando: [
    [3, 0, 3, 1, CINZA_ICONE],
    [2, 1, 1, 2, CINZA_ICONE],
    [6, 1, 1, 2, CINZA_ICONE],
    [3, 3, 3, 1, CINZA_ICONE],
    [3, 1, 3, 2, "#D6EEFB"],
    [3, 1, 1, 1, "#FFFFFF"],
    [6, 3, 1, 1, "#8B5A2B"],
    [7, 4, 1, 1, "#8B5A2B"],
  ],
  pesando: [
    [4, 0, 2, 1, CINZA_ICONE],
    [1, 1, 8, 1, CINZA_ICONE],
    [4, 2, 2, 2, CINZA_ICONE],
    [3, 4, 4, 1, CINZA_ICONE],
    [1, 2, 1, 1, CINZA_ICONE],
    [8, 2, 1, 1, CINZA_ICONE],
    [0, 3, 3, 1, "#E9A800"],
    [7, 3, 3, 1, "#E9A800"],
  ],
  somando: [
    [3, 0, 5, 1, PORTA],
    [4, 1, 1, 1, PORTA],
    [5, 2, 1, 1, PORTA],
    [4, 3, 1, 1, PORTA],
    [3, 4, 5, 1, PORTA],
  ],
  decidindo: [
    [4, 0, 2, 1, "#FFD54A"],
    [3, 1, 4, 2, "#FFD54A"],
    [4, 1, 1, 1, "#FFF3C4"],
    [4, 3, 2, 1, "#8E8E93"],
    [4, 4, 2, 1, CINZA_ICONE],
    [1, 1, 1, 1, "#F59E0B"],
    [8, 1, 1, 1, "#F59E0B"],
    [2, 0, 1, 1, "#F59E0B"],
    [7, 0, 1, 1, "#F59E0B"],
  ],
  pensando: [
    [3, 0, 4, 1, PORTA],
    [2, 1, 1, 1, PORTA],
    [7, 1, 1, 1, PORTA],
    [5, 2, 2, 1, PORTA],
    [5, 4, 1, 1, PORTA],
  ],
  preocupada: [
    [2, 0, 2, 3, "#FF453A"],
    [2, 4, 2, 1, "#FF453A"],
    [6, 0, 1, 1, "#7CC4F0"],
    [6, 1, 2, 1, "#7CC4F0"],
    [5, 2, 4, 2, "#7CC4F0"],
    [6, 4, 2, 1, "#7CC4F0"],
    [6, 2, 1, 1, "#D6EEFB"],
  ],
  confiante: [
    [5, 0, 1, 1, "#FFD54A"],
    [4, 1, 3, 1, "#FFD54A"],
    [2, 2, 7, 1, "#FFD54A"],
    [4, 3, 3, 1, "#FFD54A"],
    [3, 4, 2, 1, "#FFD54A"],
    [6, 4, 2, 1, "#FFD54A"],
  ],
};

const deslocar = (celulas: Celula[], dx: number, dy: number): Celula[] =>
  celulas.map(([x, y, w, h, cor]) => [x + dx, y + dy, w, h, cor]);

/** Aqua com uma reação em ícone acima da cabeça (grade 10 × 12). */
export function AquaReacao({ reacao, unidade = 4, rotulo, className }: { reacao: ReacaoAqua; unidade?: number; rotulo?: string; className?: string }) {
  const contente = reacao === "decidindo" || reacao === "confiante";
  return (
    <Pixels
      celulas={[...ICONES[reacao], ...deslocar(celulasAqua(contente ? "contente" : "normal"), 0, 6)]}
      colunas={10}
      linhas={12}
      unidade={unidade}
      rotulo={rotulo}
      className={className}
    />
  );
}

// Fantasias de época (tutorial 01, passo 3): cabelo, óculos e roupa por cima do corpo original.
// Grade 10 × 9: três linhas de cabelo acima da cabeça, o corpo começa na linha 3.
export type FantasiaAqua = "mcculloch" | "pitts" | "rosenblatt" | "anos80";

const FANTASIAS: Record<FantasiaAqua, Celula[]> = {
  mcculloch: [
    [1, 2, 2, 1, "#C7C7CC"],
    [1, 3, 1, 1, "#C7C7CC"],
    [7, 2, 2, 1, "#C7C7CC"],
    [8, 3, 1, 1, "#C7C7CC"],
    [1, 6, 1, 1, "#E5E5EA"], // barba clara
    [8, 6, 1, 1, "#E5E5EA"],
    [1, 7, 8, 1, "#E5E5EA"],
  ],
  pitts: [
    [4, 1, 5, 1, "#3B2A1E"],
    [5, 2, 4, 1, "#3B2A1E"],
    [8, 3, 1, 1, "#3B2A1E"],
    [1, 2, 2, 1, "#3B2A1E"],
    [1, 3, 1, 1, "#3B2A1E"],
  ],
  rosenblatt: [
    [3, 0, 4, 1, "#4A3424"],
    [2, 1, 6, 1, "#4A3424"],
    [1, 2, 8, 1, "#4A3424"],
    [1, 3.25, 8, 0.75, "#1D1D1F"], // óculos de armação grossa em cima
    [2.25, 4, 0.25, 2.5, "#1D1D1F"],
    [2.25, 6.25, 2.5, 0.25, "#1D1D1F"],
    [4.75, 4, 0.25, 2.5, "#1D1D1F"],
    [5.25, 4, 0.25, 2.5, "#1D1D1F"],
    [5.25, 6.25, 2.5, 0.25, "#1D1D1F"],
    [7.75, 4, 0.25, 2.5, "#1D1D1F"],
  ],
  anos80: [
    [1, 0, 2, 1, "#8A5A3B"],
    [4, 0, 2, 1, "#8A5A3B"],
    [7, 0, 2, 1, "#8A5A3B"],
    [0, 1, 10, 2, "#8A5A3B"],
    [1, 3, 1, 2, "#8A5A3B"],
    [8, 3, 1, 2, "#8A5A3B"],
    [1, 6.5, 8, 1.5, "#C2476B"], // suéter
    [1, 7, 8, 0.5, "#F5C542"],
  ],
};

/** Aqua vestida de um pesquisador da história da IA (grade 10 × 9). */
export function AquaFantasia({ quem, unidade = 4, rotulo }: { quem: FantasiaAqua; unidade?: number; rotulo?: string }) {
  return (
    <Pixels
      celulas={[...deslocar(celulasAqua("normal"), 0, 3), ...FANTASIAS[quem]]}
      colunas={10}
      linhas={9}
      unidade={unidade}
      rotulo={rotulo}
    />
  );
}

// Cenas do tutorial 01 (frame "Tutorial 01 · O neurônio · roteiro"): a Aqua com a tarefa do
// laboratório, sem ícone na cabeça. Grade 28 × 13 (cestos) e 22 × 13 (lâmpada); o corpo começa na linha 6.
const LARANJA = "#FF8C00";
const AZUL = "#378ADD";

const celulasSeparando: Celula[] = [
  ...deslocar(celulasAqua("normal"), 0, 6),
  [0, 12, 28, 1, "#D2D2D7"], // chão
  [10, 6, 2, 2, AZUL], // o cartão que ela está separando
  [11, 9, 8, 1, "#A0522D"], // cesto do laranja
  [12, 10, 6, 2, "#8B5A2B"],
  [13, 8, 2, 1, LARANJA],
  [15, 7, 2, 2, LARANJA],
  [19, 9, 8, 1, "#A0522D"], // cesto do azul
  [20, 10, 6, 2, "#8B5A2B"],
  [21, 8, 2, 1, AZUL],
  [23, 8, 2, 1, AZUL],
];

const celulasLampada: Celula[] = [
  ...deslocar(celulasAqua("normal"), 0, 6),
  [0, 12, 22, 1, "#D2D2D7"],
  [10, 8, 6, 1, PORTA], // o fio sai da porta da Aqua
  [15, 3, 4, 4, "#FFD54A"], // lâmpada acesa
  [16, 4, 1, 1, "#FFF3C4"],
  [16, 7, 2, 2, "#8E8E93"],
  [16, 9, 2, 3, CINZA_ICONE],
  [13, 4, 1, 1, "#F59E0B"], // raios
  [20, 4, 1, 1, "#F59E0B"],
  [14, 2, 1, 1, "#F59E0B"],
  [19, 2, 1, 1, "#F59E0B"],
  [17, 1, 1, 1, "#F59E0B"],
];

/** A Aqua separando cartões laranja e azul em dois cestos (passo 2 do tutorial 01). */
export function AquaSeparando({ unidade = 3, rotulo }: { unidade?: number; rotulo?: string }) {
  return <Pixels celulas={celulasSeparando} colunas={28} linhas={13} unidade={unidade} rotulo={rotulo} />;
}

/** A Aqua ligada a uma lâmpada acesa: o neurônio acendeu (passo 8 do tutorial 01). */
export function AquaAcendendo({ unidade = 3, rotulo }: { unidade?: number; rotulo?: string }) {
  return <Pixels celulas={celulasLampada} colunas={22} linhas={13} unidade={unidade} rotulo={rotulo} />;
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
