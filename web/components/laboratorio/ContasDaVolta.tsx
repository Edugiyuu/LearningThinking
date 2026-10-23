"use client";

import { formatarCulpa, type LinhaDaVolta, type PassoVolta, type Sinal } from "@/lib/backward";
import { formatar, type Rodada } from "@/lib/rede";
import { useLab } from "@/components/laboratorio/contexto";

const PALAVRA: Record<Sinal, string> = { "+": "ajudou · fica mais forte", "-": "atrapalhou · fica mais fraca", "=": "não fez nada · fica igual" };

export function MarcaSinal({ sinal }: { sinal: Sinal }) {
  return <b className={`sinal ${sinal === "+" ? "mais" : sinal === "-" ? "menos" : "igual"}`}>{sinal === "-" ? "−" : sinal}</b>;
}

/**
 * O painel durante a volta (ADR-0025): a lista com os mesmos símbolos do canvas (faixa do
 * erro, bolinha de culpa, + − =), a conta da vez aberta e, no fim, a tabela dos pesos.
 */
export default function ContasDaVolta({ rodada, passos, atual, modo }: { rodada: Rodada; passos: PassoVolta[]; atual: number; modo: "mostrar" | "salvar" }) {
  // os nomes vêm da ida: "Entrada R", "Camada 1 · neurônio 2"
  const origem = new Map(rodada.passos.flatMap((p) => (p.tipo === "termo" ? [[p.linha, p.nome.replace(/^Entrada /, "")] as const] : [])));
  const nome = (id: string) => rodada.nomes.get(id) ?? id;
  const nomeLinha = (l: LinhaDaVolta) => `${origem.get(l.linha) ?? nome(l.de)} → ${nome(l.neuronio)}`;
  const faltam = passos.length - 1 - atual;
  const passo = passos[atual];

  return (
    <div className="contas volta">
      <span className="chip">A culpa voltando</span>
      <ol className="volta-lista">
        {passos.slice(0, atual + 1).map((p, i) => (
          <Item key={i} p={p} agora={i === atual} nome={nome} nomeLinha={nomeLinha} modo={modo} />
        ))}
      </ol>
      {faltam > 0 && <p className="contas-nota">Faltam {faltam} {faltam === 1 ? "passo" : "passos"} até a Entrada.</p>}
      {passo?.tipo === "fim" && <Fim fim={passo} linhas={passos.filter((p): p is LinhaDaVolta => p.tipo === "culpa-linha")} nomeLinha={nomeLinha} modo={modo} />}
    </div>
  );
}

function Item({
  p,
  agora,
  nome,
  nomeLinha,
  modo,
}: {
  p: PassoVolta;
  agora: boolean;
  nome: (id: string) => string;
  nomeLinha: (l: LinhaDaVolta) => string;
  modo: "mostrar" | "salvar";
}) {
  const { rotulos } = useLab();
  if (p.tipo === "fim") return null;
  const classe = `volta-item ${agora ? "agora" : ""}`;

  if (p.tipo === "erro") {
    return (
      <li className={classe}>
        <i className="volta-icone erro" aria-hidden />
        <span>Erro na Saída</span>
        <b className="volta-valor negativo">{formatar(p.erro)}</b>
        {agora && (
          <p className="volta-detalhe">
            A rede respondeu {formatar(p.resposta)}, e o certo era {p.objetivo === 1 ? rotulos.rotulo1 : rotulos.rotulo0} ({p.objetivo}). A distância entre os dois é o erro. Agora a culpa volta pela rede.
          </p>
        )}
      </li>
    );
  }

  if (p.tipo === "culpa-neuronio") {
    if (p.apagado) {
      return (
        <li className={classe}>
          <MarcaSinal sinal="=" />
          <span>{nome(p.neuronio)}: passou 0</span>
          <b className="volta-valor">para aqui</b>
          {agora && <p className="volta-detalhe">Ele não ajudou a errar, então a culpa não passa por ele. As linhas dele ficam iguais.</p>}
        </li>
      );
    }
    return (
      <li className={classe}>
        <i className="volta-icone culpa" aria-hidden />
        <span>{p.final ? "Culpa depois da sigmoide" : `Culpa chega em ${nome(p.neuronio)}`}</span>
        <b className="volta-valor">{formatarCulpa(p.culpa)}</b>
        {agora && (
          <p className="volta-detalhe">
            {p.final
              ? `${formatarCulpa(p.chegou)} × ${formatar(p.inclinacao)} = ${formatarCulpa(p.culpa)}. A sigmoide perto de 0 ou de 1 é quase plana, então a culpa encolhe ao passar por ela.`
              : `Vem de cada linha que sai dele: culpa de lá × peso da linha.`}
          </p>
        )}
      </li>
    );
  }

  // culpa-linha
  const arredondou = Math.abs(p.salvo - p.depois) >= 0.001;
  return (
    <li className={classe}>
      <MarcaSinal sinal={p.sinal} />
      <span>{nomeLinha(p)}</span>
      <b className="volta-valor">{p.sinal === "=" ? "igual" : formatarCulpa(p.culpa)}</b>
      {agora && (
        <div className="volta-detalhe">
          <p>
            culpa {formatarCulpa(p.culpaNeuronio)} × passou {formatar(p.passou)} = <b>{formatarCulpa(p.culpa)}</b>
          </p>
          <p>
            peso {formatar(p.antes)} → <b>{formatar(p.salvo)}</b> · {PALAVRA[p.sinal]}
          </p>
          {arredondou && p.sinal !== "=" && <p className="contas-nota">Pela conta seria {p.depois < 0 ? "−" : ""}
              {formatarCulpa(p.depois)}; com 2 casas, anda pelo menos 0,01.</p>}
          {modo === "mostrar" && p.sinal !== "=" && <p className="contas-nota">Mostrar: o peso andaria assim, mas fica igual.</p>}
        </div>
      )}
    </li>
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
  return (
    <div className="volta-fim">
      <div className="treinar-rotulo forte">{modo === "salvar" ? "Cada peso andou um passinho" : "Cada peso andaria um passinho"}</div>
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
      <p className="volta-resultado">
        {modo === "salvar" ? "Rodando de novo" : "Se salvasse, rodando de novo"} com a mesma cor: resposta {formatar(fim.respostaAntes)} → <b>{formatar(fim.respostaDepois)}</b> · erro {formatar(fim.erroAntes)} →{" "}
        <b className={fim.erroDepois < fim.erroAntes ? "positivo" : ""}>{formatar(fim.erroDepois)}</b>
      </p>
      <p className="contas-nota">
        {modo === "salvar"
          ? "Os pesos novos foram salvos no projeto. Um passinho muda pouco: o Treinar faz isso com várias cores, muitas vezes."
          : "Mostrar: nada mudou na rede. Troque para Salvar no bloco para os pesos andarem de verdade."}
      </p>
    </div>
  );
}
