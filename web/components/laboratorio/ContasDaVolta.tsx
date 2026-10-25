"use client";

import type { ReactNode } from "react";
import { formatarCulpa, type LinhaDaVolta, type PassoVolta, type Sinal } from "@/lib/backward";
import { formatar, type Rodada } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

const EFEITO: Record<Sinal, string> = { "+": "mais forte", "-": "mais fraca", "=": "igual" };

export function MarcaSinal({ sinal }: { sinal: Sinal }) {
  return <b className={`sinal ${sinal === "+" ? "mais" : sinal === "-" ? "menos" : "igual"}`}>{sinal === "-" ? "−" : sinal}</b>;
}

/**
 * O painel durante a volta (ADR-0025, frame "· 4 … painel curto"): uma trilha com o símbolo de
 * cada passo que já passou, o cartão curto do passo da vez ("culpa → anda → antes → depois")
 * e, no fim, um resumo com "ver todos os pesos".
 */
export default function ContasDaVolta({ rodada, passos, atual, modo }: { rodada: Rodada; passos: PassoVolta[]; atual: number; modo: "mostrar" | "salvar" }) {
  const { rotulos } = useLab();
  // nomes curtos: "R", "neurônio 2", "Saída"
  const finais = new Set(passos.flatMap((p) => (p.tipo === "culpa-neuronio" && p.final ? [p.neuronio] : [])));
  const curto = (nome: string) => nome.replace(/^Entrada /, "").replace(/^.* · /, "");
  const origem = new Map(rodada.passos.flatMap((p) => (p.tipo === "termo" ? [[p.linha, curto(p.nome)] as const] : [])));
  const nomeNeuronio = (id: string) => (finais.has(id) ? "Saída" : curto(rodada.nomes.get(id) ?? id));
  const nomeLinha = (l: LinhaDaVolta) => `${origem.get(l.linha) ?? nomeNeuronio(l.de)} → ${nomeNeuronio(l.neuronio)}`;
  const certo = (o: number) => `${o === 1 ? rotulos.rotulo1 : rotulos.rotulo0} (${o})`;

  const passo = passos[atual];
  const faltam = passos.length - 1 - atual;
  const linhas = passos.filter((p): p is LinhaDaVolta => p.tipo === "culpa-linha");

  return (
    <div className="contas volta">
      <div className="volta-trilha-rotulo">O caminho da culpa</div>
      <div className="volta-trilha" role="list">
        {passos.slice(0, atual + 1).map((p, i) =>
          p.tipo === "fim" ? null : (
            <span key={i} role="listitem" className={i === atual ? "agora" : ""} title={tituloDoPasso(p, nomeNeuronio, nomeLinha)}>
              <Simbolo p={p} />
            </span>
          ),
        )}
      </div>

      {passo && passo.tipo !== "fim" && <Cartao p={passo} nomeNeuronio={nomeNeuronio} nomeLinha={nomeLinha} certo={certo} />}
      {faltam > 0 && <p className="contas-nota">Faltam {faltam} {faltam === 1 ? "passo" : "passos"}{faltam === 1 ? ": o fim." : "."}</p>}
      {passo?.tipo === "fim" && <Fim fim={passo} linhas={linhas} nomeLinha={nomeLinha} modo={modo} />}
    </div>
  );
}

function Simbolo({ p }: { p: PassoVolta }) {
  if (p.tipo === "erro") return <i className="volta-icone erro" aria-hidden />;
  if (p.tipo === "culpa-neuronio") return p.apagado ? <MarcaSinal sinal="=" /> : <i className="volta-icone culpa" aria-hidden />;
  if (p.tipo === "culpa-linha") return <MarcaSinal sinal={p.sinal} />;
  return null;
}

function tituloDoPasso(p: PassoVolta, nomeNeuronio: (id: string) => string, nomeLinha: (l: LinhaDaVolta) => string) {
  if (p.tipo === "erro") return `Erro na Saída: ${formatar(p.erro)}`;
  if (p.tipo === "culpa-neuronio") return p.apagado ? `${nomeNeuronio(p.neuronio)} passou 0: a culpa para aqui` : `Culpa em ${nomeNeuronio(p.neuronio)}: ${formatarCulpa(p.culpa)}`;
  if (p.tipo === "culpa-linha") return `${nomeLinha(p)}: ${EFEITO[p.sinal]} (${formatar(p.antes)} → ${formatar(p.salvo)})`;
  return "";
}

/** A cadeia da esquerda para a direita, com setas aqua entre os elos. */
function Cadeia({ elos }: { elos: ReactNode[] }) {
  return (
    <p className="volta-cadeia">
      {elos.map((e, i) => (
        <span key={i}>
          {i > 0 && <i aria-hidden>→</i>}
          {e}
        </span>
      ))}
    </p>
  );
}

function Cartao({
  p,
  nomeNeuronio,
  nomeLinha,
  certo,
}: {
  p: Exclude<PassoVolta, { tipo: "fim" }>;
  nomeNeuronio: (id: string) => string;
  nomeLinha: (l: LinhaDaVolta) => string;
  certo: (o: number) => string;
}) {
  if (p.tipo === "erro") {
    return (
      <div className="volta-cartao">
        <div className="volta-cartao-topo">
          <Simbolo p={p} />
          <b>Erro na Saída</b>
        </div>
        <Cadeia
          elos={[
            <>
              respondeu <b>{formatar(p.resposta)}</b>
            </>,
            <>
              certo <b>{certo(p.objetivo)}</b>
            </>,
            <>
              erro <b className="negativo">{formatar(p.erro)}</b>
            </>,
          ]}
        />
        <p className="volta-pe">Agora a culpa volta pela rede, da Saída até a Entrada.</p>
      </div>
    );
  }

  if (p.tipo === "culpa-neuronio") {
    if (p.apagado) {
      return (
        <div className="volta-cartao">
          <div className="volta-cartao-topo">
            <MarcaSinal sinal="=" />
            <b>{nomeNeuronio(p.neuronio)} passou 0</b>
          </div>
          <p className="volta-cadeia">A culpa para aqui: as linhas dele ficam iguais.</p>
        </div>
      );
    }
    return (
      <div className="volta-cartao">
        <div className="volta-cartao-topo">
          <Simbolo p={p} />
          <b>{p.final ? "Passa pela sigmoide" : `A culpa chega em ${nomeNeuronio(p.neuronio)}`}</b>
        </div>
        {p.final ? (
          <Cadeia
            elos={[
              <>
                erro <b>{formatar(Math.abs(p.chegou))}</b>
              </>,
              <>× {formatar(p.inclinacao)}</>,
              <>
                culpa <b>{formatarCulpa(p.culpa)}</b>
              </>,
            ]}
          />
        ) : (
          <Cadeia
            elos={[
              <>
                culpa <b>{formatarCulpa(p.culpa)}</b>
              </>,
            ]}
          />
        )}
        <p className="volta-pe">{p.final ? "Perto de 0 ou de 1 a sigmoide é quase plana: a culpa encolhe." : "Vem das linhas que saem dele."}</p>
      </div>
    );
  }

  // culpa-linha: a culpa vira o tamanho do passo do peso
  const anda = Math.abs(p.salvo - p.antes);
  return (
    <div className="volta-cartao">
      <div className="volta-cartao-topo">
        <MarcaSinal sinal={p.sinal} />
        <b>{nomeLinha(p)}</b>
        <span>{EFEITO[p.sinal]}</span>
      </div>
      <Cadeia
        elos={[
          <>
            culpa <b>{p.sinal === "=" ? "0" : formatarCulpa(p.culpa)}</b>
          </>,
          p.sinal === "=" ? (
            <>não anda</>
          ) : (
            <>
              anda <b>{formatar(anda)}</b>
            </>
          ),
          <>
            {formatar(p.antes)} → <b>{formatar(p.salvo)}</b>
          </>,
        ]}
      />
      <p className="volta-pe">o peso anda = passinho × culpa</p>
    </div>
  );
}

function Fim({
  fim,
  linhas,
  nomeLinha,
  modo,
}: {
  fim: Extract<PassoVolta, { tipo: "fim" }>;
  linhas: LinhaDaVolta[];
  nomeLinha: (l: LinhaDaVolta) => string;
  modo: "mostrar" | "salvar";
}) {
  const conta = (s: Sinal) => linhas.filter((l) => l.sinal === s).length;
  const pct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;
  return (
    <div className="volta-fim">
      <b>{modo === "salvar" ? "Cada peso andou um passinho" : "Cada peso andaria um passinho"}</b>
      <div className="volta-contagem">
        {(["+", "-", "="] as const).map((s) => (
          <span key={s}>
            <MarcaSinal sinal={s} /> <b>{conta(s)}</b> {s === "+" ? "mais fortes" : s === "-" ? "mais fracas" : "iguais"}
          </span>
        ))}
      </div>
      <div className="volta-resultado">
        <span>{modo === "salvar" ? "rodando de novo com a mesma cor" : "se salvasse, rodando de novo"}</span>
        <div className="termometro-barra">
          <span className="termometro-erro" style={{ left: pct(Math.min(fim.respostaDepois, fim.objetivo)), width: pct(fim.erroDepois) }} />
          <span className="termometro-certo" style={{ left: pct(fim.objetivo) }} />
          <span className="termometro-ponteiro antes" style={{ left: pct(fim.respostaAntes) }} />
          <span className="termometro-ponteiro" style={{ left: pct(fim.respostaDepois) }} />
        </div>
        <span>
          erro {formatar(fim.erroAntes)} → <b className={fim.erroDepois < fim.erroAntes ? "positivo" : ""}>{formatar(fim.erroDepois)}</b>
        </span>
      </div>
      <details className="volta-todos">
        <summary>ver todos os pesos</summary>
        <ul className="volta-tabela">
          {linhas.map((l) => (
            <li key={l.linha} className={l.sinal === "=" ? "igual" : ""}>
              <MarcaSinal sinal={l.sinal} />
              <span>{nomeLinha(l)}</span>
              <span className="volta-pesos">
                {formatar(l.antes)} → <b>{formatar(l.salvo)}</b>
              </span>
            </li>
          ))}
        </ul>
      </details>
      <p className="contas-nota">
        {modo === "salvar" ? "Os pesos novos foram salvos. O Treinar do bloco faz isso com todas as cores dos Dados, muitas vezes." : "Mostrar: nada mudou na rede."}
      </p>
    </div>
  );
}
