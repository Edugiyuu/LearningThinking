import Link from "next/link";
import { Aqua } from "@/components/mascote";
import { TopoSite } from "@/components/topo-site";
import { NuvemParticulas } from "@/components/nuvem-particulas";

// Home com rolagem (ADR-0038, atualização 4). Cada seção é um quadro do Figma (página
// "Home com rolagem (partículas)") de 1440 px de largura: os números de posição e tamanho abaixo
// são os do quadro, em pixels. No computador, o quadro escala com a largura da tela; no celular,
// a mesma marcação vira uma coluna e a nuvem fica atrás do texto.
// A nuvem de partículas (components/nuvem-particulas.tsx) desenha a forma de cada data-forma.

const passos = [
  {
    numero: "01",
    titulo: "Aprenda o conceito",
    texto:
      "Tutoriais curtos e visuais explicam a ideia antes de você colocar a mão na massa.",
  },
  {
    numero: "02",
    titulo: "Monte com as mãos",
    texto:
      "Arraste camadas e neurônios, ligue as conexões e crie a sua própria rede no laboratório.",
  },
  {
    numero: "03",
    titulo: "Veja por dentro",
    texto:
      "Rode passo a passo e acompanhe cada número atravessando a rede até virar a resposta.",
  },
];

// Os três temas usam redes neurais; cada um tem o nome do que a rede faz (ADR-0035, B8)
const base = {
  titulo: "Classificar",
  texto:
    "Comece por aqui: monte a rede, treine do zero e veja cada peso mudar enquanto ela aprende a decidir entre duas respostas.",
};

const feitosComRedes = [
  {
    titulo: "Busca por significado",
    texto:
      "A rede transforma frases em números (embeddings) e acha textos com o mesmo significado.",
  },
  {
    titulo: "RAG",
    texto:
      "Uma rede acha os trechos nos seus documentos e outra escreve a resposta.",
  },
];

// 01, 02 e 03: texto à esquerda e, atrás, o quadro inteiro onde as partículas formam o desenho.
const secoesDaRolagem = [
  {
    forma: "neuronio",
    sobretitulo: "01 · Aprenda o conceito",
    titulo: "Tudo começa num neurônio.",
    texto:
      "Ele recebe entradas, multiplica cada uma por um peso (verde é positivo, vermelho é negativo) e soma tudo. Os tutoriais explicam isso antes de você montar.",
  },
  {
    forma: "bancada",
    sobretitulo: "02 · Monte com as mãos",
    titulo: "Junte neurônios em camadas.",
    texto:
      "No laboratório você arrasta camadas, liga as conexões e monta a sua própria rede.",
  },
  {
    forma: "lupa",
    sobretitulo: "03 · Veja por dentro",
    titulo: "Siga cada número até a resposta.",
    texto:
      "Rode passo a passo e acompanhe cada número atravessando a rede, de camada em camada, até virar a resposta.",
  },
];

/** Posição e tamanho em pixels do quadro de 1440 px (viram cqw: 1440 px = 100cqw). */
type Medidas = {
  x?: number;
  y: number;
  w?: number;
  h?: number;
  fs?: number;
  lh?: number;
};
const cq = (px: number) => `${(px / 14.4).toFixed(4)}cqw`;
function noQuadro({ x = 0, y, w, h, fs, lh }: Medidas): React.CSSProperties {
  return {
    "--x": cq(x),
    "--y": cq(y),
    "--w": w === undefined ? "auto" : cq(w),
    "--h": h === undefined ? "auto" : cq(h),
    "--fs": fs === undefined ? "inherit" : cq(fs),
    "--lh": lh === undefined ? "1.21" : String(lh),
  } as React.CSSProperties;
}

/** A área do quadro onde a nuvem desenha (no celular, uma faixa com a proporção do quadro, embaixo). */
function AreaDaForma({
  forma,
  alturaQuadro = 900,
  deslocaY = 0,
  variantes,
}: {
  forma: string;
  alturaQuadro?: number;
  deslocaY?: number;
  variantes?: string;
}) {
  return (
    <div
      data-forma={forma}
      data-variantes={variantes}
      data-altura={alturaQuadro}
      data-desloca-y={deslocaY}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 lg:inset-0"
      style={{ aspectRatio: `1440 / ${alturaQuadro}` }}
    />
  );
}

export default function Home() {
  return (
    <>
      <NuvemParticulas />
      {/* O menu fica fora da rolagem suave e preso no topo (ADR-0038, atualização 8) */}
      <TopoSite fixo />
      {/* Rolagem suave do GSAP (ScrollSmoother): a página desliza dentro destas duas caixas (ADR-0038, atualização 7) */}
      <div id="rolagem-suave">
        <div id="rolagem-suave-conteudo">
          <div aria-hidden className="h-20" />

          <main className="relative z-[1] flex-1">
            {/* Topo: o título, o texto e os botões da primeira versão (ADR-0018), e embaixo o campo de
                partículas com a Aqua do quadro "1 · Topo" (ADR-0038, atualização 11) */}
            <section className="relative overflow-hidden pt-16">
              <div
                aria-hidden
                className="pointer-events-none absolute top-[420px] left-1/2 h-[640px] w-[1000px] -translate-x-1/2"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(94,211,219,.20), rgba(55,138,221,.05) 55%, rgba(255,255,255,0))",
                }}
              />
              <div className="relative flex flex-col items-center px-4 text-center sm:px-6">
                <span
                  data-afastar
                  className="rounded-full border border-aqua/70 bg-aqua/15 px-5 py-1.5 text-[13px] font-medium text-aqua-ink"
                >
                  Laboratório visual de IA
                </span>
                <h1
                  data-afastar
                  className="mt-5 text-[clamp(48px,7vw,96px)] leading-[1.05] font-semibold tracking-[-0.02em]"
                >
                  Veja a IA aprender.
                </h1>
                <p
                  data-afastar
                  className="mt-5 max-w-[740px] text-lg text-text-muted sm:text-[21px] sm:leading-[1.5]"
                >
                  Arraste neurônios, ligue camadas e acompanhe, passo a passo,
                  cada número atravessando uma rede neural de verdade até virar
                  uma resposta.
                </p>
                <div className="mt-10 flex flex-wrap items-start justify-center gap-4">
                  <Link
                    data-afastar
                    href="/novo-projeto"
                    className="rounded-full bg-text px-10 py-4 text-base font-semibold text-white hover:opacity-90"
                  >
                    Criar novo projeto
                  </Link>
                  <Link
                    data-afastar
                    href="/tutoriais"
                    className="rounded-full border border-black/15 px-10 py-4 text-base font-medium hover:bg-black/[.03]"
                  >
                    Ver tutoriais
                  </Link>
                </div>
              </div>
              {/* O campo de partículas: a parte do quadro do Figma que começa em y = 290 (embaixo do texto) */}
              <div
                className="relative mx-auto w-full max-w-[1440px]"
                style={{ aspectRatio: "1440 / 620" }}
              >
                <AreaDaForma forma="topo" alturaQuadro={620} deslocaY={-290} />
              </div>
              <p
                data-afastar
                className="relative pb-6 text-center text-[13px] font-medium text-text-subtle"
              >
                Role para ver as partículas virarem uma rede ↓
              </p>
            </section>

            {/* 01, 02, 03: o neurônio com cometas, a bancada e a lupa na rede */}
            {secoesDaRolagem.map((s) => (
              <section
                key={s.forma}
                className="quadro px-4 pt-16 pb-[66vw] sm:px-6 lg:p-0"
              >
                <div data-revelar>
                  <p
                    className="q relative z-[1] text-sm font-semibold text-aqua-ink"
                    style={noQuadro({ x: 120, y: 330, fs: 14 })}
                  >
                    {s.sobretitulo}
                  </p>
                  <h2
                    className="q relative z-[1] mt-3 text-[32px] font-semibold tracking-[-0.02em]"
                    style={noQuadro({ x: 120, y: 360, w: 440, fs: 44 })}
                  >
                    {s.titulo}
                  </h2>
                  <p
                    className="q relative z-[1] mt-5 text-lg text-text-muted"
                    style={noQuadro({ x: 120, y: 490, w: 420, fs: 18 })}
                  >
                    {s.texto}
                  </p>
                </div>
                <AreaDaForma forma={s.forma} />
                {s.forma === "bancada" && (
                  // A mão (seta do mouse) ligando a última conexão: no Figma ela é um desenho cheio, não partículas.
                  <svg
                    aria-hidden
                    viewBox="-1 -1 28 44"
                    className="q relative z-[1] hidden lg:block"
                    style={noQuadro({ x: 1169, y: 534, w: 28, h: 44 })}
                  >
                    <polygon
                      points="0,0 0,36 8,28 14,42 20,40 14,26 26,26"
                      fill="#1d1d1f"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </section>
            ))}

            {/* O Claude no notebook pensando na Aqua, grande */}
            <section className="quadro px-4 pt-16 pb-[66vw] sm:px-6 lg:p-0">
              <div data-revelar>
                <p
                  className="q text-sm font-semibold text-aqua-ink"
                  style={noQuadro({ x: 120, y: 130, fs: 14 })}
                >
                  Veja por dentro
                </p>
                <h2
                  className="q mt-3 text-[32px] font-semibold tracking-[-0.02em]"
                  style={noQuadro({ x: 120, y: 160, w: 560, fs: 44 })}
                >
                  Acompanhe cada número até virar a resposta.
                </h2>
              </div>
              <div
                role="img"
                aria-label="O mascote do Claude digitando num notebook e pensando na Aqua, desenhado com partículas."
              >
                <AreaDaForma forma="claude" />
              </div>
            </section>

            {/* Como funciona: a nuvem se junta em volta do card do passo da vez */}
            <section className="quadro px-4 py-16 sm:px-6 lg:p-0">
              <p
                className="q text-center text-sm font-semibold text-aqua-ink"
                style={noQuadro({ y: 110, w: 1440, fs: 14 })}
              >
                Como funciona
              </p>
              <h2
                className="q mt-3 text-center text-[32px] font-semibold tracking-[-0.02em]"
                style={noQuadro({ y: 138, w: 1440, fs: 44 })}
              >
                Do conceito à prática em três passos.
              </h2>
              <div className="mt-10 grid gap-5 lg:contents">
                {passos.map((p, i) => (
                  <article
                    key={p.numero}
                    data-card={i}
                    className="q relative z-[1] cursor-default rounded-[18px] border-2 border-[#e5e5ea] bg-white p-6 lg:p-0"
                    style={noQuadro({
                      x: 120 + i * 410,
                      y: 330,
                      w: 380,
                      h: 280,
                    })}
                  >
                    <p
                      className="q text-sm font-semibold text-aqua-ink"
                      style={noQuadro({ x: 30, y: 30, fs: 14 })}
                    >
                      {p.numero}
                    </p>
                    <h3
                      className="q mt-3 text-[22px] font-semibold"
                      style={noQuadro({ x: 30, y: 60, fs: 22 })}
                    >
                      {p.titulo}
                    </h3>
                    <p
                      className="q mt-3 text-base text-text-muted"
                      style={noQuadro({
                        x: 30,
                        y: 100,
                        w: 320,
                        fs: 16,
                        lh: 1.375,
                      })}
                    >
                      {p.texto}
                    </p>
                  </article>
                ))}
              </div>
              {/* Uma forma só, com uma variante por card: a nuvem vai para o card do hover (ADR-0038, atualização 6) */}
              <AreaDaForma forma="card" variantes="card-0,card-1,card-2" />
            </section>

            {/* Explore: o card disponível pronto; os "em breve" ainda se montando */}
            <section className="quadro px-4 py-16 sm:px-6 lg:p-0">
              <p
                className="q text-center text-sm font-semibold text-aqua-ink"
                style={noQuadro({ y: 110, w: 1440, fs: 14 })}
              >
                Explore
              </p>
              <h2
                className="q mt-3 text-center text-[32px] font-semibold tracking-[-0.02em]"
                style={noQuadro({ y: 138, w: 1440, fs: 44 })}
              >
                Três coisas que uma rede neural faz.
              </h2>
              <article
                className="q relative z-[1] mt-10 rounded-[18px] border-2 border-aqua bg-white p-6 lg:mt-0 lg:p-0"
                style={noQuadro({ x: 120, y: 250, w: 1200, h: 200 })}
              >
                <p
                  className="q text-sm font-semibold text-aqua-ink"
                  style={noQuadro({ x: 40, y: 35, fs: 14 })}
                >
                  Disponível
                </p>
                <h3
                  className="q mt-3 text-[28px] font-semibold"
                  style={noQuadro({ x: 40, y: 60, fs: 28 })}
                >
                  {base.titulo}
                </h3>
                <p
                  className="q mt-3 text-base text-text-muted"
                  style={noQuadro({ x: 40, y: 110, w: 760, fs: 17 })}
                >
                  {base.texto}
                </p>
              </article>
              <p
                className="q mt-8 text-sm font-semibold text-text-subtle"
                style={noQuadro({ x: 120, y: 510, fs: 14 })}
              >
                Também com redes neurais · em breve
              </p>
              {feitosComRedes.map((t, i) => (
                <article
                  key={t.titulo}
                  className="q relative z-[1] mt-4 rounded-[18px] border-[1.5px] border-dashed border-[#d1d1d6] bg-white p-6 lg:mt-0 lg:p-0"
                  style={noQuadro({ x: 120 + i * 620, y: 550, w: 580, h: 200 })}
                >
                  <p
                    className="q text-sm font-semibold text-text-subtle"
                    style={noQuadro({ x: 40, y: 35, fs: 14 })}
                  >
                    Em breve
                  </p>
                  <h3
                    className="q mt-3 text-[22px] font-semibold"
                    style={noQuadro({ x: 40, y: 60, fs: 22 })}
                  >
                    {t.titulo}
                  </h3>
                  <p
                    className="q mt-3 text-base text-text-muted"
                    style={noQuadro({
                      x: 40,
                      y: 100,
                      w: 480,
                      fs: 16,
                      lh: 1.375,
                    })}
                  >
                    {t.texto}
                  </p>
                </article>
              ))}
              <AreaDaForma forma="explore" />
            </section>

            {/* Fim: a Aqua feita de partículas, com o olho feliz */}
            <section className="quadro flex flex-col items-center px-4 pt-16 pb-[66vw] sm:px-6 lg:p-0">
              <h2
                data-revelar
                className="q text-center text-3xl font-semibold tracking-[-0.02em]"
                style={noQuadro({ y: 96, w: 1440, fs: 48 })}
              >
                Pronto para ver por dentro?
              </h2>
              <Link
                href="/novo-projeto"
                className="q relative z-[1] mt-6 grid place-items-center rounded-full bg-aqua px-10 py-4 text-base font-semibold text-aqua-on hover:opacity-90 lg:mt-0 lg:px-0 lg:py-0"
                style={noQuadro({ x: 610, y: 790, w: 220, h: 56, fs: 16 })}
              >
                Criar novo projeto
              </Link>
              <div
                role="img"
                aria-label="A Aqua, desenhada com partículas, com o olho feliz."
              >
                <AreaDaForma forma="aqua" />
              </div>
            </section>
          </main>

          <footer className="relative z-[1] mx-auto mt-4 mb-14 flex w-full max-w-[1280px] items-center justify-between px-4 text-[13px] text-text-subtle sm:px-6 xl:px-0">
            <p className="flex items-center gap-2">
              <Aqua unidade={2} />
              LearningThinking · feito para quem quer entender a IA de verdade.
            </p>
            <p>© 2026</p>
          </footer>
        </div>
      </div>
    </>
  );
}
