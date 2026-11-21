"""Gera o "mundo" da cena do hero (ADR-0036, versão 2) e grava em components/cena-heroi-mundo.ts.

A Aqua no meio de neurônios espalhados; uma onda de ativação sai dos bracinhos dela e acende tudo
enquanto a câmera afasta. É o mesmo mundo dos quadros do Figma ("Cena do hero v2 · neurônios espalhados").
Mundo em unidades do quadro final (1280 x 640, zoom 1). A câmera fica parada no centro da Aqua e só afasta.

Rodar de dentro de web/:  python scripts/gerar-cena-heroi.py
A semente do sorteio é fixa, então o resultado é sempre o mesmo.
"""
import heapq, json, math, os, random

W, H = 1280, 640
CX, CY = 640, 320
AQUA, OLHO, PORTA = "#5ED3DB", "#06363A", "#0E7C86"
VERDE, VERM, CINZA_L, CINZA_N = "#2FA35B", "#D64545", "#1D1D1F", "#C7C7CC"
SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "components", "cena-heroi-mundo.ts")
rnd = random.Random(5)

# ---------- Aqua (grade 20 x 12, pixel 3) ----------
# A Aqua encolhe menos que o mundo quando a câmera afasta (pixel = P1 * zoom^-0.4),
# para continuar visível no quadro final: 263 px de largura no começo, 90 px no fim.
P1 = 4.5
def pix(z):
    return P1 * z ** -0.4
def bracos_em(z):
    p = pix(z)
    return (CX - 9 * p, CY - p), (CX + 9 * p, CY - p)  # centro de cada bracinho (linha 4-5 da grade)
BRACO_E, BRACO_D = bracos_em(1.0)

# ---------- câmera: zoom 6 -> 1 em 10 s, em escala log com ease in-out ----------
Z0 = 6.0
def ease(u):
    return (1 - math.cos(math.pi * u)) / 2
def zoom(t):
    return Z0 ** (1 - ease(min(max(t / 10, 0), 1)))

# ---------- neurônios: amostragem de disco de Poisson com espaçamento que cresce longe da Aqua ----------
def esp(x, y):
    d = math.hypot((x - CX), (y - CY) * 1.6)
    return 19 + d * 0.06

pts = []
cel = 20
grade = {}
def perto(x, y, s):
    gx, gy = int(x // cel), int(y // cel)
    r = int(s // cel) + 2
    for i in range(gx - r, gx + r + 1):
        for j in range(gy - r, gy + r + 1):
            for k in grade.get((i, j), ()):
                px, py = pts[k][0], pts[k][1]
                if (px - x) ** 2 + (py - y) ** 2 < (s * 0.5 + esp(px, py) * 0.5) ** 2:
                    return True
    return False

for _ in range(60000):
    x = rnd.uniform(-40, W + 40)
    y = rnd.uniform(-30, H + 30)
    if abs(x - CX) < 45 + 16 and abs(y - CY) < 27 + 14:  # não em cima da Aqua
        continue
    s = esp(x, y)
    if perto(x, y, s):
        continue
    d = math.hypot(x - CX, y - CY)
    r = 2.0 + d * 0.0035 + rnd.uniform(-0.3, 0.5)
    pts.append((x, y, r))
    grade.setdefault((int(x // cel), int(y // cel)), []).append(len(pts) - 1)

N = len(pts)

# ---------- ligações: cada neurônio às 3 mais próximas ----------
def dist(a, b):
    return math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1])

arestas = {}
for i in range(N):
    viz = sorted((j for j in range(N) if j != i), key=lambda j: dist(i, j))[:3]
    for j in viz:
        if dist(i, j) < esp(pts[i][0], pts[i][1]) * 2.2:
            k = (min(i, j), max(i, j))
            if k not in arestas:
                g = rnd.uniform(-1, 1)
                arestas[k] = dict(cor=VERDE if g > 0 else VERM, w=0.35 + abs(g) * 0.75, op=0.3 + abs(g) * 0.5)

# braços da Aqua ligados aos neurônios mais próximos de cada lado
bracos = []
for b, lado in ((BRACO_E, -1), (BRACO_D, 1)):
    cand = [i for i in range(N) if (pts[i][0] - b[0]) * lado > 0]
    for i in sorted(cand, key=lambda i: math.hypot(pts[i][0] - b[0], pts[i][1] - b[1]))[:3]:
        g = rnd.uniform(0.3, 1)
        bracos.append(dict(b=b, i=i, cor=VERDE, w=0.5 + g * 0.6, op=0.85))

# ---------- onda: distância pelo grafo (Dijkstra) a partir da Aqua ----------
adj = {i: [] for i in range(N)}
for (i, j) in arestas:
    adj[i].append(j); adj[j].append(i)
D = [math.inf] * N
pred = [None] * N
h = []
for k, br in enumerate(bracos):
    i = br["i"]
    d0 = math.hypot(pts[i][0] - br["b"][0], pts[i][1] - br["b"][1])
    if d0 < D[i]:
        D[i] = d0; pred[i] = ("braco", k)
        heapq.heappush(h, (d0, i))
while h:
    d, i = heapq.heappop(h)
    if d > D[i]:
        continue
    for j in adj[i]:
        nd = d + dist(i, j)
        if nd < D[j]:
            D[j] = nd; pred[j] = ("n", i)
            heapq.heappush(h, (nd, j))
Dmax = max(d for d in D if d < math.inf)
for i in range(N):
    if D[i] == math.inf:
        D[i] = Dmax

T_FIM = 9.2
# a frente da onda acompanha o que a câmera mostra: D(t) = k * (W/2) / zoom(t) - c,
# com D = 0 em t = 0 e D = Dmax em T_FIM. Assim a onda fica sempre perto da borda do que se vê.
_k = Dmax / ((W / 2) / zoom(T_FIM) - (W / 2) / Z0)
_c = _k * (W / 2) / Z0
def frente(t):
    return _k * (W / 2) / zoom(t) - _c
def acende(d):
    lo, hi = 0.0, T_FIM
    for _ in range(40):
        m = (lo + hi) / 2
        if frente(m) < d: lo = m
        else: hi = m
    return hi
TL = [acende(d) for d in D]

# ---------- exportar ----------
def r1(v):
    return round(v, 1)

ligs = [[i, j, 1 if e["cor"] == VERDE else -1, round(e["w"], 2), round(e["op"], 2)] for (i, j), e in sorted(arestas.items())]
# de onde vem o pulso que acende cada neurônio: índice do neurônio, ou -(k + 1) para o bracinho k
origem = []
for p in pred:
    if p is None:
        origem.append(None)
    elif p[0] == "braco":
        origem.append(-(p[1] + 1))
    else:
        origem.append(p[1])
dados = dict(
    neuronios=[[r1(x), r1(y), round(r, 2)] for x, y, r in pts],
    ligacoes=ligs,
    bracos=[[0 if b["b"] == BRACO_E else 1, b["i"], round(b["w"], 2)] for b in bracos],
    acende=[round(t, 3) for t in TL],
    origem=origem,
)
cab = f"""// Gerado por scripts/gerar-cena-heroi.py. Não editar à mão: mude o script e rode de novo.
// O "mundo" da cena do hero (ADR-0036, versão 2), em unidades do quadro final ({W} x {H}).

export const CENA = {{ largura: {W}, altura: {H}, cx: {CX}, cy: {CY}, zoomInicial: {Z0}, pixelAqua: {P1}, fimDaOnda: {T_FIM} }};

export type Mundo = {{
  /** [x, y, raio] de cada neurônio */
  neuronios: [number, number, number][];
  /** [neurônio a, neurônio b, sinal do peso (1 = positivo, -1 = negativo), espessura, opacidade] */
  ligacoes: [number, number, number, number, number][];
  /** [lado (0 = bracinho esquerdo, 1 = direito), neurônio, espessura]: ligações que saem da Aqua */
  bracos: [number, number, number][];
  /** segundo da cena em que cada neurônio acende (a onda, pelo caminho mais curto a partir da Aqua) */
  acende: number[];
  /** de onde vem o pulso que acende cada neurônio: outro neurônio, ou -(k + 1) para o bracinho k */
  origem: (number | null)[];
}};

"""
corpo = "export const MUNDO: Mundo = " + json.dumps(dados, separators=(",", ":")) + ";\n"
with open(SAIDA, "w", encoding="utf-8", newline="\n") as f:
    f.write(cab + corpo)
print("neuronios", N, "ligacoes", len(ligs), "bracos", len(bracos), "bytes", len(cab + corpo))
