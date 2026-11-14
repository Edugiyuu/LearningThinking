// Quiz ao vivo (ADR-0034): o aparelho do aluno só desenha a pergunta e manda a resposta.
// A pergunta é gerada aqui mesmo, a partir do modelo e da semente que o professor mandou.
// Como a classe do professor, esta não sabe nada de PeerJS.

import { gerarPergunta, type Pergunta, type Resposta } from "./perguntas";
import type { FimDoAluno, MsgAluno, MsgProfessor, ResultadoDoAluno } from "./sala";

export type FaseDoAluno =
  | "conectando" // procurando a sala
  | "espera" // entrou, esperando o professor (ou a próxima pergunta)
  | "pergunta"
  | "enviada"
  | "resultado"
  | "fim"
  | "recusado" // apelido repetido, sala cheia...
  | "caiu" // a conexão caiu: tentando voltar
  | "fechada"; // o professor fechou a sala

export type PerguntaNaTela = {
  indice: number;
  perguntas: number;
  pergunta: Pergunta;
  tempo: number;
  /** quando o prazo acaba, no relógio deste aparelho (ms) */
  prazo: number;
  /** quando a pergunta apareceu aqui (ms), para contar os segundos da resposta */
  apareceu: number;
};

export type EstadoDoAluno = {
  fase: FaseDoAluno;
  apelido: string;
  /** entrou com a sala no meio do quiz: só participa a partir da próxima pergunta */
  noMeio: boolean;
  turma: string[];
  pergunta: PerguntaNaTela | null;
  resposta: Resposta | null;
  progresso: { responderam: number; de: number } | null;
  resultado: ResultadoDoAluno | null;
  fim: FimDoAluno | null;
  motivo: string | null;
};

export class SalaDoAluno {
  private e: EstadoDoAluno;
  private ouvintes = new Set<() => void>();

  constructor(
    readonly id: string,
    apelido: string,
    private enviar: (msg: MsgAluno) => void,
    private agora: () => number = Date.now,
  ) {
    this.e = { fase: "conectando", apelido, noMeio: false, turma: [], pergunta: null, resposta: null, progresso: null, resultado: null, fim: null, motivo: null };
  }

  estado = (): EstadoDoAluno => this.e;

  assinar = (ouvinte: () => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  private mudar(parte: Partial<EstadoDoAluno>) {
    this.e = { ...this.e, ...parte };
    this.ouvintes.forEach((o) => o());
  }

  /** A conexão abriu (ou voltou): pede para entrar com o mesmo id, e o professor reconhece. */
  conectou() {
    this.enviar({ tipo: "entrar", id: this.id, apelido: this.e.apelido });
  }

  /** A conexão caiu. Se o quiz ainda não acabou, a tela mostra que está voltando. */
  caiu() {
    if (this.e.fase !== "fim" && this.e.fase !== "fechada" && this.e.fase !== "recusado") this.mudar({ fase: "caiu" });
  }

  recebeu(msg: MsgProfessor) {
    switch (msg.tipo) {
      case "bem-vindo":
        this.mudar({
          fase: this.e.fase === "conectando" || this.e.fase === "caiu" ? "espera" : this.e.fase,
          apelido: msg.apelido,
          noMeio: msg.fase === "no-meio" && this.e.pergunta === null,
        });
        break;
      case "recusado":
        this.mudar({ fase: "recusado", motivo: msg.motivo });
        break;
      case "turma":
        this.mudar({ turma: msg.apelidos });
        break;
      case "pergunta": {
        const agora = this.agora();
        let pergunta: Pergunta;
        try {
          pergunta = gerarPergunta(msg.modelo, msg.semente);
        } catch {
          return; // modelo que esta versão do site não conhece
        }
        // quem volta no meio da pergunta mantém o tempo que faltava
        this.mudar({
          fase: "pergunta",
          noMeio: false,
          pergunta: { indice: msg.indice, perguntas: msg.perguntas, pergunta, tempo: msg.tempo, prazo: agora + msg.restante * 1000, apareceu: agora - (msg.tempo - msg.restante) * 1000 },
          resposta: null,
          progresso: null,
          resultado: null,
        });
        break;
      }
      case "tempo":
        if (this.e.pergunta?.indice === msg.indice) this.mudar({ pergunta: { ...this.e.pergunta, prazo: this.agora() + msg.restante * 1000 } });
        break;
      case "recebida":
        if (this.e.pergunta?.indice === msg.indice) this.mudar({ fase: "enviada", resposta: msg.resposta });
        break;
      case "progresso":
        if (this.e.pergunta?.indice === msg.indice) this.mudar({ progresso: { responderam: msg.responderam, de: msg.de } });
        break;
      case "resultado":
        this.mudar({ fase: "resultado", resultado: msg.resultado, noMeio: false });
        break;
      case "fim":
        this.mudar({ fase: "fim", fim: msg.fim });
        break;
      case "fechada":
        if (this.e.fase !== "fim") this.mudar({ fase: "fechada" });
        break;
    }
  }

  /** Manda a resposta. Não dá para mudar depois (como no Figma). */
  responder(resposta: Resposta) {
    const p = this.e.pergunta;
    if (this.e.fase !== "pergunta" || !p) return;
    const segundos = Math.round(((this.agora() - p.apareceu) / 1000) * 10) / 10;
    this.enviar({ tipo: "resposta", indice: p.indice, resposta, segundos });
    // a tela já mostra "enviada"; o professor confirma com "recebida"
    this.mudar({ fase: "enviada", resposta });
  }
}
