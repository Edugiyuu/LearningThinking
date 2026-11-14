// Quiz ao vivo (ADR-0034, seção A): o PeerJS liga a aba do professor aos aparelhos dos alunos
// (WebRTC). O serviço público do PeerJS só apresenta os dois lados; as mensagens vão direto.
// Este arquivo só roda no navegador: o PeerJS é carregado na hora (import dinâmico).

import type { DataConnection, Peer as PeerT } from "peerjs";
import type { Conexao } from "./professor";
import { lerMsgAluno, lerMsgProfessor, type MsgAluno, type MsgProfessor } from "./sala";

/** O id da sala no PeerJS: um prefixo do site + o código (o aluno só digita o código). */
export const idDaSala = (codigo: string) => `learningthinking-quiz-${codigo}`;

const OPCOES_DA_CONEXAO = { reliable: true, serialization: "json" } as const;

async function criarPeer(id?: string): Promise<PeerT> {
  const { Peer } = await import("peerjs");
  return id ? new Peer(id) : new Peer();
}

/* ---------- Professor ---------- */

export type EventosDoProfessor = {
  conectou: (c: Conexao) => void;
  recebeu: (conexaoId: string, msg: MsgAluno) => void;
  saiu: (conexaoId: string) => void;
  /** perdeu o contato com o PeerJS: os alunos já ligados continuam, mas ninguém novo entra até voltar */
  instavel: (instavel: boolean) => void;
};

export type SalaAberta = { codigo: string; fechar: () => void };

/**
 * Abre a sala com um código livre. Se o código já está em uso (outra sala no mundo), tenta outro.
 * Rejeita se não consegue falar com o PeerJS (sem internet, rede da escola bloqueando).
 */
export async function abrirSala(gerarCodigo: () => string, eventos: EventosDoProfessor): Promise<SalaAberta> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo();
    const peer = await criarPeer(idDaSala(codigo));
    const resultado = await new Promise<"aberta" | "ocupado" | Error>((resolver) => {
      peer.once("open", () => resolver("aberta"));
      peer.once("error", (e) => resolver(e.type === "unavailable-id" ? "ocupado" : new Error(e.type)));
    });
    if (resultado === "ocupado") {
      peer.destroy();
      continue;
    }
    if (resultado instanceof Error) {
      peer.destroy();
      throw resultado;
    }
    ligarProfessor(peer, eventos);
    return { codigo, fechar: () => peer.destroy() };
  }
  throw new Error("sem código livre");
}

function ligarProfessor(peer: PeerT, eventos: EventosDoProfessor) {
  peer.on("connection", (conn: DataConnection) => {
    const id = conn.connectionId;
    let saiu = false;
    const sair = () => {
      if (saiu) return;
      saiu = true;
      eventos.saiu(id);
    };
    conn.on("open", () =>
      eventos.conectou({
        id,
        enviar: (m: MsgProfessor) => {
          if (conn.open) conn.send(m);
        },
      }),
    );
    conn.on("data", (dado) => {
      const msg = lerMsgAluno(dado);
      if (msg) eventos.recebeu(id, msg);
    });
    conn.on("close", sair);
    conn.on("error", sair);
  });
  // perdeu o PeerJS (não os alunos): tenta voltar com o mesmo código
  peer.on("disconnected", () => {
    eventos.instavel(true);
    const tentar = () => {
      if (peer.destroyed) return;
      if (peer.disconnected) peer.reconnect();
    };
    setTimeout(tentar, 1000);
  });
  peer.on("open", () => eventos.instavel(false));
  peer.on("error", (e) => {
    if (e.type === "network" || e.type === "server-error" || e.type === "socket-closed") {
      eventos.instavel(true);
      setTimeout(() => !peer.destroyed && peer.disconnected && peer.reconnect(), 3000);
    }
  });
}

/* ---------- Aluno ---------- */

export type EventosDoAluno = {
  abriu: () => void;
  recebeu: (msg: MsgProfessor) => void;
  caiu: () => void;
  /** a sala não existe (código errado ou o professor fechou) */
  naoAchou: () => void;
  /** não conseguiu falar com o PeerJS */
  semRede: () => void;
};

export type LigacaoDoAluno = { enviar: (m: MsgAluno) => void; fechar: () => void };

/** Liga o aparelho do aluno à sala. Se a conexão cai, tenta voltar sozinho. */
export async function entrarNaSala(codigo: string, eventos: EventosDoAluno): Promise<LigacaoDoAluno> {
  const peer = await criarPeer();
  let conn: DataConnection | null = null;
  let jaAbriu = false;
  let fechado = false;
  let tentativas = 0;

  const ligar = () => {
    if (fechado || peer.destroyed) return;
    const c = peer.connect(idDaSala(codigo), OPCOES_DA_CONEXAO);
    conn = c;
    c.on("open", () => {
      jaAbriu = true;
      tentativas = 0;
      eventos.abriu();
    });
    c.on("data", (dado) => {
      const msg = lerMsgProfessor(dado);
      if (msg) eventos.recebeu(msg);
    });
    c.on("close", () => {
      if (fechado || conn !== c) return;
      eventos.caiu();
      voltar();
    });
  };

  const voltar = () => {
    if (fechado) return;
    tentativas++;
    if (tentativas > 20) return eventos.naoAchou(); // ~1 minuto tentando: a sala acabou
    setTimeout(() => {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      ligar();
    }, 3000);
  };

  peer.on("open", () => {
    if (!conn) ligar();
  });
  peer.on("error", (e) => {
    if (e.type === "peer-unavailable") {
      if (!jaAbriu) eventos.naoAchou();
      else voltar();
    } else if (e.type === "network" || e.type === "server-error" || e.type === "socket-closed" || e.type === "socket-error") {
      if (!jaAbriu) eventos.semRede();
      else {
        eventos.caiu();
        voltar();
      }
    }
  });

  return {
    enviar: (m) => {
      if (conn?.open) conn.send(m);
    },
    fechar: () => {
      fechado = true;
      peer.destroy();
    },
  };
}
