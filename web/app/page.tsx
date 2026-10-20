import Image from "next/image";
import Link from "next/link";
import { Aqua, Claude } from "@/components/mascote";
import { RedeHeroi } from "@/components/rede-heroi";
import { TopoSite } from "@/components/topo-site";

// Home, igual ao frame "Home · Desktop · mascote" do Figma (ADR-0018).

const passos = [
  {
    numero: "01",
    titulo: "Aprenda o conceito",
    texto: "Tutoriais curtos e visuais explicam a ideia antes de você colocar a mão na massa.",
    ilustracao: "/ilustracoes/aprenda-o-conceito.svg",
    alt: "Aqua com uma lâmpada acesa em cima da cabeça.",
  },
  {
    numero: "02",
    titulo: "Monte com as mãos",
    texto: "Arraste camadas e neurônios, ligue as conexões e crie a sua própria rede no laboratório.",
    ilustracao: "/ilustracoes/monte-com-as-maos.svg",
    alt: "Aqua levantando um bloco de montar para encaixar numa pilha.",
  },
  {
    numero: "03",
    titulo: "Veja por dentro",
    texto: "Rode passo a passo e acompanhe cada número atravessando a rede até virar a resposta.",
    ilustracao: "/ilustracoes/veja-por-dentro.svg",
    alt: "O mascote do Claude digitando num notebook e pensando na Aqua.",
  },
];

const temas = [
  {
    titulo: "Redes neurais",
    texto: "Monte camadas, treine do zero e veja cada peso mudar enquanto a rede aprende.",
    disponivel: true,
    selo: "bg-aqua/30 text-aqua-ink",
  },
  {
    titulo: "Busca por significado",
    texto: "Transforme frases em números e encontre textos com o mesmo significado.",
    disponivel: false,
    selo: "bg-ciano/15 text-ciano-ink",
  },
  {
    titulo: "RAG",
    texto: "Veja como uma IA consulta os seus documentos antes de responder.",
    disponivel: false,
    selo: "bg-verde/15 text-verde-ink",
  },
];

function Sobretitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm font-semibold text-aqua-ink">{children}</p>;
}

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-center text-[32px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-5xl">
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <TopoSite />

      <main className="flex-1">
        {/* Herói */}
        <section className="relative overflow-hidden px-4 pt-16 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute top-[420px] left-1/2 h-[640px] w-[1000px] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(94,211,219,.20), rgba(55,138,221,.05) 55%, rgba(255,255,255,0))",
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="rounded-full border border-aqua/70 bg-aqua/15 px-5 py-1.5 text-[13px] font-medium text-aqua-ink">
              Laboratório visual de IA
            </span>
            <h1 className="mt-5 text-[clamp(48px,7vw,96px)] leading-[1.05] font-semibold tracking-[-0.02em]">
              Veja a IA aprender.
            </h1>
            <p className="mt-5 max-w-[740px] text-lg text-text-muted sm:text-[21px] sm:leading-[1.5]">
              Arraste neurônios, ligue camadas e acompanhe, passo a passo, cada número atravessando uma rede neural de
              verdade até virar uma resposta.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/novo-projeto"
                className="rounded-full bg-text px-10 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Criar novo projeto
              </Link>
              <Link
                href="/tutoriais"
                className="rounded-full border border-black/15 px-10 py-4 text-base font-medium transition-colors hover:bg-black/[.03]"
              >
                Ver tutoriais
              </Link>
            </div>
          </div>
          <div className="relative mt-14">
            <RedeHeroi />
            <p className="mt-8 text-center text-[13px] font-medium text-text-subtle">
              Uma rede neural de verdade, calculada no seu navegador.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto mt-32 max-w-[1280px] px-4 sm:px-6 xl:px-0">
          <Sobretitulo>Como funciona</Sobretitulo>
          <TituloSecao>Do conceito à prática em três passos.</TituloSecao>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {passos.map((p) => (
              <article
                key={p.numero}
                className="overflow-hidden rounded-[var(--radius-card)] border border-black/[.06] bg-bg-subtle pb-10"
              >
                <Image src={p.ilustracao} alt={p.alt} width={400} height={200} unoptimized className="h-auto w-full" />
                <div className="px-8 pt-4">
                  <p className="text-sm font-semibold text-aqua-ink">{p.numero}</p>
                  <h3 className="mt-4 text-2xl font-semibold">{p.titulo}</h3>
                  <p className="mt-4 text-base text-text-muted">{p.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Explore */}
        <section className="mx-auto mt-28 max-w-[1280px] px-4 sm:px-6 xl:px-0">
          <Sobretitulo>Explore</Sobretitulo>
          <TituloSecao>Comece pelas redes neurais. O resto vem aí.</TituloSecao>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {temas.map((t) => (
              <article
                key={t.titulo}
                className={`relative min-h-[230px] rounded-[var(--radius-card)] border p-8 ${
                  t.disponivel ? "border-aqua/70 bg-aqua/[.12]" : "border-black/[.06] bg-bg-subtle"
                }`}
              >
                <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${t.selo}`}>
                  {t.disponivel ? "Disponível" : "Em breve"}
                </span>
                <div className="absolute top-8 right-8 flex items-start" aria-hidden>
                  <Aqua pose={t.disponivel ? "contente" : "dormindo"} unidade={4} />
                  {!t.disponivel && (
                    <span className="-mt-3 ml-0.5 text-xs font-semibold text-text-subtle">
                      z<sup className="text-[9px]">z</sup>
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{t.titulo}</h3>
                <p className="mt-4 text-base text-text-muted">{t.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Chamada final */}
        <section className="mx-auto mt-20 max-w-[1280px] px-4 sm:px-6 xl:px-0">
          <div
            className="relative flex flex-col items-center overflow-hidden rounded-[32px] border border-black/[.06] px-6 py-11"
            style={{ background: "linear-gradient(90deg, #E0F8F9 0%, #F5F5F7 60%, #EAF4FE 100%)" }}
          >
            <Aqua pose="contente" unidade={8} className="absolute top-1/2 left-24 hidden -translate-y-1/2 lg:block" />
            <Claude unidade={8} className="absolute top-1/2 right-24 hidden -translate-y-1/2 lg:block" />
            <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] sm:text-[44px] sm:leading-[1.2]">
              Pronto para ver por dentro?
            </h2>
            <Link
              href="/novo-projeto"
              className="mt-8 rounded-full bg-aqua px-10 py-4 text-base font-semibold text-aqua-on transition-opacity hover:opacity-90"
            >
              Criar novo projeto
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-12 mb-14 flex w-full max-w-[1280px] items-center justify-between px-4 text-[13px] text-text-subtle sm:px-6 xl:px-0">
        <p className="flex items-center gap-2">
          <Aqua unidade={2} />
          LearningThinking · feito para quem quer entender a IA de verdade.
        </p>
        <p>© 2026</p>
      </footer>
    </>
  );
}
