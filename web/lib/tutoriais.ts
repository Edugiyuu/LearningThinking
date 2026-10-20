// Conteúdo dos tutoriais (frames "Tutoriais · Desktop" e "Tutorial · O neurônio · Desktop" no Figma).
// Cada tutorial é uma lista de passos; cada passo muda uma coisa só no palco (a visualização à esquerda).
// O último passo é sempre o teste rápido. As contas batem com o laboratório: no meio da rede o
// neurônio acende (ReLU: passa a soma se ela for positiva, senão 0); no fim, a soma passa pela sigmoide.

export type Visual =
  | { tipo: "cerebro"; fase: "partes" | "dispara" | "sinapse" | "compara" }
  | { tipo: "neuronio"; fase: "entradas" | "multiplica" | "soma" | "decide" }
  | { tipo: "peso"; entrada: number; peso: number; interativo?: boolean; noLab?: boolean }
  | { tipo: "reta"; naFaixa: boolean }
  | { tipo: "curva"; soma: number; interativo?: boolean; marcos?: boolean }
  | { tipo: "painel-lab" }
  | { tipo: "montagem"; fase: "blocos" | "fios" | "todos" | "solta" | "basica" };

/** A conta do passo. "peso" e "sigmoide" acompanham o controle deslizante do palco. */
export type Conta = { linhas: string[]; nota?: string } | { dinamica: "peso" | "sigmoide" };

export type Passo = {
  titulo: string;
  texto: string[];
  visual: Visual;
  conta?: Conta;
  /** "Onde a ideia quebra": toda metáfora tem um limite (docs/07-guia-de-conteudo.md). */
  quebra?: { titulo: string; texto: string };
};

export type Teste = {
  pergunta: string;
  opcoes: { texto: string; certa?: boolean }[];
  explicacao: string;
  aprendeu: string[];
  noLab: string;
};

export type Tutorial = {
  slug: string;
  numero: string;
  titulo: string;
  descricao: string;
  minutos: number;
  passos: Passo[];
  teste: Teste;
};

export const tutoriais: Tutorial[] = [
  {
    slug: "neuronio",
    numero: "01",
    titulo: "O neurônio",
    descricao: "Do neurônio do seu cérebro à continha que a IA faz.",
    minutos: 7,
    passos: [
      {
        titulo: "Começa no seu cérebro",
        texto: [
          "Seu cérebro tem cerca de 86 bilhões de neurônios. Cada um é uma célula que recebe sinais de outros neurônios e decide se passa um sinal adiante.",
          "Os dendritos recebem os sinais, o corpo da célula junta tudo e o axônio leva a resposta até os próximos neurônios.",
        ],
        visual: { tipo: "cerebro", fase: "partes" },
      },
      {
        titulo: "Ele dispara ou fica quieto",
        texto: [
          "Os sinais que chegam se somam no corpo da célula. Se a soma passar de um limite, o neurônio dispara: um pulso elétrico corre pelo axônio.",
          "Se não passar, ele fica quieto. É tudo ou nada.",
        ],
        visual: { tipo: "cerebro", fase: "dispara" },
      },
      {
        titulo: "As ligações têm força",
        texto: [
          "Onde um neurônio encosta no outro existe a sinapse. Algumas ligações são fortes e passam muito sinal; outras são fracas e passam pouco.",
          "Aprender, no cérebro, é em boa parte isso: deixar algumas ligações mais fortes e outras mais fracas.",
        ],
        visual: { tipo: "cerebro", fase: "sinapse" },
      },
      {
        titulo: "A IA copiou a ideia",
        texto: [
          "Nos anos 1940 e 1950, pesquisadores transformaram essa ideia em matemática. O neurônio da IA guarda só o esqueleto do original.",
          "Entradas no lugar dos dendritos, pesos no lugar das sinapses, uma soma no lugar do corpo da célula e uma regra para acender no lugar do disparo.",
        ],
        visual: { tipo: "cerebro", fase: "compara" },
        quebra: {
          titulo: "Onde a comparação com o cérebro quebra",
          texto: "O neurônio de verdade é uma célula viva, com química, pulsos no tempo e milhares de ligações. O da IA é só multiplicação e soma: uma inspiração, não uma cópia.",
        },
      },
      {
        titulo: "Agora, a versão da IA",
        texto: [
          "No lugar de sinais elétricos, ela recebe números. Aqui, uma cor: quanto de vermelho (R), de verde (G) e de azul (B) ela tem, de 0 a 1.",
          "No laboratório, esses números saem do bloco Entrada. A Aqua faz o papel do neurônio.",
        ],
        visual: { tipo: "neuronio", fase: "entradas" },
      },
      {
        titulo: "Cada número é multiplicado",
        texto: [
          "Cada linha tem um peso, que faz o papel da sinapse: diz quão forte é aquela ligação. O número que passa por ela é multiplicado pelo peso.",
          "Peso positivo deixa a bolinha verde; negativo, vermelha. Repare no G: 1,00 × −0,40 vira −0,40.",
        ],
        visual: { tipo: "neuronio", fase: "multiplica" },
        conta: { linhas: ["R: 0,44 × 0,60 = 0,26", "G: 1,00 × −0,40 = −0,40", "B: 0,93 × 0,50 = 0,47"] },
      },
      {
        titulo: "Tudo é somado",
        texto: [
          "As três bolinhas entram no neurônio e viram um número só: a soma. É o corpo da célula juntando os sinais.",
          "É exatamente o que o painel de contas do laboratório mostra, uma parcela de cada vez.",
        ],
        visual: { tipo: "neuronio", fase: "soma" },
        conta: { linhas: ["0,26 − 0,40 + 0,47 = 0,33"] },
      },
      {
        titulo: "E decide se acende",
        texto: [
          "É o disparo do cérebro em forma de conta: se a soma for positiva, o neurônio acende e passa a soma adiante. Se for negativa, passa 0.",
          "Essa regra se chama ReLU. Aqui deu 0,33, então ele acende. No último neurônio da rede a regra é outra, a sigmoide (tutorial 03).",
        ],
        visual: { tipo: "neuronio", fase: "decide" },
        conta: { linhas: ["0,33 é positivo → passa 0,33"], nota: "Se a soma desse −0,20, ele passaria 0." },
      },
    ],
    teste: {
      pergunta: "Entradas 1,00 e 0,50, pesos 0,40 e 0,20. Qual é a soma?",
      opcoes: [{ texto: "0,60" }, { texto: "0,50", certa: true }, { texto: "1,10" }],
      explicacao: "Isso. 1,00 × 0,40 = 0,40 e 0,50 × 0,20 = 0,10. Somando: 0,50.",
      aprendeu: ["Como o neurônio do cérebro funciona", "A sinapse virou o peso", "O neurônio da IA soma", "E decide se acende (ReLU)"],
      noLab: "Abra a montagem básica, clique em Rodar e use Próximo: cada parcela aparece uma por vez, igual a aqui.",
    },
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
    teste: {
      pergunta: "Uma entrada 0,50 passa por um peso −1,00. O que chega no neurônio?",
      opcoes: [{ texto: "0,50" }, { texto: "−0,50", certa: true }, { texto: "0" }],
      explicacao: "Isso. 0,50 × −1,00 = −0,50: a bolinha chega vermelha e puxa a soma para baixo.",
      aprendeu: ["O peso multiplica", "Verde soma, vermelho tira", "Espessura é a força", "Duplo clique edita"],
      noLab: "Na montagem básica, dê dois cliques num peso, troque o sinal e rode de novo. Veja a resposta mudar.",
    },
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
        titulo: "A conta por trás",
        texto: [
          "Essa curva é a sigmoide, e a conta dela é 1 ÷ (1 + e^(−soma)).",
          "O e vale mais ou menos 2,718. Quando a soma cresce, e^(−soma) encolhe até quase 0, e o resultado chega perto de 1 ÷ 1 = 1.",
        ],
        visual: { tipo: "curva", soma: -2, marcos: true },
        conta: {
          linhas: ["soma −2,00 → 1 ÷ (1 + 7,39) = 0,12", "soma 0,00 → 1 ÷ (1 + 1,00) = 0,50", "soma 4,00 → 1 ÷ (1 + 0,02) = 0,98"],
          nota: "e ≈ 2,718 é um número fixo da matemática, como o π.",
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
    teste: {
      pergunta: "Uma soma de −5 passa pela sigmoide. O que sai?",
      opcoes: [{ texto: "Um número perto de 0", certa: true }, { texto: "−5, igual entrou" }, { texto: "Um número perto de 1" }],
      explicacao: "Isso. Somas muito negativas caem na parte de baixo da curva: 1 ÷ (1 + 148) ≈ 0,01.",
      aprendeu: ["A curva em S", "Sempre entre 0 e 1", "A conta com o e", "Onde aparece no lab"],
      noLab: "Abra a montagem básica, clique em Rodar e avance até o último passo: é a sigmoide acontecendo de verdade.",
    },
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
    teste: {
      pergunta: "Você arrastou a Camada 2 para a esquerda da Camada 1, sem mexer nos fios. A ordem das contas muda?",
      opcoes: [{ texto: "Sim, agora a Camada 2 vem antes" }, { texto: "Não, quem manda é o fio", certa: true }, { texto: "A rede para de funcionar" }],
      explicacao: "Isso. A posição na tela não importa: a ordem vem dos fios, como no Tinkercad.",
      aprendeu: ["Entrada, Camada e Saída", "O fio dá a ordem", "Todos com todos", "Camada solta é aviso"],
      noLab: "Crie um projeto Vazio e monte Entrada → Camada → Saída com dois fios. Depois clique em Rodar.",
    },
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

/** Número de telas do tutorial: os passos mais o teste rápido. */
export function totalDePassos(t: Tutorial): number {
  return t.passos.length + 1;
}
