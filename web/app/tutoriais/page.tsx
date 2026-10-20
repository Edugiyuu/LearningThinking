import { Aqua } from "@/components/mascote";
import { TopoSite } from "@/components/topo-site";
import { ProgressoDaTrilha, Trilha } from "@/components/tutoriais/Trilha";
import { tutoriais, tutoriaisEmBreve } from "@/lib/tutoriais";

// Lista de tutoriais, igual ao frame "Tutoriais · Desktop" do Figma.

const outrosTemas = [
  {
    titulo: "Busca por significado",
    texto: "Os tutoriais chegam junto com a aba no laboratório.",
    selo: "bg-ciano/15 text-ciano-ink",
  },
  {
    titulo: "RAG",
    texto: "Como uma IA consulta os seus documentos antes de responder.",
    selo: "bg-verde/15 text-verde-ink",
  },
];

function AquaDormindo({ unidade }: { unidade: number }) {
  return (
    <div className="flex shrink-0 items-start" aria-hidden>
      <Aqua pose="dormindo" unidade={unidade} />
      <span className="-mt-3 ml-0.5 text-xs font-semibold text-text-subtle">
        z<sup className="text-[9px]">z</sup>
      </span>
    </div>
  );
}

export default function Tutoriais() {
  const minutos = tutoriais.reduce((s, t) => s + t.minutos, 0);
  return (
    <>
      <TopoSite ativo="tutoriais" />

      <main className="flex-1">
        <section className="flex flex-col items-center px-4 pt-12 text-center sm:px-6 sm:pt-16">
          <span className="rounded-full border border-aqua/70 bg-aqua/15 px-5 py-1.5 text-[13px] font-medium text-aqua-ink">
            Tutoriais
          </span>
          <h1 className="mt-5 text-[clamp(40px,6vw,72px)] leading-[1.05] font-semibold tracking-[-0.02em]">
            Entenda antes de montar.
          </h1>
          <p className="mt-5 max-w-[680px] text-lg text-text-muted sm:text-[21px] sm:leading-[1.45]">
            Tutoriais curtos e visuais. A Aqua mostra cada conta acontecendo, e no fim você leva o que aprendeu para o
            laboratório.
          </p>
        </section>

        <section className="mx-auto mt-20 max-w-[1280px] px-4 sm:mt-24 sm:px-6 xl:px-0" aria-labelledby="trilha-redes">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 id="trilha-redes" className="text-[32px] font-semibold tracking-[-0.02em]">
                Redes neurais
              </h2>
              <p className="mt-1 text-[15px] text-text-muted">
                {tutoriais.length + tutoriaisEmBreve.length} tutoriais, na ordem. Cerca de {minutos} minutos.
              </p>
            </div>
            <ProgressoDaTrilha />
          </div>

          <Trilha />

          {tutoriaisEmBreve.map((t) => (
            <article
              key={t.numero}
              className="mt-6 flex flex-col gap-4 rounded-[var(--radius-card)] border border-dashed border-black/15 px-6 py-7 sm:flex-row sm:items-center sm:gap-8 sm:px-10"
            >
              <AquaDormindo unidade={6} />
              <div className="flex-1">
                <h3 className="text-[22px] font-semibold">
                  {t.numero} · {t.titulo}
                </h3>
                <p className="mt-1 text-[15px] text-text-muted">{t.descricao}</p>
              </div>
              <span className="self-start rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-text-muted sm:self-center">
                Em breve
              </span>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-20 max-w-[1280px] px-4 sm:px-6 xl:px-0">
          <h2 className="text-[22px] font-semibold">Outros temas</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {outrosTemas.map((t) => (
              <article
                key={t.titulo}
                className="flex items-center gap-6 rounded-[var(--radius-card)] border border-black/[.06] bg-bg-subtle px-7 py-8"
              >
                <AquaDormindo unidade={4} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{t.titulo}</h3>
                  <p className="mt-1 text-sm text-text-muted">{t.texto}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${t.selo}`}>Em breve</span>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-20 mb-14 flex w-full max-w-[1280px] items-center justify-between border-t border-black/[.06] px-4 pt-8 text-[13px] text-text-subtle sm:px-6 xl:px-0">
        <p className="flex items-center gap-2">
          <Aqua unidade={2} />
          LearningThinking · feito para quem quer entender a IA de verdade.
        </p>
        <p>© 2026</p>
      </footer>
    </>
  );
}
