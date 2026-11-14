"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AquaAnimada } from "@/components/aqua-animada";
import { Aqua } from "@/components/mascote";
import { SalaDoAluno, type EstadoDoAluno } from "@/lib/quiz/aluno";
import { entrarNaSala, type LigacaoDoAluno } from "@/lib/quiz/conexao";
import { textoDaResposta, type Resposta } from "@/lib/quiz/perguntas";
import { TAMANHO_DO_CODIGO, codigoValido, juntarNomes, normalizarCodigo } from "@/lib/quiz/quiz";
import { APELIDO_MAX, limparApelido } from "@/lib/quiz/sala";
import { BarraDeTempo, ChipAssunto, ordinal, segundosAte, useAgora } from "./comum";
import { Responder, oQueResponder } from "./Responder";

// Quiz ao vivo (ADR-0034): o aluno, no computador (telas D1–D6 do Figma). A pergunta fica no
// projetor; aqui ele só responde, vendo onde a resposta entra.

type Entrada = { codigo: string; apelido: string; id: string };
const CHAVE = "quiz-aluno";

/** Guardado só nesta aba (sessionStorage): se a página recarregar, o aluno volta com o mesmo id. */
function lerGuardado(): Entrada | null {
  try {
    const x = JSON.parse(sessionStorage.getItem(CHAVE) ?? "null");
    return x && typeof x.codigo === "string" && typeof x.apelido === "string" && typeof x.id === "string" ? x : null;
  } catch {
    return null;
  }
}
const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function QuizAluno() {
  // esta tela só roda no navegador (dynamic sem SSR): dá para ler o endereço e o sessionStorage aqui
  const [inicio] = useState(() => {
    const codigo = normalizarCodigo(new URLSearchParams(window.location.search).get("codigo") ?? "");
    const guardado = lerGuardado();
    // a página recarregou no meio do quiz: entra de novo sozinho (mesma sala)
    return { codigo, entrada: guardado && (!codigo || codigo === guardado.codigo) ? guardado : null };
  });
  const [entrada, setEntrada] = useState<Entrada | null>(inicio.entrada);
  const codigoDaUrl = inicio.codigo;

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE);
    setEntrada(null);
  }, []);

  if (!entrada)
    return (
      <FormEntrar
        codigoInicial={codigoDaUrl}
        onEntrar={(codigo, apelido) => {
          const guardado = lerGuardado();
          // mesmo aparelho e mesmo apelido: mantém o id (volta com os mesmos pontos)
          const e = { codigo, apelido, id: guardado?.codigo === codigo && guardado.apelido === apelido ? guardado.id : novoId() };
          sessionStorage.setItem(CHAVE, JSON.stringify(e));
          setEntrada(e);
        }}
      />
    );
  return <NaSala key={entrada.id + entrada.codigo} entrada={entrada} onSair={sair} />;
}

/* ---------- D1 · Entrar ---------- */

function FormEntrar({ codigoInicial, onEntrar }: { codigoInicial: string; onEntrar: (codigo: string, apelido: string) => void }) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [apelido, setApelido] = useState("");
  const ok = codigoValido(codigo) && limparApelido(apelido).length > 0;
  return (
    <Moldura>
      <form
        className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) onEntrar(codigo, limparApelido(apelido));
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Aqua unidade={6} />
          <p className="text-sm font-semibold text-aqua-ink">Quiz ao vivo</p>
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.02em]">Entrar numa sala</h1>
        </div>
        <CaixasDoCodigo codigo={codigo} onCodigo={setCodigo} />
        <label className="flex flex-col gap-2 text-sm font-semibold text-text-muted">
          Seu apelido
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value.slice(0, APELIDO_MAX))}
            autoFocus={!!codigoInicial}
            autoComplete="off"
            placeholder="Mari"
            className="h-14 rounded-2xl border-[1.5px] border-black/15 px-4 text-xl font-semibold text-text outline-none focus:border-aqua-ink focus:ring-4 focus:ring-aqua/30"
          />
          <span className="text-[13px] font-normal text-text-subtle">Use um apelido. Nada de nome completo. Ele aparece na tela do professor.</span>
        </label>
        <button type="submit" disabled={!ok} className="h-14 rounded-full bg-text text-[17px] font-bold text-white hover:opacity-90 disabled:opacity-30">
          Entrar
        </button>
      </form>
    </Moldura>
  );
}

/**
 * O código da sala em 6 caixas grandes, uma por letra (D1). É um campo só, por baixo das caixas:
 * colar o código inteiro e apagar funcionam como num campo comum.
 */
function CaixasDoCodigo({ codigo, onCodigo }: { codigo: string; onCodigo: (c: string) => void }) {
  const [foco, setFoco] = useState(false);
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-text-muted">
      Código da sala (está no projetor)
      <span className="relative block">
        <input
          value={codigo}
          onChange={(e) => onCodigo(normalizarCodigo(e.target.value))}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          autoFocus={!codigo}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Código da sala, 6 letras e números"
          className="absolute inset-0 z-10 w-full cursor-text opacity-0"
        />
        <span className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
          {Array.from({ length: TAMANHO_DO_CODIGO }, (_, i) => {
            const atual = foco && i === Math.min(codigo.length, TAMANHO_DO_CODIGO - 1);
            return (
              <span
                key={i}
                className={`grid h-20 place-items-center rounded-2xl border-2 bg-white font-mono text-4xl font-bold text-text ${
                  atual ? "border-aqua-ink ring-4 ring-aqua/30" : codigo[i] ? "border-aqua" : "border-black/15"
                }`}
              >
                {codigo[i] ?? ""}
              </span>
            );
          })}
        </span>
      </span>
    </label>
  );
}

/* ---------- Na sala ---------- */

type Problema = "nao-achou" | "sem-rede" | null;

function useSalaDoAluno(entrada: Entrada) {
  // a sala e a ligação com o PeerJS (que chega depois) vivem juntas enquanto a tela existe
  const [{ sala, ligacao }] = useState(() => {
    const ligacao: { atual: LigacaoDoAluno | null } = { atual: null };
    return { ligacao, sala: new SalaDoAluno(entrada.id, entrada.apelido, (m) => ligacao.atual?.enviar(m)) };
  });
  const [problema, setProblema] = useState<Problema>(null);
  const estado = useSyncExternalStore(sala.assinar, sala.estado, sala.estado);

  useEffect(() => {
    let cancelado = false;
    entrarNaSala(entrada.codigo, {
      abriu: () => {
        setProblema(null);
        sala.conectou();
      },
      recebeu: (m) => sala.recebeu(m),
      caiu: () => sala.caiu(),
      naoAchou: () => setProblema("nao-achou"),
      semRede: () => setProblema("sem-rede"),
    })
      .then((l) => {
        if (cancelado) l.fechar();
        else ligacao.atual = l;
      })
      .catch(() => setProblema("sem-rede"));
    return () => {
      cancelado = true;
      ligacao.atual?.fechar();
      ligacao.atual = null;
    };
  }, [entrada.codigo, sala, ligacao]);

  return { estado, problema, responder: (r: Resposta) => sala.responder(r) };
}

function NaSala({ entrada, onSair }: { entrada: Entrada; onSair: () => void }) {
  const { estado, problema, responder } = useSalaDoAluno(entrada);
  const e = estado;

  if (problema && e.fase !== "fim")
    return (
      <Aviso
        titulo={problema === "nao-achou" ? "Não achei essa sala" : "Sem conexão"}
        texto={
          problema === "nao-achou"
            ? `Confira o código (${entrada.codigo}) na tela do professor. Se a sala fechou, peça um código novo.`
            : "Não deu para falar com o serviço que liga você ao professor. Confira a internet e tente de novo."
        }
        botao="Voltar"
        onBotao={onSair}
      />
    );

  switch (e.fase) {
    case "conectando":
      return <Aviso titulo="Procurando a sala…" texto={`Código ${entrada.codigo}`} momento="pensando" />;
    case "caiu":
      return <Aviso titulo="A conexão caiu" texto="Tentando voltar… Você continua com os seus pontos." momento="pensando" />;
    case "recusado":
      return <Aviso titulo="Não deu para entrar" texto={e.motivo ?? ""} botao="Voltar" onBotao={onSair} />;
    case "fechada":
      return <Aviso titulo="O professor fechou a sala" texto="Nada ficou guardado. Até o próximo quiz!" botao="Sair" onBotao={onSair} />;
    case "espera":
      return <Espera e={e} />;
    case "pergunta":
    case "enviada":
      return <NaPergunta e={e} onResponder={responder} />;
    case "resultado":
      return <Resultado e={e} />;
    case "fim":
      return <Fim e={e} onSair={onSair} />;
  }
}

/* ---------- D2 · Esperando (com quem está na sala, decisão 14) ---------- */

const MOSTRAR_NA_ESPERA = 19;

function Espera({ e }: { e: EstadoDoAluno }) {
  // o próprio apelido sempre aparece, destacado
  const outros = e.turma.filter((a) => a !== e.apelido);
  const visiveis = outros.slice(0, MOSTRAR_NA_ESPERA - 1);
  const resto = outros.length - visiveis.length;
  return (
    <Moldura apelido={e.apelido}>
      <div className="mx-auto flex w-full max-w-[800px] flex-col items-center px-4 py-10 text-center sm:py-14">
        <AquaAnimada momento="esperando" unidade={9} rotulo="A Aqua acenando" />
        <h1 className="mt-6 text-[28px] font-bold tracking-[-0.02em] sm:text-4xl">Você entrou, {e.apelido}!</h1>
        <p className="mt-2 text-lg text-text-muted">{e.noMeio ? "O quiz já começou: você entra na próxima pergunta." : "Espere o professor começar."}</p>
        <div className="mt-10 w-full border-t border-black/[.08] pt-6 text-left">
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-xl font-semibold">{e.turma.length} na sala</span>
            <span className="text-sm text-text-subtle">os colegas aparecem aqui quando entram</span>
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <li className="truncate rounded-full border border-aqua bg-aqua-50 px-5 py-2.5 text-[15px] font-semibold text-aqua-on">{e.apelido} · você</li>
            {visiveis.map((a) => (
              <li key={a} className="truncate rounded-full bg-bg-subtle px-5 py-2.5 text-[15px] font-semibold">
                {a}
              </li>
            ))}
            {resto > 0 && <li className="rounded-full border border-dashed border-black/20 px-5 py-2.5 text-[15px] text-text-muted">+{resto} alunos</li>}
          </ul>
        </div>
        <p className="mt-12 text-sm text-text-subtle">As perguntas aparecem no projetor e você responde por aqui.</p>
      </div>
    </Moldura>
  );
}

/* ---------- D3 · Responder · D4 · Resposta enviada ---------- */

function NaPergunta({ e, onResponder }: { e: EstadoDoAluno; onResponder: (r: Resposta) => void }) {
  const agora = useAgora();
  const pt = e.pergunta!;
  const restante = segundosAte(pt.prazo, agora);
  const acabou = restante === 0;
  const p = pt.pergunta;

  const topo = (
    <header className="sticky top-0 z-10 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Aqua unidade={3} className="hidden sm:block" />
        <span className="font-bold tabular-nums">
          {pt.indice + 1} de {pt.perguntas}
        </span>
        <ChipAssunto assunto={p.assunto} />
        <span className="ml-auto flex items-center gap-4">
          <span className="hidden text-[15px] text-text-muted sm:inline">{e.apelido}</span>
          <span className={`w-14 text-right text-lg font-bold tabular-nums ${restante <= 5 ? "text-[#E5736F]" : ""}`}>{restante} s</span>
        </span>
      </div>
      <BarraDeTempo restante={restante} total={pt.tempo} />
    </header>
  );

  if (e.fase === "enviada")
    return (
      <div className="flex min-h-dvh flex-col">
        {topo}
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <AquaAnimada momento="pensando" unidade={8} rotulo="A Aqua pensando" />
          <h1 className="text-3xl font-bold">Resposta enviada ✓</h1>
          <p className="text-text-muted">Você respondeu:</p>
          <p className="rounded-2xl bg-bg-subtle px-6 py-3 text-2xl font-bold">{textoDaResposta(p, e.resposta)}</p>
          <p className="mt-4 text-text-muted">Esperando o tempo acabar…</p>
          {e.progresso && (
            <p className="text-sm text-text-subtle">
              {e.progresso.responderam} de {e.progresso.de} já responderam
            </p>
          )}
        </main>
      </div>
    );

  return (
    <div className="flex min-h-dvh flex-col">
      {topo}
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <p className="text-[15px] font-semibold text-aqua-ink">A pergunta está no projetor. Aqui você responde.</p>
          <h1 className="mt-1 text-[28px] leading-snug font-semibold">{oQueResponder(p)}</h1>
        </div>
        {acabou && <p className="rounded-xl bg-[#FFF4E8] px-4 py-3 font-semibold text-[#CE6A1F]">O tempo acabou. Espere o resultado.</p>}
        <Responder p={p} desligado={acabou} onResponder={onResponder} />
      </main>
    </div>
  );
}

/* ---------- D5 · Certo ou errado (sem a explicação: ela fica no projetor, decisão 10) ---------- */

function Resultado({ e }: { e: EstadoDoAluno }) {
  const r = e.resultado!;
  return (
    <Moldura apelido={e.apelido} contador={`${r.indice + 1} de ${r.perguntas}`}>
      <div className={`flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center ${r.certo ? "bg-[#EAF7F0]" : ""}`}>
        <AquaAnimada key={String(r.certo)} momento={r.certo ? "certa" : "duvida"} unidade={10} rotulo={r.certo ? "A Aqua comemorando" : "A Aqua em dúvida"} />
        <h1 className={`mt-4 text-4xl font-bold ${r.certo ? "text-[#1E7A47]" : ""}`}>{r.certo ? "Certo!" : "Não foi dessa vez"}</h1>
        <p className={`text-2xl font-bold ${r.certo ? "text-[#1E9E5A]" : "text-text-muted"}`}>{r.certo ? "+1000" : "0 pontos"}</p>
        <p className="text-lg text-text-muted">
          Total {r.pontos} · {ordinal(r.posicao)} lugar{r.empatados > 0 ? `, empate com mais ${r.empatados}` : ""}
        </p>
        <p className="mt-6 text-sm text-text-subtle">Olhe o projetor para ver a conta.</p>
      </div>
    </Moldura>
  );
}

/* ---------- D6 · Fim ---------- */

function Fim({ e, onSair }: { e: EstadoDoAluno; onSair: () => void }) {
  const f = e.fim!;
  return (
    <Moldura apelido={e.apelido} contador="Fim do quiz">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <AquaAnimada momento="certa" unidade={10} rotulo="A Aqua comemorando" />
        <h1 className="mt-4 text-4xl font-bold">Fim!</h1>
        <p className="text-lg text-text-muted">Você ficou em</p>
        <p className="text-6xl font-bold text-aqua-ink">{ordinal(f.posicao)}</p>
        {f.empatadosCom.length > 0 && <p className="text-text-muted">empate com {juntarNomes(f.empatadosCom.slice(0, 3))}{f.empatadosCom.length > 3 ? ` e mais ${f.empatadosCom.length - 3}` : ""}</p>}
        <p className="mt-2 text-lg font-semibold">
          {f.acertos} de {f.perguntas} certas · {f.pontos}
        </p>
        <button type="button" onClick={onSair} className="mt-8 rounded-full border border-black/15 px-10 py-3 font-semibold hover:bg-black/[.03]">
          Sair
        </button>
      </div>
    </Moldura>
  );
}

/* ---------- Moldura e avisos ---------- */

function Moldura({ children, apelido, contador }: { children: React.ReactNode; apelido?: string; contador?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-black/[.06]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="LearningThinking, início">
            <Aqua unidade={4} />
            <span className="hidden text-[15px] font-bold sm:inline">LearningThinking</span>
          </Link>
          {contador && <span className="font-bold">{contador}</span>}
          {apelido && <span className="ml-auto text-[15px] font-semibold">{apelido}</span>}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function Aviso({ titulo, texto, botao, onBotao, momento = "duvida" }: { titulo: string; texto: string; botao?: string; onBotao?: () => void; momento?: "pensando" | "duvida" }) {
  return (
    <Moldura>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <AquaAnimada momento={momento} unidade={8} rotulo="A Aqua" />
        <h1 className="mt-4 text-3xl font-bold">{titulo}</h1>
        <p className="max-w-md text-text-muted">{texto}</p>
        {botao && (
          <button type="button" onClick={onBotao} className="mt-6 rounded-full bg-text px-10 py-3 font-semibold text-white hover:opacity-90">
            {botao}
          </button>
        )}
      </div>
    </Moldura>
  );
}
