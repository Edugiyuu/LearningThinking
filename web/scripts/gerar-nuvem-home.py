# Pontos da nuvem de partículas da Home (ADR-0038, atualização 4), iguais aos quadros do Figma.
# - As telas que o autor escolheu (neurônio B, bancada B, lupa B, nuvem do card C, Explore C) saem deste
#   gerador, o mesmo que desenhou os quadros no Figma (mesma semente, mesmos pontos).
# - O topo, o Claude pensando na Aqua e a Aqua do fim vêm dos SVGs exportados do Figma (scripts/figma-nuvem).
# Tudo em coordenadas do quadro de 1440 x 900. Saída: public/nuvem/home.json.
# Rodar: python scripts/gerar-nuvem-home.py
import random, math, json, os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "..", "public", "nuvem", "home.json")

AQUA = "#3cc8d8"; AQUAD = "#0e7c86"; VERDE = "#2e9e5b"; VERM = "#e05555"
AZUL = "#2f7fd8"; CINZA = "#c8c8cc"; TXT = "#1d1d1f"; TXT2 = "#6e6e73"; TXT3 = "#86868b"

class S:
    def __init__(s, seed):
        random.seed(seed); s.el = []; s.pts = {}; s.lista = []
    def dot(s, x, y, c, r=1.6, o=1):
        s.lista.append((x, y, c, round(r*1.7, 2), o))
        s.pts.setdefault((c, round(r*2,1), o), []).append(f"M{x:.1f} {y:.1f}h{round(r*1.7,1)}v{round(r*1.7,1)}h-{round(r*1.7,1)}z")
    def j(s, v=3): return random.uniform(-v, v)
    def line(s, a, b, n, c, jit=3, r=1.6):
        for _ in range(n):
            t = random.random()
            s.dot(a[0]+(b[0]-a[0])*t+s.j(jit), a[1]+(b[1]-a[1])*t+s.j(jit), c, r)
    def ring(s, cx, cy, R, n, c, jit=3, r=1.6, a0=0, a1=2*math.pi):
        for _ in range(n):
            a = random.uniform(a0, a1)
            s.dot(cx+R*math.cos(a)+s.j(jit), cy+R*math.sin(a)+s.j(jit), c, r)
    def disk(s, cx, cy, R, n, c, r=1.6):
        for _ in range(n):
            a = random.uniform(0, 2*math.pi); d = R*math.sqrt(random.random())
            s.dot(cx+d*math.cos(a), cy+d*math.sin(a), c, r)
    def box(s, x, y, w, h, n, c, jit=2):
        per = 2*(w+h)
        for _ in range(n):
            p = random.uniform(0, per)
            if p < w: px, py = x+p, y
            elif p < w+h: px, py = x+w, y+p-w
            elif p < 2*w+h: px, py = x+w-(p-w-h), y+h
            else: px, py = x, y+h-(p-2*w-h)
            s.dot(px+s.j(jit), py+s.j(jit), c)
    def fillbox(s, x, y, w, h, n, c, r=1.6):
        for _ in range(n): s.dot(random.uniform(x, x+w), random.uniform(y, y+h), c, r)
    def dust(s, n, x0=0, y0=0, x1=1440, y1=900):
        for _ in range(n): s.dot(random.uniform(x0, x1), random.uniform(y0, y1), CINZA, 1.2, 0.7)
    def raw(s, t): s.el.append(t)
    def text(s, x, y, t, size=18, c=TXT2, w=400, anchor="start", lh=None, width=None):
        lines = [t]
        if width:
            lines, cur = [], ""
            for word in t.split():
                tryl = (cur+" "+word).strip()
                if len(tryl)*size*0.52 > width and cur: lines.append(cur); cur = word
                else: cur = tryl
            lines.append(cur)
        lh = lh or size*1.2
        for i, l in enumerate(lines):
            s.el.append(f'<text x="{x}" y="{y+i*lh+size:.1f}" font-family="Inter" font-size="{size}" font-weight="{w}" fill="{c}" text-anchor="{anchor}">{l}</text>')
        return y+len(lines)*lh
    def card(s, x, y, w, h, borda="#e5e5ea", lw=1.5, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        s.el.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="#ffffff" stroke="{borda}" stroke-width="{lw}"{d}/>')
    def svg(s):
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900"><rect width="1440" height="900" fill="#ffffff"/>' + "".join(f'<path d="{"".join(v)}" fill="{c}" opacity="{o}"/>' for (c,w,o),v in s.pts.items()) + "".join(s.el) + "</svg>"

FONT = {"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["111","001","111","100","111"],
"3":["111","001","111","001","111"],"4":["101","101","111","001","001"],"5":["111","100","111","001","111"],
"6":["111","100","111","101","111"],"7":["111","001","001","001","001"],"8":["111","101","111","101","111"],
"9":["111","101","111","001","111"],".":["0","0","0","0","1"],"-":["000","000","111","000","000"],"Σ":["111","100","010","100","111"]}
def numero(s, x, y, txt, cel, c, dens=4):
    for ch in txt:
        g = FONT[ch]
        for r, row in enumerate(g):
            for k, v in enumerate(row):
                if v == "1":
                    for _ in range(dens):
                        s.dot(x+k*cel+random.uniform(0, cel*0.8), y+r*cel+random.uniform(0, cel*0.8), c, 1.5)
        x += (len(g[0])+1)*cel
    return x

def lado(s, eti, tit, corpo):
    s.text(120, 330, eti, 14, AQUAD, 600)
    y = s.text(120, 360, tit, 44, TXT, 600, lh=53, width=440)
    s.text(120, y+24, corpo, 18, TXT2, lh=22, width=420)

def nota(s, t): s.text(720, 850, t, 14, TXT3, anchor="middle")

telas = {}
escolhidas = {}
N1 = ("01 · Aprenda o conceito", "Tudo começa num neurônio.",
      "Ele recebe entradas, multiplica cada uma por um peso (verde é positivo, vermelho é negativo) e soma tudo. Os tutoriais explicam isso antes de você montar.")

# ---------- NEURÔNIO ----------
s = S(1); lado(s, *N1); s.dust(140, 600, 60, 1400, 820)
cx, cy = 980, 520
s.line((cx-20, cy+150), (cx+20, cy+150), 40, TXT3)
s.line((cx, cy-40), (cx-25, cy+150), 60, TXT3); s.line((cx, cy-40), (cx+25, cy+150), 60, TXT3)
s.line((cx-280, cy-10), (cx+280, cy-70), 260, TXT3, 2)  # travessão inclinado
s.line((cx-280, cy-10), (cx-280, cy+80), 40, CINZA); s.line((cx+280, cy-70), (cx+280, cy+20), 40, CINZA)
s.ring(cx-280, cy+90, 70, 120, CINZA, 2, a0=0, a1=math.pi); s.disk(cx-280, cy+125, 45, 260, VERDE)
s.ring(cx+280, cy+30, 70, 120, CINZA, 2, a0=0, a1=math.pi); s.disk(cx+280, cy+55, 30, 120, VERM)
s.ring(cx, cy-170, 70, 260, AQUA); numero(s, cx-18, cy-192, "Σ", 9, AQUAD, 5)
s.line((cx, cy-100), (cx, cy-40), 30, AQUA)
nota(s, "Versão A · Balança: os pesos verdes e vermelhos pesam de cada lado; o neurônio em cima é a soma.")
telas["Neurônio A · balança dos pesos"] = s.svg()

s = S(2); lado(s, *N1); s.dust(200, 560, 40, 1440, 860)
cx, cy = 1050, 450
s.disk(cx, cy, 210, 900, AQUA, 1.4); s.ring(cx, cy, 215, 500, AQUAD, 2)
for i, (ang, c) in enumerate([(-0.45, VERDE), (0, VERM), (0.45, VERDE)]):
    sx, sy = 600, cy + math.tan(ang)*450
    for k in range(140):
        t = random.random()**0.6
        x = sx + (cx-210-sx)*t; y = sy + (cy-sy)*t*0.85
        s.dot(x+s.j(2), y+s.j(2+8*(1-t)), c, 1.2+1.2*t)
s.line((cx+215, cy), (1420, cy), 180, AZUL, 2, 2.2)
nota(s, "Versão B · Lupa no neurônio: ele ocupa a tela; as entradas chegam como cometas e sai um feixe só.")
telas["Neurônio B · neurônio gigante com cometas"] = s.svg()
escolhidas["neuronio"] = s.lista

s = S(3); lado(s, *N1); s.dust(120, 600, 60, 1400, 820)
cx, cy = 1080, 560
ins = [("0.8", 300, VERDE), ("1.2", 460, VERM), ("0.5", 620, VERDE)]
for t, y, c in ins:
    numero(s, 640, y-20, t, 8, TXT2, 4)
    s.line((720, y), (cx-90, cy), 130, c)
s.ring(cx, cy, 90, 300, AQUA); numero(s, cx-18, cy-22, "Σ", 9, AQUAD, 5)
s.ring(cx, cy-230, 120, 260, CINZA, 2, a0=math.pi, a1=2*math.pi)
s.ring(cx, cy-230, 120, 200, AQUA, 2, a0=math.pi, a1=math.pi*1.72)
s.line((cx, cy-230), (cx+70, cy-310), 60, AQUAD, 1.5)
s.line((cx, cy-90), (cx, cy-230), 40, CINZA, 2)
numero(s, cx-30, cy-200, "0.7", 7, AQUAD, 4)
nota(s, "Versão C · Mostrador: números entram, o neurônio soma e o ponteiro mostra quanto ele acendeu.")
telas["Neurônio C · mostrador da saída"] = s.svg()

# ---------- CAMADAS ----------
C = ("02 · Monte com as mãos", "Junte neurônios em camadas.",
     "No laboratório você arrasta camadas, liga as conexões e monta a sua própria rede.")
def cursor(s, x, y):
    pts = [(0,0),(0,18),(4,14),(7,21),(10,20),(7,13),(13,13)]
    s.raw('<polygon points="' + " ".join(f"{x+a*2},{y+b*2}" for a,b in pts) + f'" fill="{TXT}" stroke="#fff" stroke-width="2"/>')

s = S(4); lado(s, *C); s.dust(100, 600, 60, 1400, 820)
cols = [(660, 3), (830, 4), (1000, 4), (1260, 2)]
for i, (x, n) in enumerate(cols):
    h = n*95+30; y = 450-h/2 + (-60 if i == 3 else 0)
    cor = AQUA if i < 3 else AQUAD
    s.box(x-50, y, 100, h, 220, cor if i < 3 else CINZA)
    for k in range(n): s.disk(x, y+60+k*95, 22, 90, cor)
s.box(1110, 450-110, 100, 220, 120, CINZA, 1)  # encaixe fantasma
for k in range(2): s.disk(1160, 450-50+k*95, 18, 40, CINZA)
s.line((1210, 360), (1240, 340), 20, CINZA, 2)
cursor(s, 1290, 420)
nota(s, "Versão A · Blocos: cada camada é uma peça; a última está sendo arrastada até o encaixe.")
telas["Camadas A · peças sendo encaixadas"] = s.svg()

s = S(5); lado(s, *C)
for gx in range(620, 1420, 40):
    for gy in range(140, 800, 40): s.dot(gx, gy, "#e5e5ea", 1.4)
cols = [(700, 3), (880, 4), (1060, 4), (1240, 2)]
pos = []
for x, n in cols:
    ys = [450-(n-1)*55+k*110 for k in range(n)]; pos.append([(x, y) for y in ys])
for a, b in zip(pos, pos[1:]):
    for p in a:
        for q in b:
            if not (q == pos[3][1] and a is pos[2]): s.line(p, q, 22, CINZA, 1.5, 1.2)
for L in pos:
    for (x, y) in L:
        s.box(x-26, y-26, 52, 52, 90, AQUA, 1.5); s.fillbox(x-18, y-18, 36, 36, 40, AQUA, 1.3)
x, y = pos[3][1]; s.line(pos[2][2], (x-60, y+40), 60, AQUAD, 1.5, 1.6)
cursor(s, x-70, y+30)
nota(s, "Versão B · Bancada: a grade do laboratório no fundo e a mão ligando a última conexão.")
telas["Camadas B · bancada com a mão ligando"] = s.svg()
escolhidas["bancada"] = s.lista

s = S(6); lado(s, *C)
base = 720; s.line((620, base), (1400, base), 300, CINZA, 1.5)
nomes = ["entrada", "oculta", "oculta", "saída"]
for i, n in enumerate([3, 4, 4, 2]):
    x = 700+i*190
    for k in range(n): s.disk(x, base-60-k*120, 45, 220, AQUA if i < 3 else AZUL)
    for k in range(n-1): s.line((x, base-105-k*120), (x, base-135-k*120), 15, AQUAD, 2)
    s.text(x, base+20, nomes[i], 14, TXT3, anchor="middle")
    numero(s, x-6, base+50, str(n), 6, AQUAD, 3)
s.fillbox(1250, 120, 40, 50, 40, CINZA)
s.line((1270, 170), (1270, 250), 30, CINZA, 3)
nota(s, "Versão C · Torres: cada camada é uma pilha de neurônios; a altura mostra quantos ela tem.")
telas["Camadas C · torres de neurônios"] = s.svg()

# ---------- NÚMEROS ----------
V = ("03 · Veja por dentro", "Siga cada número até a resposta.",
     "Rode passo a passo e acompanhe cada número atravessando a rede, de camada em camada, até virar a resposta.")
s = S(7); lado(s, *V)
path = [(620, 600), (780, 380), (960, 560), (1140, 320), (1360, 470)]
for a, b in zip(path, path[1:]): s.line(a, b, 160, CINZA, 3, 1.3)
for (x, y), t, c in zip(path, ["0.8", "1.6", "0.3", "2.1", "0.9"], [TXT3, AZUL, AZUL, AZUL, AQUAD]):
    s.disk(x, y, 14, 60, c); numero(s, x-30, y-80, t, 9, c, 5)
s.disk(1360, 470, 40, 200, AQUA)
nota(s, "Versão A · Rio de números: o próprio número viaja e muda a cada camada até a resposta.")
telas["Números A · o número viajando e mudando"] = s.svg()

s = S(8); lado(s, *V); s.dust(80, 600, 60, 1400, 820)
cols = [(680, 3), (860, 4), (1040, 4), (1220, 2)]
pos = [[(x, 450-(n-1)*70+k*140) for k in range(n)] for x, n in cols]
for a, b in zip(pos, pos[1:]):
    for p in a:
        for q in b: s.line(p, q, 14, "#e5e5ea", 1.5, 1.2)
for L in pos:
    for p in L: s.ring(p[0], p[1], 18, 40, CINZA, 1.5)
lx, ly, R = 960, 430, 150
s.disk(lx, ly, R, 260, "#eef9fb", 2)
for a in pos[1]+pos[2]:
    if (a[0]-lx)**2+(a[1]-ly)**2 < (R-20)**2: s.disk(a[0], a[1], 22, 80, AZUL)
numero(s, lx-48, ly-25, "0.42", 9, AQUAD, 5)
s.ring(lx, ly, R, 500, AQUAD, 2, 2)
s.line((lx+R*0.7, ly+R*0.7), (lx+R*0.7+120, ly+R*0.7+120), 200, AQUAD, 6, 2)
nota(s, "Versão B · Lupa: a rede fica apagada e a lupa mostra o número que está passando por dentro.")
telas["Números B · lupa na rede"] = s.svg()
escolhidas["lupa"] = s.lista

s = S(9); lado(s, *V)
vals = [[0.9, 0.2, 0.6], [0.4, 0.8, 0.1, 0.7], [0.3, 0.9, 0.5, 0.2], [0.85, 0.15]]
for i, col in enumerate(vals):
    x = 660+i*190
    for k, v in enumerate(col):
        y = 450-len(col)*60+k*120
        aceso = i <= 2
        s.box(x, y, 100, 100, 120, CINZA if not aceso else AQUA, 1.5)
        if aceso: s.fillbox(x+6, y+6, 88, 88, int(320*v), AZUL, 1.5)
        else: s.fillbox(x+6, y+6, 88, 88, 25, CINZA, 1.3)
s.line((1015, 150), (1015, 760), 260, AQUAD, 2, 1.4)
nota(s, "Versão C · Mapa de calor: cada quadrado é um neurônio; quanto mais cheio, maior o número. A faixa varre a rede.")
telas["Números C · mapa de calor varrendo"] = s.svg()

# ---------- COMO FUNCIONA ----------
CF = [("01", "Aprenda o conceito", "Tutoriais curtos e visuais explicam a ideia antes de você colocar a mão na massa."),
      ("02", "Monte com as mãos", "Arraste camadas e neurônios, ligue as conexões e crie a sua própria rede no laboratório."),
      ("03", "Veja por dentro", "Rode passo a passo e acompanhe cada número atravessando a rede até virar a resposta.")]
def topo(s, eti, tit):
    s.text(720, 110, eti, 14, AQUAD, 600, anchor="middle"); s.text(720, 138, tit, 44, TXT, 600, anchor="middle")
def cards3(s, y=330, destaque=None):
    for i, (n, t, d) in enumerate(CF):
        x = 120+i*410
        s.card(x, y, 380, 280, AQUA if destaque == i else "#e5e5ea", 2 if destaque == i else 1.5)
        s.text(x+30, y+30, n, 14, AQUAD, 600); s.text(x+30, y+60, t, 22, TXT, 600)
        s.text(x+30, y+100, d, 16, TXT2, lh=22, width=320)

s = S(10); topo(s, "Como funciona", "Do conceito à prática em três passos.")
s.dust(150)
pts = [(310, 290), (720, 660), (1130, 290)]
for a, b in zip([(80, 470)]+pts, pts+[(1380, 470)]):
    s.line(a, b, 220, AQUA, 3, 1.6)
for p in pts: s.disk(p[0], p[1], 16, 70, AQUAD)
cards3(s)
nota(s, "Versão A · Trilha: as partículas viram um caminho que costura os três passos, por trás dos cards normais.")
telas["Como funciona A · trilha ligando os passos"] = s.svg()

s = S(11); topo(s, "Como funciona", "Do conceito à prática em três passos.")
s.dust(120)
for i, n in enumerate(["01", "02", "03"]):
    numero(s, 120+i*410+120, 230, n, 14, AQUA if i == 1 else CINZA, 6)
cards3(s, 400, 1)
nota(s, "Versão B · Números grandes: as partículas escrevem 01, 02, 03 acima dos cards; o passo da vez fica aceso.")
telas["Como funciona B · números grandes em partículas"] = s.svg()

def como_funciona_c(ativo):
  s = S(12); topo(s, "Como funciona", "Do conceito à prática em três passos.")
  s.dust(100)
  for i, (n, cor) in enumerate([(900, AQUA) if i == ativo else (160, CINZA) for i in range(3)]):
      x = 120+i*410
      for _ in range(n):
          a = random.uniform(0, 2*math.pi); d = random.uniform(0, 1)**0.5
          s.dot(x+190+math.cos(a)*(230+90*d), 470+math.sin(a)*(170+70*d), cor, 1.6)
  cards3(s, 330, 1)
  nota(s, "Versão C · Brilho: a nuvem se junta em volta do card do passo que está na tela; os outros ficam com pouca poeira.")
  return s
s = como_funciona_c(1)
telas["Como funciona C · nuvem em volta do card da vez"] = s.svg()

# ---------- EXPLORE ----------
def explore_cards(s, dash=False):
    s.card(120, 250, 1200, 200, AQUA, 2)
    s.text(160, 285, "Disponível", 14, AQUAD, 600); s.text(160, 310, "Redes neurais", 28, TXT, 600)
    s.text(160, 360, "A base de tudo: monte camadas, treine do zero e veja cada peso mudar enquanto a rede aprende.", 17, TXT2, width=760)
    s.text(120, 510, "Feitos com redes neurais · em breve", 14, TXT3, 600)
    for x, t, d in [(120, "Busca por significado", "Feita com redes neurais: elas transformam frases em números e acham textos com o mesmo significado."),
                    (740, "RAG", "Feito com redes neurais: uma busca acha os trechos nos seus documentos e outra rede escreve a resposta.")]:
        s.card(x, 550, 580, 200, "#d1d1d6", 1.5, "6 6" if dash else None)
        s.text(x+40, 585, "Em breve", 14, TXT3, 600); s.text(x+40, 610, t, 22, TXT, 600)
        s.text(x+40, 650, d, 16, TXT2, lh=22, width=480)
TE = ("Explore", "Tudo começa nas redes neurais.")

s = S(13); topo(s, *TE)
for _ in range(500): s.dot(random.uniform(0, 1440), random.uniform(200, 820), CINZA, random.choice([1, 1.2, 2]), 0.7)
for cx, cy, R, n, c in [(1250, 240, 90, 500, AQUA), (110, 560, 60, 120, CINZA), (1330, 760, 60, 120, CINZA)]:
    s.disk(cx, cy, R, n, c)
s.line((1250, 240), (110, 560), 120, CINZA, 2, 1.2); s.line((1250, 240), (1330, 760), 80, CINZA, 2, 1.2)
explore_cards(s)
nota(s, "Versão A · Constelação: as redes neurais são a estrela acesa; os temas em breve são estrelas apagadas ligadas a ela.")
telas["Explore A · constelação dos temas"] = s.svg()

s = S(14); topo(s, *TE); s.dust(80)
for alvo in [(410, 550), (1030, 550)]:
    for k in range(4):
        a = (720+random.uniform(-200, 200), 450); m = ((a[0]+alvo[0])/2+s.j(60), 500)
        s.line(a, m, 50, AQUA, 2, 1.5); s.line(m, alvo, 50, AQUA, 2, 1.5)
explore_cards(s)
nota(s, "Versão B · Raízes: do card das redes neurais saem fios de partículas que alimentam os temas que vêm depois.")
telas["Explore B · raízes saindo das redes neurais"] = s.svg()

s = S(15); topo(s, *TE)
explore_cards(s, True)
s.fillbox(120, 550, 580, 200, 40, CINZA); s.fillbox(740, 550, 580, 200, 40, CINZA)
for x in [120, 740]:
    for _ in range(260):
        s.dot(x+random.uniform(0, 580), 550+random.uniform(0, 200)+(0 if random.random() < .5 else 0), CINZA, 1.3, 0.6)
    s.fillbox(x+10, 760, 560, 60, 120, CINZA)
s.box(120, 250, 1200, 200, 700, AQUA, 3)
nota(s, "Versão C · Em construção: o card disponível fica pronto e firme; os em breve ainda estão se montando, com borda tracejada.")
telas["Explore C · temas ainda se montando"] = s.svg()
escolhidas["explore"] = s.lista


# ---------- saída ----------
def do_figma(nome, ox, oy):
    """Pontos (traços redondos de comprimento 0,1) e pixels (retângulos cheios) de um SVG exportado do Figma."""
    txt = open(os.path.join(AQUI, "figma-nuvem", nome + ".svg"), encoding="utf8").read()
    pts, rects = [], []
    for m in re.finditer(r'<path d="([^"]*)"([^>]*)/>', txt):
        d, at = m.group(1), m.group(2)
        cor = re.search(r'(?:stroke|fill)="(#[0-9A-Fa-f]{6})"', at).group(1).upper()
        op = re.search(r'(?:stroke|fill)-opacity="([\d.]+)"', at)
        op = float(op.group(1)) if op else 1.0
        if "stroke-width" in at:
            w = float(re.search(r'stroke-width="([\d.]+)"', at).group(1))
            for x, y in re.findall(r"M([\d.]+) ([\d.]+)H", d):
                pts.append((float(x) + ox, float(y) + oy, cor, w * 0.85, op))
        else:  # pixel cheio: M x0 y0 H x1 V y1 H x0 V y0 Z
            for x0, y0, x1, y1 in re.findall(r"M([\d.]+) ([\d.]+)H([\d.]+)V([\d.]+)H", d):
                x0, y0, x1, y1 = map(float, (x0, y0, x1, y1))
                rects.append((min(x0, x1) + ox, min(y0, y1) + oy, abs(x1 - x0), abs(y1 - y0), cor))
    return pts, rects

formas = {
    "topo": do_figma("topo", 310, 290),
    "neuronio": (escolhidas["neuronio"], []),
    "bancada": (escolhidas["bancada"], []),
    "lupa": (escolhidas["lupa"], []),
    "claude": do_figma("claude", 200, 300),
    "card-0": (como_funciona_c(0).lista, []),
    "card-1": (como_funciona_c(1).lista, []),
    "card-2": (como_funciona_c(2).lista, []),
    "explore": (escolhidas["explore"], []),
    "aqua": do_figma("aqua", 310, 110),
}
# Tabela de estilos (cor, lado do quadradinho, transparência) para o arquivo ficar pequeno.
estilos, idx = [], {}
saida = {"quadro": [1440, 900], "estilos": estilos, "formas": {}}
for nome, (pts, rects) in formas.items():
    plano = []
    for x, y, c, lado, o in pts:
        k = (c, round(lado, 1), round(o, 2))
        if k not in idx:
            idx[k] = len(estilos); estilos.append(list(k))
        plano += [round(x, 1), round(y, 1), idx[k]]
    saida["formas"][nome] = {"pontos": plano, "pixels": [[round(v, 1) if not isinstance(v, str) else v for v in r] for r in rects]}
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
json.dump(saida, open(SAIDA, "w", encoding="utf8"), separators=(",", ":"))
print({k: len(v["pontos"]) // 3 for k, v in saida["formas"].items()}, os.path.getsize(SAIDA))
