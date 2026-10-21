// Conteúdo dos tutoriais (frames "Tutoriais · Desktop" e "Tutorial 01 · O neurônio · roteiro" no Figma).
// Cada tutorial é uma lista de passos; cada passo muda uma coisa só no palco (a visualização à esquerda).
// No fim vem o teste rápido, com uma ou mais perguntas. As contas batem com o laboratório: no meio da
// rede o neurônio acende (ReLU: passa a soma se ela for positiva, senão 0); no fim, a soma passa pela sigmoide.
// O tutorial 01 usa o mesmo exemplo do lab: o detector de laranja da montagem básica.

export type Visual =
  | { tipo: "cerebro" }
  | { tipo: "cores" }
  | { tipo: "historia" }
  | { tipo: "ponte" }
  | { tipo: "cor"; fase: "entradas" | "pesos" }
  | { tipo: "soma" }
  | { tipo: "ativacao" }
  | { tipo: "revisao" }
  | { tipo: "teste-cor"; fase: "soma" | "acende" }
  | { tipo: "peso"; entrada: number; peso: number; interativo?: boolean; noLab?: boolean }
  | { tipo: "reta"; naFaixa: boolean }
  | { tipo: "curva"; soma: number; interativo?: boolean; marcos?: boolean }
  | { tipo: "painel-lab" }
  | { tipo: "montagem"; fase: "blocos" | "fios" | "todos" | "solta" | "basica" };

/**
 * A conta do passo. "peso" e "sigmoide" acompanham o controle deslizante do palco;
 * "sigmoide-passos" mostra a conta da sigmoide em três passos para uma soma fixa.
 */
export type Conta = { linhas: string[]; nota?: string } | { dinamica: "peso" | "sigmoide" } | { dinamica: "sigmoide-passos"; soma: number };

export type Passo = {
  /** Assunto do passo, ao lado do número ("Passo 5 de 10 · Neurônio artificial"). */
  assunto?: string;
  titulo: string;
  texto?: string[];
  /** Quadro "No dia a dia": a analogia ao lado da conta de verdade (docs/07-guia-de-conteudo.md). */
  diaADia?: string;
  /** "Na IA": o nome técnico e onde fica no laboratório. */
  naIA?: string;
  /** "Termos deste passo": os nomes técnicos que o aluno leva. */
  termos?: string[];
  visual: Visual;
  conta?: Conta;
  /** "Onde a ideia quebra": toda metáfora tem um limite (docs/07-guia-de-conteudo.md). */
  quebra?: { titulo: string; texto: string };
  /** Bloco fechado por padrão, para quem quiser ver a fórmula (o passo não depende dele). */
  paraQuemQuiser?: { titulo: string; formula: string; nota?: string };
};

export type Teste = {
  pergunta: string;
  subtitulo?: string;
  /** Com `detalhe`, cada opção preenche duas lacunas de uma vez (ex.: z e a certeza). */
  opcoes: { texto: string; detalhe?: string; certa?: boolean }[];
  explicacao: string;
  /** A conta que a Aqua mostra depois da resposta, certa ou errada. */
  conta?: string[];
  /** Só na última pergunta: o resumo do fim e o convite para o laboratório. */
  aprendeu?: string[];
  noLab?: string;
  /** Palco do teste. Sem ele, o palco mostra a Aqua com a lâmpada. */
  visual?: Visual;
};

export type Tutorial = {
  slug: string;
  numero: string;
  titulo: string;
  descricao: string;
  minutos: number;
  passos: Passo[];
  /** O teste rápido: perguntas fáceis, uma por tela, de cabeça. */
  testes: Teste[];
};

export const tutoriais: Tutorial[] = [
  {
    slug: "neuronio",
    numero: "01",
    titulo: "O neurônio",
    descricao: "Do neurônio do seu cérebro à continha que a IA faz, com a Aqua separando laranja de azul.",
    minutos: 8,
    passos: [
      {
        assunto: "A inspiração",
        titulo: "A ideia veio do cérebro",
        texto: [
          "Um neurônio do cérebro recebe sinais pelos dendritos e junta tudo no corpo celular.",
          "Se o total passar de um limiar, ele dispara um sinal pelo axônio. Se não passar, fica quieto.",
        ],
        termos: ["dendritos", "corpo celular", "axônio", "limiar"],
        visual: { tipo: "cerebro" },
      },
      {
        assunto: "A inspiração",
        titulo: "A Aqua aprendendo cores",
        texto: [
          "A Aqua quer separar laranja de azul. Toda cor é uma mistura de vermelho, verde e azul. Na 1ª vez ela presta a mesma atenção nos três e erra.",
          "A cada tentativa, as ligações que ajudam ficam fortes: muito vermelho indica laranja, muito azul indica que não é. O verde, que aparece nos dois, fica fraco. No cérebro, essas ligações são sinapses.",
        ],
        termos: ["sinapse", "ligação forte", "ligação fraca"],
        visual: { tipo: "cores" },
      },
      {
        assunto: "História",
        titulo: "Do cérebro à matemática",
        texto: [
          "1943: McCulloch e Pitts transformam o neurônio numa conta: soma as entradas e dispara se passar de um limiar.",
          "1958: Rosenblatt cria o perceptron, que aprende os próprios pesos.",
          "1986: a retropropagação passa a treinar redes com várias camadas.",
        ],
        termos: ["neurônio de McCulloch-Pitts", "perceptron", "retropropagação (backpropagation)"],
        visual: { tipo: "historia" },
      },
      {
        assunto: "A ponte",
        titulo: "Cérebro × IA × laboratório",
        texto: ["O neurônio artificial guarda só a ideia do biológico. Cada parte virou um pedaço da conta, e cada pedaço aparece em algum lugar do laboratório."],
        quebra: { titulo: "Onde a comparação quebra", texto: "O neurônio da IA não tem nada de vivo: é só multiplicação e soma." },
        termos: ["neurônio artificial", "entradas", "pesos", "soma ponderada", "função de ativação"],
        visual: { tipo: "ponte" },
      },
      {
        assunto: "Neurônio artificial",
        titulo: "Entradas: o vetor x",
        diaADia:
          "Toda cor da tela é uma mistura de vermelho, verde e azul, cada um de 0 a 1. Este laranja tem muito vermelho (1,00), um pouco de verde (0,55) e nada de azul (0,00).",
        naIA: "Essa lista de números é o vetor de entrada x = (x₁, x₂, x₃). Cada número é uma característica (feature). É o que o bloco Entrada manda para a rede.",
        termos: ["vetor de entrada", "feature (característica)"],
        visual: { tipo: "cor", fase: "entradas" },
      },
      {
        assunto: "Neurônio artificial",
        titulo: "Pesos: wᵢ · xᵢ",
        diaADia:
          "A Aqua não confia igual em tudo. Muito vermelho? Forte sinal de laranja (2,00). Verde aparece nos dois, vale pouco (0,50). Muito azul? Sinal contra (−2,00). Como pedir opinião a quem entende mais.",
        naIA: "Cada entrada xᵢ é multiplicada pelo seu peso wᵢ. Positivo reforça (verde), negativo atrapalha (vermelho), perto de 0 quase não conta.",
        termos: ["peso (w)", "produto wᵢ·xᵢ"],
        visual: { tipo: "cor", fase: "pesos" },
      },
      {
        assunto: "Neurônio artificial",
        titulo: "Soma ponderada",
        diaADia:
          "Lembra da média da escola? A prova vale mais que o trabalho: cada nota vezes o quanto ela vale, e soma tudo. A Aqua faz igual com o vermelho, o verde e o azul. Deu 2,28: tudo indica laranja.",
        naIA: "Multiplica cada entrada pelo seu peso e soma tudo. A IA chama essa soma de z.",
        termos: ["soma ponderada", "z"],
        visual: { tipo: "soma" },
      },
      {
        assunto: "Neurônio artificial",
        titulo: "Função de ativação",
        diaADia:
          "Agora a Aqua decide. Se a soma deu negativa, o detector nem acende: passa 0. Se deu positiva, acende com essa força. O laranja deu 2,28: acendeu!",
        naIA: "Essa regra se chama ReLU: soma positiva passa igual, negativa vira 0. É o que os neurônios do meio fazem no laboratório.",
        termos: ["função de ativação", "ReLU"],
        visual: { tipo: "ativacao" },
      },
      {
        assunto: "Revisão",
        titulo: "Tudo junto, com a Aqua",
        diaADia:
          "Olhar, confiar mais em umas coisas, juntar tudo e decidir. Você faz igual quando decide se leva o guarda-chuva: olha o céu, confia mais na previsão, junta tudo e decide.",
        naIA: "Entradas vezes pesos, soma, e a regra decide. No laboratório, cada neurônio faz essa conta quando você clica em Rodar.",
        paraQuemQuiser: { titulo: "Para quem quiser: a fórmula", formula: "a = f(Σ wᵢ·xᵢ)", nota: "Σ quer dizer “some tudo”; f é a regra que decide (aqui, a ReLU)." },
        termos: ["entradas", "pesos", "soma ponderada", "ativação"],
        visual: { tipo: "revisao" },
      },
    ],
    testes: [
      {
        pergunta: "Quanto dá a soma?",
        subtitulo: "Uma cor nova, roxo, no mesmo detector de laranja.",
        opcoes: [{ texto: "3,00" }, { texto: "−1,00", certa: true }, { texto: "1,00" }],
        explicacao: "Isso! Deu −1,00. O azul, com peso negativo, puxou para baixo.",
        conta: ["0,50 × 2,00 = 1,00", "0,00 × 0,50 = 0,00", "1,00 × −2,00 = −2,00", "1,00 + 0,00 − 2,00 = −1,00"],
        visual: { tipo: "teste-cor", fase: "soma" },
      },
      {
        pergunta: "O detector acende?",
        subtitulo: "A soma do roxo deu −1,00.",
        opcoes: [{ texto: "Sim, passa −1,00" }, { texto: "Não, passa 0", certa: true }, { texto: "Sim, passa 1,00" }],
        explicacao: "Isso! A soma deu negativa, então a ReLU passa 0. Para o detector de laranja, roxo não é laranja.",
        conta: ["soma −1,00 é negativa", "ReLU: negativa vira 0"],
        aprendeu: ["De onde veio a ideia", "Entradas e pesos", "A soma ponderada", "A função de ativação"],
        noLab: "Abra a montagem básica, clique em Rodar e use Próximo: o 1º neurônio da Camada 1 é este detector de laranja, fazendo esta mesma conta.",
        visual: { tipo: "teste-cor", fase: "acende" },
      },
    ],
  },
  {
    slug: "pesos",
    numero: "02",
    titulo: "Os pesos",
    descricao: "Verde reforça, vermelho atrapalha. A espessura mostra a força.",
    minutos: 5,
    passos: [
      {
        titulo: "O peso é o volume da linha",
        texto: [
          "Cada linha tem um número: o peso. Ele diz quanto aquela entrada importa para o neurônio da frente.",
          "Aqui, a entrada vale 1,00 e o peso é 0,80. O que chega no neurônio é 1,00 × 0,80.",
        ],
        visual: { tipo: "peso", entrada: 1, peso: 0.8 },
        conta: { dinamica: "peso" },
      },
      {
        titulo: "Verde reforça",
        texto: [
          "Peso positivo: a linha fica verde e empurra a soma para cima.",
          "Quanto maior o peso, mais grossa a linha. Peso 2,00 dobra o que entrou.",
        ],
        visual: { tipo: "peso", entrada: 1, peso: 2 },
        conta: { dinamica: "peso" },
      },
      {
        titulo: "Vermelho atrapalha",
        texto: [
          "Peso negativo: a linha fica vermelha e puxa a soma para baixo.",
          "É assim que um neurônio aprende a dizer “isso aqui conta contra”.",
        ],
        visual: { tipo: "peso", entrada: 1, peso: -0.6 },
        conta: { dinamica: "peso" },
      },
      {
        titulo: "Mexa você",
        texto: [
          "Arraste o peso e veja a linha mudar de cor e de espessura, e a bolinha mudar de valor.",
          "Com peso 0, a linha quase some: a entrada é ignorada.",
        ],
        visual: { tipo: "peso", entrada: 1, peso: 0.5, interativo: true },
        conta: { dinamica: "peso" },
      },
      {
        titulo: "Onde fica no laboratório",
        texto: [
          "No laboratório, o número do peso fica escrito na própria linha.",
          "Dê dois cliques nele para editar. Em redes pequenas, mexer à mão ajuda a entender; nas grandes, quem ajusta é o Treinar.",
        ],
        visual: { tipo: "peso", entrada: 1, peso: 0.8, noLab: true },
        quebra: {
          titulo: "Onde a ideia de “volume” quebra",
          texto: "Um volume não fica negativo. O peso fica: aí ele não abaixa a entrada, ele vira o sinal dela.",
        },
      },
    ],
    testes: [
      {
        pergunta: "Uma entrada 0,50 passa por um peso −1,00. O que chega no neurônio?",
        opcoes: [{ texto: "0,50" }, { texto: "−0,50", certa: true }, { texto: "0" }],
        explicacao: "Isso. 0,50 × −1,00 = −0,50: a bolinha chega vermelha e puxa a soma para baixo.",
        aprendeu: ["O peso multiplica", "Verde soma, vermelho tira", "Espessura é a força", "Duplo clique edita"],
        noLab: "Na montagem básica, dê dois cliques num peso, troque o sinal e rode de novo. Veja a resposta mudar.",
      },
    ],
  },
  {
    slug: "sigmoide",
    numero: "03",
    titulo: "A sigmoide",
    descricao: "Como qualquer soma vira um número entre 0 e 1.",
    minutos: 6,
    passos: [
      {
        titulo: "A soma pode dar qualquer coisa",
        texto: [
          "No último neurônio, a soma pode dar −3,40, 0,33, 1,20 ou até 8,70. Não tem limite.",
          "Mas a Saída quer responder algo como “quanto isso é laranja”, de 0 (nada) a 1 (com certeza).",
        ],
        visual: { tipo: "reta", naFaixa: false },
      },
      {
        titulo: "Tudo cabe entre 0 e 1",
        texto: [
          "Cada soma é levada para um ponto entre 0 e 1. Soma baixa cai perto de 0, soma alta cai perto de 1.",
          "Repare que a ordem continua a mesma: quem estava mais à direita continua mais à direita.",
        ],
        visual: { tipo: "reta", naFaixa: true },
      },
      {
        titulo: "Uma curva em forma de S",
        texto: [
          "Quem faz isso é esta curva. A Aqua está onde a soma 1,20 cai: ela sai do outro lado valendo 0,77.",
          "Somas muito negativas ficam perto de 0. Somas muito positivas ficam perto de 1. Nunca passa disso.",
        ],
        visual: { tipo: "curva", soma: 1.2, interativo: true },
        conta: { dinamica: "sigmoide" },
        quebra: {
          titulo: "Onde essa ideia quebra",
          texto: "Parece que a curva joga informação fora, mas a ordem nunca se perde: soma maior sempre dá resultado maior. Só os extremos ficam apertados.",
        },
      },
      {
        titulo: "A conta, passo a passo",
        texto: [
          "Primeiro a ideia: soma alta chega perto de 1, soma baixa chega perto de 0, e soma 0 dá exatamente 0,50. É a curva em S ao lado.",
          "Agora a fórmula de verdade: 1 ÷ (1 + e⁻ˢᵒᵐᵃ). O e é um número fixo, como o π: vale mais ou menos 2,718. A calculadora faz essa parte.",
        ],
        visual: { tipo: "curva", soma: 3.41, marcos: true },
        conta: { dinamica: "sigmoide-passos", soma: 3.41 },
        quebra: {
          titulo: "Por que o sinal troca?",
          texto: "Por causa do menos na frente da soma. Soma alta vira e elevado a um número negativo, quase 0, e sobra 1 ÷ 1, perto de 1. Soma baixa vira um número enorme embaixo, e o resultado fica perto de 0.",
        },
      },
      {
        titulo: "No laboratório",
        texto: [
          "Ao rodar, o último passo de cada resposta mostra esta conta no painel, com a soma de verdade da sua rede.",
          "A Saída lê o resultado: perto de 1 é uma resposta, perto de 0 é a outra.",
        ],
        visual: { tipo: "painel-lab" },
      },
    ],
    testes: [
      {
        pergunta: "Uma soma de −5 passa pela sigmoide. O que sai?",
        opcoes: [{ texto: "Um número perto de 0", certa: true }, { texto: "−5, igual entrou" }, { texto: "Um número perto de 1" }],
        explicacao: "Isso. Somas muito negativas caem na parte de baixo da curva: 1 ÷ (1 + 148) ≈ 0,01.",
        aprendeu: ["A curva em S", "Sempre entre 0 e 1", "A conta com o e", "Onde aparece no lab"],
        noLab: "Abra a montagem básica, clique em Rodar e avance até o último passo: é a sigmoide acontecendo de verdade.",
      },
    ],
  },
  {
    slug: "camadas-e-fios",
    numero: "04",
    titulo: "Camadas e fios",
    descricao: "Monte a sua rede no laboratório ligando blocos com fios.",
    minutos: 5,
    passos: [
      {
        titulo: "Tudo começa com blocos",
        texto: [
          "No laboratório você arrasta blocos: a Entrada (de onde vêm os números), a Camada (um grupo de neurônios) e a Saída (a resposta).",
          "Soltos assim, eles ainda não fazem nada.",
        ],
        visual: { tipo: "montagem", fase: "blocos" },
      },
      {
        titulo: "O fio dá a ordem",
        texto: [
          "Puxe um fio da bolinha à direita de um bloco até a bolinha à esquerda do próximo.",
          "Quem decide a ordem das contas é o fio, não a posição na tela. Pode deixar os blocos onde quiser.",
        ],
        visual: { tipo: "montagem", fase: "fios" },
      },
      {
        titulo: "Um fio, todas as linhas",
        texto: [
          "Um fio liga bloco com bloco. Por dentro, cada número da Entrada se liga a cada neurônio da Camada, sozinho.",
          "Por isso não existe ligar neurônio por neurônio: 3 entradas × 2 neurônios = 6 linhas, cada uma com o seu peso.",
        ],
        visual: { tipo: "montagem", fase: "todos" },
      },
      {
        titulo: "Camada sem fio fica de fora",
        texto: [
          "Esqueceu o fio de uma camada? Ao clicar em Rodar, ela fica com a borda tracejada em âmbar.",
          "É só um aviso: a rodada continua, mas aquela camada fica de fora das contas.",
        ],
        visual: { tipo: "montagem", fase: "solta" },
      },
      {
        titulo: "A montagem básica",
        texto: [
          "A montagem básica tem duas camadas: a primeira com 2 neurônios (um detector de laranja e um de azul) e a segunda com 1, que decide.",
          "Mais camadas deixam a rede combinar ideias, mas também deixam as contas mais difíceis de acompanhar.",
        ],
        visual: { tipo: "montagem", fase: "basica" },
      },
    ],
    testes: [
      {
        pergunta: "Você arrastou a Camada 2 para a esquerda da Camada 1, sem mexer nos fios. A ordem das contas muda?",
        opcoes: [{ texto: "Sim, agora a Camada 2 vem antes" }, { texto: "Não, quem manda é o fio", certa: true }, { texto: "A rede para de funcionar" }],
        explicacao: "Isso. A posição na tela não importa: a ordem vem dos fios, como no Tinkercad.",
        aprendeu: ["Entrada, Camada e Saída", "O fio dá a ordem", "Todos com todos", "Camada solta é aviso"],
        noLab: "Crie um projeto Vazio e monte Entrada → Camada → Saída com dois fios. Depois clique em Rodar.",
      },
    ],
  },
];

/** Os próximos tutoriais, ainda sem conteúdo. "Como a rede aprende" depende do Treinar. */
export const tutoriaisEmBreve = [
  {
    numero: "05",
    titulo: "Como a rede aprende",
    descricao: "O erro volta pela rede e cada peso é ajustado um pouco. É o que o botão Treinar faz.",
  },
];

export function buscarTutorial(slug: string): Tutorial | undefined {
  return tutoriais.find((t) => t.slug === slug);
}

/** Número de telas do tutorial: os passos mais as perguntas do teste rápido. */
export function totalDePassos(t: Tutorial): number {
  return t.passos.length + t.testes.length;
}
