"use client";

import { useEffect, useRef, useState } from "react";
import { AquaAnimada } from "@/components/aqua-animada";
import { lerNumero } from "@/lib/quiz/numeros";
import { NOME_DIRECAO, type Pergunta, type Resposta } from "@/lib/quiz/perguntas";
import { nomeLinha } from "@/lib/quiz/rede-quiz";
import { LETRAS } from "./comum";
import { MiniRede, Termometro } from "./RedeDesenho";

/** A cor, a Aqua com o que ela disse e o termômetro: o que a pergunta mostra no projetor. */
export function VisualDaPergunta({ p }: { p: Pergunta }) {
  if (!p.amostra && !p.termometro && !p.fala) return null;
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-black/[.08] bg-[#FAFAFA] p-4 sm:p-6">
      {(p.amostra || p.fala) && (
        <div className="flex items-center gap-4">
          {p.amostra && (
            <div className="flex flex-col items-center gap-1">
              <span className="block size-20 rounded-xl border border-black/10" style={{ background: p.amostra.cor }} />
              {p.amostra.nome && <span className="text-xs text-text-muted">{p.amostra.nome}</span>}
            </div>
          )}
          {p.fala && (
            <>
              <AquaAnimada momento="esperando" unidade={4} rotulo="A Aqua" className="shrink-0" />
              <span className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-xl font-bold">{p.fala}</span>
            </>
          )}
        </div>
      )}
      {p.termometro && <Termometro saida={p.termometro.saida} objetivo={p.termometro.objetivo} />}
    </div>
  );
}

/** A frase curta da tela do aluno: o que ele faz aqui (a pergunta inteira está no projetor). */
export function oQueResponder(p: Pergunta): string {
  const f = p.forma;
  if (f.tipo === "linha") return `A linha ${nomeLinha(f.linha)} deve…`;
  if (f.tipo === "alternativas") return `Escolha ${LETRAS.slice(0, f.opcoes.length - 1).join(", ")} ou ${LETRAS[f.opcoes.length - 1]}: as mesmas letras do projetor.`;
  const r = f.rotulo.startsWith("Soma") ? `a ${f.rotulo.toLowerCase()}` : f.rotulo.charAt(0).toLowerCase() + f.rotulo.slice(1);
  return `Digite ${r}`;
}

/**
 * Como o aluno responde, no computador dele (D3a, D3b e D3c do Figma): os botões A, B, C…; a
 * mini-rede com o lugar da resposta e o campo; ou a mini-rede com a linha e Subir, Descer, Não mudar.
 * Alternativa e linha mandam na hora; número tem o botão Enviar.
 */
export function Responder({ p, desligado, onResponder }: { p: Pergunta; desligado: boolean; onResponder: (r: Resposta) => void }) {
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const f = p.forma;

  useEffect(() => {
    if (f.tipo === "numero" && !desligado) campo.current?.focus({ preventScroll: true });
  }, [f.tipo, desligado]);

  const enviarNumero = () => {
    const n = lerNumero(valor);
    if (n === null) return setAviso("Digite um número. Use vírgula; pode ser negativo (−).");
    onResponder({ tipo: "numero", valor: n });
  };

  if (f.tipo === "alternativas")
    return (
      <div className="flex flex-col gap-3">
        {f.opcoes.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={desligado}
            onClick={() => onResponder({ tipo: "alternativa", indice: i })}
            className="flex min-h-20 items-center gap-5 rounded-2xl border-2 border-black/10 bg-white px-5 py-4 text-left text-xl font-semibold hover:border-aqua-ink hover:bg-aqua-50 disabled:opacity-50 disabled:hover:border-black/10 disabled:hover:bg-white"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-text text-2xl font-bold text-white">{LETRAS[i]}</span>
            {o.texto}
          </button>
        ))}
        <p className="text-sm text-text-muted">Clique numa resposta. Não dá para mudar depois.</p>
      </div>
    );

  if (f.tipo === "linha")
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[20px] border border-black/[.08] bg-[#FAFAFA] p-4">
          <MiniRede linha={f.linha} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="O número do peso deve">
          {(["sobe", "desce", "nao-muda"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              disabled={desligado}
              onClick={() => onResponder({ tipo: "linha", escolha: dir })}
              className="flex h-20 items-center justify-center gap-3 rounded-2xl border-2 border-black/10 bg-white text-xl font-bold hover:border-aqua-ink hover:bg-aqua-50 disabled:opacity-50 disabled:hover:border-black/10 disabled:hover:bg-white"
            >
              <span aria-hidden className="text-2xl">{dir === "sobe" ? "↑" : dir === "desce" ? "↓" : "="}</span>
              {NOME_DIRECAO[dir]}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {f.alvo && (
        <div className="rounded-[20px] border border-black/[.08] bg-[#FAFAFA] p-4">
          <MiniRede neuronio={f.alvo.id} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-text-muted">
          {f.rotulo}
          <input
            ref={campo}
            inputMode="decimal"
            autoComplete="off"
            value={valor}
            disabled={desligado}
            onChange={(e) => {
              setValor(e.target.value.replace(/[^0-9,.\-−]/g, "").slice(0, 8));
              setAviso(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && enviarNumero()}
            placeholder="0,00"
            className="h-16 rounded-2xl border-2 border-aqua-ink px-5 text-3xl font-bold text-text tabular-nums outline-none focus:ring-4 focus:ring-aqua/30"
          />
        </label>
        <button
          type="button"
          disabled={desligado || valor.trim() === ""}
          onClick={enviarNumero}
          className="h-16 rounded-full bg-text px-12 text-lg font-bold text-white hover:opacity-90 disabled:opacity-30"
        >
          Enviar
        </button>
      </div>
      <p className="text-[15px] text-text-muted">Use vírgula e arredonde em 2 casas (0,36); pode ser negativo (−). Enter também envia.</p>
      {aviso && <p className="text-sm font-semibold text-[#B84040]">{aviso}</p>}
    </div>
  );
}
