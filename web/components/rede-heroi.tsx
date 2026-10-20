import { Aqua } from "@/components/mascote";

// Rede neural do herói da Home, igual ao frame "Rede neural (hero) · claro" do Figma.
// Montada a partir dos dados para poder ser animada depois (GSAP).

const LARGURA = 1130; // 1100 da rede + espaço para a Aqua na saída
const ALTURA = 380;
const COLUNAS = [70, 310, 550, 790, 1030];
const CAMADAS: number[][] = [
  [128, 190, 252],
  [66, 128, 190, 252, 314],
  [35, 97, 159, 221, 283, 345],
  [66, 128, 190, 252, 314],
  [159, 221],
];

// Índice do neurônio por camada em cada caminho destacado.
const CAMINHO_AQUA = [1, 2, 3, 1, 0]; // o caminho "da vez"
const CAMINHO_AZUL = [0, 1, 4, 3, 1]; // um peso positivo

type Ponto = [number, number];
const ponto = (camada: number, i: number): Ponto => [COLUNAS[camada], CAMADAS[camada][i]];
const linha = (caminho: number[]) =>
  caminho.map((i, c) => `${c ? "L" : "M"}${ponto(c, i).join(" ")}`).join("");

export function RedeHeroi() {
  const fundo: string[] = [];
  for (let c = 0; c < CAMADAS.length - 1; c++) {
    for (const y1 of CAMADAS[c]) {
      for (const y2 of CAMADAS[c + 1]) {
        fundo.push(`M${COLUNAS[c]} ${y1}L${COLUNAS[c + 1]} ${y2}`);
      }
    }
  }
  const saida = ponto(4, CAMINHO_AQUA[4]);

  return (
    <div className="relative mx-auto w-full max-w-[1130px]">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-auto w-full"
        role="img"
        aria-label="Uma rede neural com cinco camadas; um caminho de neurônios está aceso em aqua até a saída."
      >
        <path d={fundo.join("")} stroke="#1D1D1F" strokeOpacity={0.1} />
        <path d={linha(CAMINHO_AZUL)} stroke="#378ADD" strokeOpacity={0.7} strokeWidth={2} fill="none" />
        <path
          d={linha(CAMINHO_AQUA)}
          stroke="#5ED3DB"
          strokeOpacity={0.25}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d={linha(CAMINHO_AQUA)}
          stroke="#5ED3DB"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {CAMADAS.map((ys, c) =>
          ys.map((y, i) => {
            const x = COLUNAS[c];
            if (CAMINHO_AQUA[c] === i) {
              return (
                <g key={`${c}-${i}`}>
                  <circle cx={x} cy={y} r={22} fill="#5ED3DB" fillOpacity={0.22} />
                  <circle cx={x} cy={y} r={11} fill="#5ED3DB" stroke="#0E7C86" strokeWidth={1.5} />
                </g>
              );
            }
            if (CAMINHO_AZUL[c] === i) {
              return <circle key={`${c}-${i}`} cx={x} cy={y} r={9} fill="#EAF3FC" stroke="#378ADD" strokeWidth={1.5} />;
            }
            return (
              <circle key={`${c}-${i}`} cx={x} cy={y} r={8} fill="#FFFFFF" stroke="#1D1D1F" strokeOpacity={0.25} strokeWidth={1.2} />
            );
          }),
        )}
        <path d={`M${saida[0] + 12} ${saida[1]}H${saida[0] + 30}`} stroke="#5ED3DB" strokeWidth={3} />
        <text
          x={saida[0] + 55}
          y={saida[1] - 18}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#0E7C86"
        >
          0,97
        </text>
      </svg>
      {/* Aqua recebe a resposta da rede; posição e tamanho em % para acompanhar o desenho */}
      <Aqua
        pose="contente"
        unidade={5}
        rotulo="Aqua, o mascote, recebendo a resposta 0,97"
        className="absolute h-auto"
        style={{
          left: `${((saida[0] + 30) / LARGURA) * 100}%`,
          top: `${((saida[1] - 12.5) / ALTURA) * 100}%`,
          width: `${(50 / LARGURA) * 100}%`,
        }}
      />
    </div>
  );
}
