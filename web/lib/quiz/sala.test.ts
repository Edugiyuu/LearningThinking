// A sala inteira, sem rede: o professor e alguns alunos ligados por conexões de mentira.

import { SalaDoAluno } from "./aluno";
import { textoDaCerta, type Pergunta, type Resposta } from "./perguntas";
import { SalaDoProfessor, type Conexao } from "./professor";
import { montarPlano, type Config } from "./quiz";
import { lerMsgAluno, type MsgProfessor } from "./sala";

const CONFIG: Config = {
  tema: "geral",
  assuntos: ["soma", "relu", "erro"],
  quantidade: 3,
  sorteio: "por-turma",
  tempoAlternativas: 20,
  tempoContas: 60,
};

function montar(config: Config = CONFIG) {
  let agora = 1_000_000;
  const relogio = () => agora;
  const prof = new SalaDoProfessor("K7M2QX", config, montarPlano(config.assuntos, config.quantidade, 3), 12345, relogio);
  const alunos = new Map<string, SalaDoAluno>();
  const caixas = new Map<string, MsgProfessor[]>();

  /** Liga um aluno: a conexão leva as mensagens dos dois lados (passando pela conferência do formato). */
  function entrar(id: string, apelido: string, conexaoId = `c-${id}`) {
    const caixa: MsgProfessor[] = [];
    caixas.set(id, caixa);
    const aluno = new SalaDoAluno(id, apelido, (m) => prof.recebeu(conexaoId, lerMsgAluno(JSON.parse(JSON.stringify(m)))!), relogio);
    const conexao: Conexao = {
      id: conexaoId,
      enviar: (m) => {
        caixa.push(m);
        aluno.recebeu(JSON.parse(JSON.stringify(m)));
      },
    };
    prof.conectou(conexao);
    aluno.conectou();
    alunos.set(id, aluno);
    return aluno;
  }
  return { prof, entrar, alunos, caixas, passar: (ms: number) => (agora += ms) };
}

function certa(p: Pergunta): Resposta {
  const f = p.forma;
  if (f.tipo === "alternativas") return { tipo: "alternativa", indice: f.certa };
  if (f.tipo === "numero") return { tipo: "numero", valor: f.certa };
  return { tipo: "linha", escolha: f.certa };
}
function errada(p: Pergunta): Resposta {
  const f = p.forma;
  if (f.tipo === "alternativas") return { tipo: "alternativa", indice: (f.certa + 1) % f.opcoes.length };
  if (f.tipo === "numero") return { tipo: "numero", valor: f.certa + 5 };
  return { tipo: "linha", escolha: f.certa === "sobe" ? "desce" : "sobe" };
}

test("os alunos entram e veem quem está na sala", () => {
  const { prof, entrar } = montar();
  const mari = entrar("m", "Mari");
  entrar("l", "Lu");
  expect(prof.estado().alunos.map((a) => a.apelido)).toEqual(["Mari", "Lu"]);
  expect(mari.estado().fase).toBe("espera");
  expect(mari.estado().turma).toEqual(["Mari", "Lu"]);
});

test("apelido repetido é recusado", () => {
  const { entrar } = montar();
  entrar("m", "Mari");
  const outra = entrar("x", "  mari ");
  expect(outra.estado().fase).toBe("recusado");
  expect(outra.estado().motivo).toMatch(/apelido/);
});

test("uma pergunta inteira: responde, corrige, soma 1000 por acerto e mostra quem se mexeu", () => {
  const { prof, entrar } = montar();
  const mari = entrar("m", "Mari");
  const lu = entrar("l", "Lu");
  const theo = entrar("t", "Theo");
  prof.comecar();
  expect(mari.estado().fase).toBe("pergunta");
  const p = mari.estado().pergunta!.pergunta;
  expect(lu.estado().pergunta!.pergunta).toEqual(p); // sorteio por turma: a mesma pergunta

  mari.responder(certa(p));
  expect(mari.estado().fase).toBe("enviada");
  expect(prof.estado().responderam).toBe(1);
  lu.responder(errada(p));
  theo.responder(certa(p)); // o último a responder encerra a pergunta

  const e = prof.estado();
  expect(e.fase).toBe("resultado");
  expect(e.resultado!.acertaram).toBe(2);
  expect(e.resultado!.grupos[0]).toMatchObject({ texto: textoDaCerta(p), quantos: 2, certa: true });
  expect(e.resultado!.placar.map((x) => [x.apelido, x.pontos, x.posicao, x.ganhou])).toEqual([
    ["Mari", 1000, 1, 1000],
    ["Theo", 1000, 1, 1000],
    ["Lu", 0, 3, 0],
  ]);
  expect(e.resultado!.mexeu.map((m) => [m.apelido, m.antes, m.depois])).toEqual([["Lu", 1, 3]]);
  expect(mari.estado().resultado).toMatchObject({ certo: true, ganhou: 1000, pontos: 1000, posicao: 1, empatados: 1 });
  expect(lu.estado().resultado).toMatchObject({ certo: false, ganhou: 0, posicao: 3 });
});

test("não dá para responder duas vezes nem depois do tempo", () => {
  const { prof, entrar, passar } = montar();
  const mari = entrar("m", "Mari");
  entrar("l", "Lu");
  prof.comecar();
  const p = mari.estado().pergunta!.pergunta;
  mari.responder(errada(p));
  prof.recebeu("c-m", { tipo: "resposta", indice: 0, resposta: certa(p), segundos: 3 });
  expect(prof.estado().alunos.find((a) => a.id === "m")!.respostas[0]!.certo).toBe(false);

  passar(120_000); // o tempo acabou
  prof.recebeu("c-l", { tipo: "resposta", indice: 0, resposta: certa(p), segundos: 3 });
  expect(prof.estado().responderam).toBe(1);
  prof.tique();
  expect(prof.estado().fase).toBe("resultado");
});

test("+15 s e Encerrar agora", () => {
  const { prof, entrar, passar } = montar();
  const mari = entrar("m", "Mari");
  entrar("l", "Lu");
  prof.comecar();
  const prazo = prof.estado().prazo!;
  prof.maisTempo();
  expect(prof.estado().prazo).toBe(prazo + 15_000);
  expect(mari.estado().pergunta!.prazo).toBe(prazo + 15_000);
  passar(1000);
  prof.encerrar();
  expect(prof.estado().fase).toBe("resultado");
  expect(prof.estado().resultado!.grupos.find((g) => g.texto === "sem resposta")!.quantos).toBe(2);
});

test("quem cai volta com o mesmo apelido e os mesmos pontos, e recebe a pergunta de novo", () => {
  const { prof, entrar } = montar();
  entrar("m", "Mari");
  entrar("l", "Lu");
  prof.comecar();
  prof.saiu("c-m");
  expect(prof.estado().alunos.find((a) => a.id === "m")!.conectado).toBe(false);
  const volta = entrar("m", "Mari", "c-m2"); // a página recarregou: mesmo id, conexão nova
  expect(prof.estado().alunos).toHaveLength(2);
  expect(volta.estado().fase).toBe("pergunta");
  expect(volta.estado().pergunta!.indice).toBe(0);
});

test("quem chega atrasado entra na próxima pergunta com zero nas que perdeu", () => {
  const { prof, entrar } = montar();
  const mari = entrar("m", "Mari");
  prof.comecar();
  const gabi = entrar("g", "Gabi");
  expect(gabi.estado().fase).toBe("espera");
  expect(gabi.estado().noMeio).toBe(true);
  mari.responder(certa(mari.estado().pergunta!.pergunta)); // Gabi não conta: a pergunta encerra
  expect(prof.estado().fase).toBe("resultado");
  prof.proxima();
  expect(gabi.estado().fase).toBe("pergunta");
  expect(gabi.estado().pergunta!.indice).toBe(1);
});

test("sorteio por aluno: cada um com os seus números, a tela projetada usa um como exemplo", () => {
  const { prof, entrar } = montar({ ...CONFIG, sorteio: "por-aluno" });
  const mari = entrar("m", "Mari");
  const lu = entrar("l", "Lu");
  prof.comecar();
  const pm = mari.estado().pergunta!.pergunta;
  const pl = lu.estado().pergunta!.pergunta;
  expect(pm.modelo).toBe(pl.modelo);
  expect(pm).not.toEqual(pl);
  expect(pm.geral).toBe(pl.geral);
  mari.responder(certa(pm));
  lu.responder(errada(pl));
  expect(prof.exemplo(0).deQuem).toBe("Mari");
  expect(prof.estado().resultado!.grupos[0]).toMatchObject({ texto: "certa", quantos: 1 });
});

test("no fim, cada um recebe a posição, os acertos e com quem empatou", () => {
  const { prof, entrar } = montar();
  const mari = entrar("m", "Mari");
  const lu = entrar("l", "Lu");
  prof.comecar();
  for (let i = 0; i < 3; i++) {
    mari.responder(certa(mari.estado().pergunta!.pergunta));
    lu.responder(certa(lu.estado().pergunta!.pergunta));
    prof.proxima();
  }
  expect(prof.estado().fase).toBe("fim");
  expect(mari.estado().fim).toEqual({ pontos: 3000, acertos: 3, perguntas: 3, posicao: 1, empatadosCom: ["Lu"] });
});

test("mensagens com formato errado são ignoradas", () => {
  expect(lerMsgAluno({ tipo: "entrar", id: "x" })).toBeNull();
  expect(lerMsgAluno({ tipo: "entrar", id: "x", apelido: "   " })).toBeNull();
  expect(lerMsgAluno({ tipo: "resposta", indice: 0, segundos: 1, resposta: { tipo: "linha", escolha: "pula" } })).toBeNull();
  expect(lerMsgAluno({ tipo: "entrar", id: "x", apelido: "Um apelido bem comprido demais" })).toEqual({ tipo: "entrar", id: "x", apelido: "Um apelido bem c" });
  expect(lerMsgAluno("oi")).toBeNull();
});
