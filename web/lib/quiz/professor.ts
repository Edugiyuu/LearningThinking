// Quiz ao vivo (ADR-0034): a aba do professor é a dona de tudo. Guarda a lista de alunos, manda as
// perguntas, mede o tempo, corrige e soma os pontos. Esta classe não sabe nada de PeerJS: recebe
// "conexões" que só sabem enviar, e por isso dá para testar sem rede.

import {
  chaveDaResposta,
  corrigir,
  erroDaResposta,
  gerarPergunta,
  textoDaCerta,
  type Pergunta,
  type Resposta,
} from "./perguntas";
import {
  PONTOS_POR_ACERTO,
  classificar,
  empatadosCom,
  quemSeMexeu,
  sementeDaPergunta,
  tempoDoModelo,
  type Config,
  type ItemDoPlano,
  type Movimento,
  type Pontuado,
} from "./quiz";
import { ALUNOS_MAX, type MsgAluno, type MsgProfessor } from "./sala";

/** Uma conexão com o aparelho de um aluno: só sabe mandar mensagens. */
export type Conexao = { id: string; enviar: (msg: MsgProfessor) => void };

export type RespostaRegistrada = { resposta: Resposta | null; segundos: number | null; certo: boolean; semente: number };

export type AlunoNaSala = {
  id: string;
  apelido: string;
  conectado: boolean;
  pontos: number;
  /** uma por pergunta; undefined = não estava na sala quando ela começou */
  respostas: (RespostaRegistrada | undefined)[];
};

export type Fase = "espera" | "pergunta" | "resultado" | "fim";

export type GrupoDeResposta = { texto: string; quantos: number; certa: boolean; erro?: string };

/** Como cada Aqua aparece no pódio (P4): acertou e subiu, errou e ficou, ou não respondeu. */
export type ComoFoi = "acertou" | "errou" | "sem-resposta";

export type NoPodio = Pontuado & { antes: number; como: ComoFoi };

export type ResultadoDaPergunta = {
  indice: number;
  participaram: number;
  acertaram: number;
  grupos: GrupoDeResposta[];
  erroMaisComum: GrupoDeResposta | null;
  placar: (Pontuado & { posicao: number; ganhou: number })[];
  mexeu: Movimento[];
  /** todos que estavam na pergunta, com os pontos de antes e de depois */
  podio: NoPodio[];
};

export type EstadoDoProfessor = {
  fase: Fase;
  codigo: string;
  config: Config;
  plano: ItemDoPlano[];
  indice: number;
  alunos: AlunoNaSala[];
  /** quando a pergunta acaba (ms, no relógio do professor) */
  prazo: number | null;
  responderam: number;
  participando: number;
  resultado: ResultadoDaPergunta | null;
};

/** Folga para a resposta que saiu no último segundo e demorou a chegar. */
const FOLGA_MS = 1500;

export class SalaDoProfessor {
  private fase: Fase = "espera";
  private indice = -1;
  private prazo: number | null = null;
  private alunos = new Map<string, AlunoNaSala>();
  private conexoes = new Map<string, Conexao>(); // id da conexão → conexão
  private alunoDaConexao = new Map<string, string>(); // id da conexão → id do aluno
  private resultado: ResultadoDaPergunta | null = null;
  private pontosAntes: Pontuado[] = [];
  private perguntas = new Map<string, Pergunta>();
  private ouvintes = new Set<() => void>();
  private foto: EstadoDoProfessor;

  constructor(
    readonly codigo: string,
    readonly config: Config,
    readonly plano: ItemDoPlano[],
    readonly semente: number,
    private agora: () => number = Date.now,
  ) {
    this.foto = this.fotografar();
  }

  /* ---------- Para a tela (React) ---------- */

  estado = (): EstadoDoProfessor => this.foto;

  assinar = (ouvinte: () => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  private mudou() {
    this.foto = this.fotografar();
    this.ouvintes.forEach((o) => o());
  }

  private fotografar(): EstadoDoProfessor {
    const alunos = [...this.alunos.values()].map((a) => ({ ...a, respostas: [...a.respostas] }));
    const participantes = alunos.filter((a) => a.respostas[this.indice]);
    return {
      fase: this.fase,
      codigo: this.codigo,
      config: this.config,
      plano: this.plano,
      indice: this.indice,
      alunos,
      prazo: this.prazo,
      responderam: participantes.filter((a) => a.respostas[this.indice]!.segundos !== null).length,
      participando: participantes.length,
      resultado: this.resultado,
    };
  }

  /* ---------- As perguntas ---------- */

  /** A pergunta de número `indice`: a mesma para a turma toda. */
  perguntaDe(indice: number): Pergunta {
    const semente = sementeDaPergunta(this.semente, indice);
    const chave = `${this.plano[indice].modelo}:${semente}`;
    let p = this.perguntas.get(chave);
    if (!p) {
      p = gerarPergunta(this.plano[indice].modelo, semente);
      this.perguntas.set(chave, p);
    }
    return p;
  }

  private tempoDa(indice: number) {
    return tempoDoModelo(this.plano[indice].modelo, this.config);
  }

  /* ---------- Conexões ---------- */

  conectou(conexao: Conexao) {
    this.conexoes.set(conexao.id, conexao);
  }

  saiu(conexaoId: string) {
    this.conexoes.delete(conexaoId);
    const alunoId = this.alunoDaConexao.get(conexaoId);
    this.alunoDaConexao.delete(conexaoId);
    const aluno = alunoId ? this.alunos.get(alunoId) : undefined;
    // só marca como fora se não voltou por outra conexão
    if (aluno && ![...this.alunoDaConexao.values()].includes(aluno.id)) {
      aluno.conectado = false;
      this.mandarTurma();
      this.mudou();
    }
  }

  recebeu(conexaoId: string, msg: MsgAluno) {
    if (msg.tipo === "entrar") this.entrar(conexaoId, msg.id, msg.apelido);
    else this.responder(conexaoId, msg.indice, msg.resposta, msg.segundos);
  }

  private enviar(alunoId: string, msg: MsgProfessor) {
    for (const [conexaoId, id] of this.alunoDaConexao) if (id === alunoId) this.conexoes.get(conexaoId)?.enviar(msg);
  }

  private paraTodos(msg: MsgProfessor | ((a: AlunoNaSala) => MsgProfessor | null)) {
    for (const a of this.alunos.values()) {
      const m = typeof msg === "function" ? msg(a) : msg;
      if (m) this.enviar(a.id, m);
    }
  }

  private mandarTurma() {
    const apelidos = [...this.alunos.values()].filter((a) => a.conectado).map((a) => a.apelido);
    this.paraTodos({ tipo: "turma", apelidos });
  }

  private entrar(conexaoId: string, id: string, apelido: string) {
    const conexao = this.conexoes.get(conexaoId);
    if (!conexao) return;
    const recusar = (motivo: string) => conexao.enviar({ tipo: "recusado", motivo });
    if (this.fase === "fim") return recusar("Este quiz já acabou.");
    let aluno = this.alunos.get(id);
    if (!aluno) {
      const repetido = [...this.alunos.values()].some((a) => a.apelido.toLocaleLowerCase("pt-BR") === apelido.toLocaleLowerCase("pt-BR"));
      if (repetido) return recusar("Esse apelido já está na sala. Escolha outro.");
      if (this.alunos.size >= ALUNOS_MAX) return recusar("A sala está cheia.");
      // quem chega atrasado entra com zero nas perguntas que perdeu
      aluno = { id, apelido, conectado: true, pontos: 0, respostas: [] };
      this.alunos.set(id, aluno);
    }
    aluno.conectado = true;
    this.alunoDaConexao.set(conexaoId, id);
    conexao.enviar({ tipo: "bem-vindo", apelido: aluno.apelido, pontos: aluno.pontos, fase: this.indice < 0 ? "espera" : "no-meio" });
    this.mandarTurma();
    this.reenviar(aluno);
    this.mudou();
  }

  /** Quem volta (tela apagou, página recarregou) recebe de novo o que estava na tela dele. */
  private reenviar(aluno: AlunoNaSala) {
    const r = aluno.respostas[this.indice];
    if (this.fase === "pergunta" && r) {
      if (r.segundos === null) this.enviar(aluno.id, this.msgDaPergunta());
      else if (r.resposta) this.enviar(aluno.id, { tipo: "recebida", indice: this.indice, resposta: r.resposta });
    } else if (this.fase === "resultado" && r) {
      this.enviar(aluno.id, { tipo: "resultado", resultado: this.resultadoDo(aluno) });
    }
  }

  private msgDaPergunta(): MsgProfessor {
    const restante = this.prazo === null ? 0 : Math.max(0, Math.ceil((this.prazo - this.agora()) / 1000));
    return {
      tipo: "pergunta",
      indice: this.indice,
      perguntas: this.plano.length,
      modelo: this.plano[this.indice].modelo,
      semente: sementeDaPergunta(this.semente, this.indice),
      tempo: this.tempoDa(this.indice),
      restante,
    };
  }

  /* ---------- O andamento do quiz ---------- */

  comecar() {
    if (this.fase === "espera" && this.plano.length > 0) this.abrirPergunta(0);
  }

  private abrirPergunta(indice: number) {
    this.indice = indice;
    this.fase = "pergunta";
    this.resultado = null;
    this.prazo = this.agora() + this.tempoDa(indice) * 1000;
    this.pontosAntes = this.pontuados();
    for (const a of this.alunos.values()) {
      if (!a.conectado) continue;
      a.respostas[indice] = { resposta: null, segundos: null, certo: false, semente: sementeDaPergunta(this.semente, indice) };
      this.enviar(a.id, this.msgDaPergunta());
    }
    this.mudou();
  }

  private responder(conexaoId: string, indice: number, resposta: Resposta, segundos: number) {
    const aluno = this.alunos.get(this.alunoDaConexao.get(conexaoId) ?? "");
    if (!aluno || this.fase !== "pergunta" || indice !== this.indice || this.prazo === null) return;
    const r = aluno.respostas[indice];
    if (!r || r.segundos !== null) return; // não estava na pergunta, ou já respondeu (não dá para mudar)
    if (this.agora() > this.prazo + FOLGA_MS) return;
    r.resposta = resposta;
    r.segundos = Math.min(segundos, this.tempoDa(indice));
    r.certo = corrigir(this.perguntaDe(indice), resposta);
    this.enviar(aluno.id, { tipo: "recebida", indice, resposta });
    const f = this.fotografar();
    this.paraTodos((a) => (a.respostas[indice]?.segundos != null ? { tipo: "progresso", indice, responderam: f.responderam, de: f.participando } : null));
    // todo mundo que está na sala já respondeu: não precisa esperar o tempo acabar
    const faltam = [...this.alunos.values()].filter((a) => a.conectado && a.respostas[indice] && a.respostas[indice]!.segundos === null);
    if (faltam.length === 0) this.encerrar();
    else this.mudou();
  }

  /** O relógio da tela chama de tempos em tempos: acabou o tempo, encerra. */
  tique() {
    if (this.fase === "pergunta" && this.prazo !== null && this.agora() >= this.prazo) this.encerrar();
  }

  maisTempo(segundos = 15) {
    if (this.fase !== "pergunta" || this.prazo === null) return;
    this.prazo = Math.max(this.prazo, this.agora()) + segundos * 1000;
    const restante = Math.ceil((this.prazo - this.agora()) / 1000);
    this.paraTodos((a) => (a.respostas[this.indice]?.segundos === null ? { tipo: "tempo", indice: this.indice, restante } : null));
    this.mudou();
  }

  /** Encerra a pergunta (o tempo acabou, todos responderam ou o professor clicou em "Encerrar agora"). */
  encerrar() {
    if (this.fase !== "pergunta") return;
    const indice = this.indice;
    this.fase = "resultado";
    this.prazo = null;
    for (const a of this.alunos.values()) {
      const r = a.respostas[indice];
      if (r?.certo) a.pontos += PONTOS_POR_ACERTO;
    }
    this.resultado = this.calcularResultado(indice);
    this.paraTodos((a) => (a.respostas[indice] ? { tipo: "resultado", resultado: this.resultadoDo(a) } : null));
    this.mudou();
  }

  proxima() {
    if (this.fase !== "resultado") return;
    if (this.indice + 1 < this.plano.length) this.abrirPergunta(this.indice + 1);
    else this.terminar();
  }

  private terminar() {
    this.fase = "fim";
    this.prazo = null;
    const lista = this.pontuados();
    const classificados = classificar(lista);
    for (const a of this.alunos.values()) {
      const c = classificados.find((x) => x.id === a.id)!;
      this.enviar(a.id, {
        tipo: "fim",
        fim: {
          pontos: a.pontos,
          acertos: a.respostas.filter((r) => r?.certo).length,
          perguntas: this.plano.length,
          posicao: c.posicao,
          empatadosCom: empatadosCom(lista, a.id),
        },
      });
    }
    this.mudou();
  }

  /** Fecha a sala: avisa todo mundo. Nada fica guardado (seção F). */
  fechar() {
    this.paraTodos({ tipo: "fechada" });
  }

  /* ---------- Contas do resultado ---------- */

  private pontuados(): Pontuado[] {
    return [...this.alunos.values()].map((a) => ({ id: a.id, apelido: a.apelido, pontos: a.pontos }));
  }

  private resultadoDo(aluno: AlunoNaSala) {
    const lista = this.pontuados();
    const r = aluno.respostas[this.indice];
    return {
      indice: this.indice,
      perguntas: this.plano.length,
      certo: !!r?.certo,
      ganhou: r?.certo ? PONTOS_POR_ACERTO : 0,
      pontos: aluno.pontos,
      posicao: classificar(lista).find((x) => x.id === aluno.id)!.posicao,
      empatados: empatadosCom(lista, aluno.id).length,
    };
  }

  private calcularResultado(indice: number): ResultadoDaPergunta {
    const participantes = [...this.alunos.values()].filter((a) => a.respostas[indice]);
    const grupos = new Map<string, GrupoDeResposta>();
    const somar = (texto: string, certa: boolean, erro?: string) => {
      const g = grupos.get(texto) ?? { texto, quantos: 0, certa, erro };
      g.quantos++;
      grupos.set(texto, g);
    };
    for (const a of participantes) {
      const r = a.respostas[indice]!;
      const p = this.perguntaDe(indice);
      if (!r.resposta) somar("sem resposta", false);
      else somar(chaveDaResposta(p, r.resposta), r.certo, r.certo ? undefined : erroDaResposta(p, r.resposta));
    }
    // a certa sempre aparece, mesmo se ninguém marcou
    const certaTexto = textoDaCerta(this.perguntaDe(indice));
    if (!grupos.has(certaTexto)) grupos.set(certaTexto, { texto: certaTexto, quantos: 0, certa: true });
    const lista = [...grupos.values()].sort((a, b) => Number(b.certa) - Number(a.certa) || Number(a.texto === "sem resposta") - Number(b.texto === "sem resposta") || b.quantos - a.quantos);
    const erradas = lista.filter((g) => !g.certa && g.texto !== "sem resposta" && g.quantos > 0);
    const depois = this.pontuados();
    const ganhou = new Map(participantes.map((a) => [a.id, a.respostas[indice]!.certo ? PONTOS_POR_ACERTO : 0]));
    return {
      indice,
      participaram: participantes.length,
      acertaram: participantes.filter((a) => a.respostas[indice]!.certo).length,
      grupos: lista,
      erroMaisComum: erradas[0] ?? null,
      placar: classificar(depois).map((x) => ({ ...x, ganhou: ganhou.get(x.id) ?? 0 })),
      mexeu: quemSeMexeu(this.pontosAntes, depois),
      podio: participantes.map((a) => {
        const r = a.respostas[indice]!;
        const antes = this.pontosAntes.find((x) => x.id === a.id)?.pontos ?? 0;
        return { id: a.id, apelido: a.apelido, pontos: a.pontos, antes, como: r.certo ? "acertou" : r.resposta ? "errou" : "sem-resposta" };
      }),
    };
  }
}
