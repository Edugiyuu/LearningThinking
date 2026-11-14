"use client";

import { useState } from "react";
import { AquaAnimada } from "@/components/aqua-animada";
import { lerNumero } from "@/lib/quiz/numeros";
import type { Pergunta, Resposta } from "@/lib/quiz/perguntas";
import { LETRAS } from "./comum";
import { RedeDesenho, Termometro } from "./RedeDesenho";

/** A cor, a Aqua com o que ela disse, o termômetro e a rede: o que a pergunta mostra. */
export function VisualDaPergunta({ p, semNumeros = false }: { p: Pergunta; semNumeros?: boolean }) {
  if (!p.amostra && !p.termometro && !p.fala) return null;
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-black/[.08] bg-[#FAFAFA] p-4 sm:p-6">
      {(p.amostra || p.fala) && (
        <div className="flex items-center gap-4">
          {p.amostra && (
            <div className="flex flex-col items-center gap-1">
              <span className="block size-14 rounded-xl border border-black/10 sm:size-20" style={{ background: semNumeros ? "#E5E5EA" : p.amostra.cor }} />
              {p.amostra.nome && !semNumeros && <span className="text-xs text-text-muted">{p.amostra.nome}</span>}
            </div>
          )}
          {p.fala && (
            <>
              <AquaAnimada momento="esperando" unidade={4} rotulo="A Aqua" className="shrink-0" />
              <span className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg font-bold">{semNumeros ? "…" : p.fala}</span>
            </>
          )}
        </div>
      )}
      {p.termometro && <Termometro saida={p.termometro.saida} objetivo={p.termometro.objetivo} semNumeros={semNumeros} />}
    </div>
  );
}

/**
 * Como o aluno responde: tocar numa alternativa, digitar o número no desenho (ou num campo) ou
 * escolher na linha. Alternativa e linha mandam na hora; número tem o botão Enviar.
 */
export function Responder({ p, desligado, onResponder }: { p: Pergunta; desligado: boolean; onResponder: (r: Resposta) => void }) {
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const f = p.forma;

  const enviarNumero = () => {
    const n = lerNumero(valor);
    if (n === null) return setAviso("Digite um número. Use vírgula; pode ser negativo (−).");
    onResponder({ tipo: "numero", valor: n });
  };

  const temVisual = !!(p.desenho || p.amostra || p.termometro || p.fala);
  const alternativas =
    f.tipo === "alternativas" ? (
      <div className="flex flex-col gap-3">
        {f.opcoes.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={desligado}
            onClick={() => onResponder({ tipo: "alternativa", indice: i })}
            className="flex min-h-16 items-center gap-4 rounded-2xl border-[1.5px] border-black/15 bg-white px-4 py-3 text-left text-[17px] font-semibold transition-colors hover:border-aqua-ink hover:bg-aqua-50 disabled:opacity-50 disabled:hover:border-black/15 disabled:hover:bg-white"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-subtle text-sm font-bold text-text-muted">{LETRAS[i]}</span>
            {o.texto}
          </button>
        ))}
        <p className="text-sm text-text-muted">Toque numa resposta. Não dá para mudar depois.</p>
      </div>
    ) : null;

  return (
    <div className={`grid gap-5 ${f.tipo === "alternativas" && temVisual ? "lg:grid-cols-[1.6fr_1fr] lg:items-start" : ""}`}>
      <div className="flex min-w-0 flex-col gap-4">
        <VisualDaPergunta p={p} />
        {p.desenho && (
          <div className="rounded-[20px] border border-black/[.08] bg-[#FAFAFA] p-2 sm:p-4">
            <RedeDesenho
              desenho={p.desenho}
              alvo={f.tipo === "numero" ? f.alvo : null}
              valor={valor}
              onValor={(v) => {
                setValor(v);
                setAviso(null);
              }}
              onEnviar={enviarNumero}
              linhaDaPergunta={f.tipo === "linha" ? f.linha : undefined}
              menuAberto={menu}
              onAbrirMenu={() => setMenu(true)}
              onEscolher={(escolha) => onResponder({ tipo: "linha", escolha })}
              desligado={desligado}
            />
          </div>
        )}
      </div>
      {alternativas}
      {f.tipo === "numero" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {f.alvo ? (
            <p className="flex-1 text-[15px] text-text-muted">
              {f.alvo.tipo === "neuronio" ? "Toque no círculo tracejado e digite." : "Toque no campo em cima da linha e digite."} Use vírgula; pode ser negativo (−). Enter também envia.
            </p>
          ) : (
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-text-muted">
              {f.rotulo}
              <input
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                value={valor}
                disabled={desligado}
                onChange={(e) => {
                  setValor(e.target.value.replace(/[^0-9,.\-−]/g, "").slice(0, 8));
                  setAviso(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && enviarNumero()}
                placeholder="0,00"
                className="h-14 rounded-2xl border-[1.5px] border-black/15 px-4 text-2xl font-bold text-text tabular-nums outline-none focus:border-aqua-ink focus:ring-4 focus:ring-aqua/30"
              />
            </label>
          )}
          <button
            type="button"
            disabled={desligado || valor.trim() === ""}
            onClick={enviarNumero}
            className="h-14 rounded-full bg-text px-10 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            Enviar
          </button>
        </div>
      )}
      {aviso && <p className="text-sm font-semibold text-[#B84040]">{aviso}</p>}
      {f.tipo === "linha" && !menu && (
        <p className="text-[15px] text-text-muted">
          {desligado ? "" : "Toque na linha destacada e escolha se o número do peso sobe, desce ou não muda."}
        </p>
      )}
    </div>
  );
}
