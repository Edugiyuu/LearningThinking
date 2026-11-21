# ADR-0038 · Home com rolagem: partículas que mudam de forma

- **Status:** Aceita. Valem a "Atualização 5" (a Home igual aos quadros do Figma), a 6 (desenho leve, hover nos cards, só GSAP; sem a parte dos ventos), a 7 (formas paradas e nítidas, rolagem suave com o ScrollSmoother), a 8 (sem travadas, menu fixo; a explosão saiu na 15), a 9 (o mouse espalha os pontos), a 10 (sem mudar de cor, raio de 100 px), a 11 (o topo da primeira versão, com o campo de partículas embaixo), a 12 (pontos espalhados pelo topo inteiro), a 13 (pontos afastados dos textos e botões do topo), a 14 (afastamento natural, sem cara de bloco) e a 15 (viagem fluida, sem explosão).
- **Data:** 2026-11-19
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0036](0036-cena-animada-no-hero.md) (a cena do topo, que continua tocando sozinha), [ADR-0018](0018-primeira-entrega-design.md) (a Home)
- **Figma:** página "Home com rolagem (partículas)"

## Contexto

O autor quer a Home "bem tecnológica, conforme vai descendo" e mostrou como exemplo o site da iorq. Lá, uma nuvem de partículas em 3D muda de forma a cada seção da rolagem. Ele deixou claro que é só uma referência de movimento: **o fundo continua claro** e as cores continuam as do site.

## Proposta

Uma nuvem de cerca de 1.800 partículas fica **presa atrás das seções** da Home. Cada seção tem uma forma, sempre algo que o laboratório já tem:

| Seção | Forma das partículas |
|---|---|
| Topo | o campo de neurônios espalhados com a Aqua (a cena da ADR-0036) |
| 01 · Aprenda o conceito | **um neurônio**: três entradas, pesos verde e vermelho, soma e saída |
| 02 · Monte com as mãos | **camadas**: 3, 4, 4 e 2 neurônios ligados |
| 03 · Veja por dentro | **os números atravessando a rede**: pontos azuis passando de camada em camada; as camadas já percorridas ficam acesas e a saída espera apagada |
| Como funciona | **os 3 cards**: as partículas desenham o contorno de cada card e a ilustração dele (a lâmpada, os blocos, o Claude pensando na Aqua) |
| Explore | **os cards dos temas**: o card "Redes neurais" com borda aqua e a Aqua acordada; os dois "em breve" com borda cinza e a Aqua dormindo |
| Fim · "Pronto para ver por dentro?" | **a Aqua** feita de partículas, com o olho feliz |

O **texto dos cards** continua sendo texto de verdade (para ler, copiar e para leitores de tela) e aparece quando o card termina de se formar. O **menu do topo** fica igual ao do site.

Como anda:

- **Morph:** entre uma seção e a próxima, cada partícula anda da posição dela numa forma até a posição dela na outra. Todas as formas têm o mesmo número de partículas para isso funcionar; as que sobram ficam como poeira cinza em volta.
- **A rolagem manda:** o ScrollTrigger do GSAP com *scrub* liga a posição da rolagem ao andamento da troca. Rolar para cima desfaz.
- **O topo continua tocando sozinho** (a onda da ADR-0036). A rolagem só começa a mandar quando a pessoa desce.
- **Respiração leve:** as partículas tremem um pouco sozinhas, para a cena nunca ficar parada.
- **Textos:** o texto de cada seção sobe e aparece quando a forma chega; o da seção anterior some.
- **Reduzir movimento** (`prefers-reduced-motion`): as formas trocam só com um esmaecer, sem viagem, e nada se mexe sozinho.
- **Celular:** a nuvem fica atrás do texto, menor e mais clara.

Isso muda a regra das animações de destaque: antes o autor tinha recusado a cena do topo andando com a rolagem (ADR-0036, atualização 2). Agora o pedido é a **Home inteira** andar com a rolagem, e o topo continua tocando sozinho.

## Ainda a decidir no código

- **Canvas 2D ou WebGL.** WebGL é o desenho feito pela placa de vídeo e aguenta muito mais partículas, mas traria uma biblioteca nova (por exemplo, a three.js). Com 1.800 partículas, o canvas 2D deve dar conta. Medir no celular antes de escolher.
- **Passagem do topo para a nuvem:** os neurônios da cena do topo viram as primeiras partículas, ou a nuvem aparece por cima.

## Atualização (2026-11-19)

O autor aprovou a ideia e pediu três ajustes:

1. **O menu continua o mesmo** do site. Nos quadros do Figma havia só o nome; agora está o menu de verdade.
2. **As partículas também formam os cards** de "Como funciona" e do "Explore". As ilustrações dos cards (`web/public/ilustracoes/*.svg`) são lidas e viram pontos: cada retângulo da ilustração recebe partículas da cor dele.
3. **Sai a sigmoide.** Nem toda rede neural usa a sigmoide: muitas usam ReLU ou outra função de ativação. "Veja por dentro" passa a mostrar os **números atravessando a rede**, a passagem para frente (*forward pass*: os números vão da entrada até a saída, camada por camada), que vale para qualquer rede.

## Atualização 2: menos formas (2026-11-19) — vale esta

O autor viu a segunda rodada e não gostou da maioria das telas:

- Neurônio, camadas e números passando parecem **tudo a mesma coisa** (a tela dos números era quase igual à das camadas) e dão a impressão de que o LearningThinking é uma coisa só.
- **Os cards em partículas** (Como funciona e Explore) também saíram. Os cards voltam a ser os normais do site.

Ficaram as três telas que ele aprovou, mais uma nova:

| Momento | Forma das partículas |
|---|---|
| Topo | o campo de neurônios espalhados com a Aqua (igual) |
| Rolando | as partículas **viajando**, desmanchadas, entre uma forma e outra (igual) |
| No meio da Home | **o Claude no notebook pensando na Aqua**, grande: a ilustração do card "Veja por dentro" feita de partículas |
| Fim | **a Aqua** feita de partículas, com o olho feliz (igual) |

A ilustração grande é montada com **pontos em grade** (como a Aqua do fim): cada pixel do desenho original vira alguns pontos alinhados, então ele continua parecendo pixel-art de perto. Pontos soltos ao acaso deixavam o desenho ralo e borrado quando ampliado.

As telas descartadas ficam no Figma, numa fileira separada chamada "Descartadas", só como histórico.

## Atualização 3: telas recriadas em 3 versões (2026-11-19)

O autor esperava que as telas que ele não curtiu fossem **refeitas**, e não só tiradas. Para cada uma foram desenhadas três versões novas no Figma (fileira "Recriadas", abaixo das "Descartadas"). Nos cards, o texto e a borda continuam os normais do site; as partículas ficam por trás. Cada forma agora tem um jeito próprio, para não parecerem todas a mesma rede:

| Tela | A | B | C |
|---|---|---|---|
| 01 · Neurônio | **Balança**: pesos verdes e vermelhos em cada prato, a soma (Σ, a soma ponderada) em cima | **Neurônio gigante**: as entradas chegam como cometas e sai um feixe só | **Mostrador**: números entram, o ponteiro mostra quanto o neurônio acendeu (a ativação) |
| 02 · Camadas | **Peças**: cada camada é um bloco; a última está sendo arrastada até o encaixe | **Bancada**: a grade do laboratório e a mão ligando a última conexão | **Torres**: cada camada é uma pilha; a altura mostra quantos neurônios tem |
| 03 · Números | **Rio de números**: o próprio número viaja e muda a cada camada | **Lupa**: a rede apagada e a lupa mostrando o número passando | **Mapa de calor** (*heatmap*: cor mais cheia = número maior), com uma faixa varrendo a rede |
| Como funciona | **Trilha** costurando os 3 passos | **01 02 03** grandes em partículas, o passo da vez aceso | **Nuvem** em volta do card que está na tela |
| Explore | **Constelação**: redes neurais é a estrela acesa | **Raízes** saindo do card das redes neurais para os temas em breve | **Em construção**: os temas em breve ainda se montando, borda tracejada |

Esperando o autor escolher uma por fileira (ou nenhuma).

## Atualização 4: as escolhidas (2026-11-19) — vale esta

O autor escolheu uma versão por fileira (no Figma, os quadros começam com "✓ Escolhida"):

| Seção | Forma das partículas |
|---|---|
| Topo | o campo de neurônios espalhados com a Aqua (igual) |
| Rolando | as partículas viajando, desmanchadas, entre uma forma e outra (igual) |
| 01 · Aprenda o conceito | **Neurônio gigante com cometas**: o neurônio ocupa a metade da tela, as entradas chegam como cometas (verdes e vermelhas, a cor do peso) e sai um feixe azul só |
| 02 · Monte com as mãos | **Bancada**: a grade de pontos do laboratório no fundo, neurônios quadrados em camadas e a mão (o cursor) ligando a última conexão |
| 03 · Veja por dentro | **Lupa na rede**: a rede fica apagada e uma lupa passa por ela, mostrando acesos os neurônios e o número que está passando por dentro |
| Entre "Veja por dentro" e "Como funciona" | **O Claude no notebook pensando na Aqua**, grande, em pontos em grade (igual à Atualização 2; o autor pediu para manter) |
| Como funciona | **Nuvem em volta do card da vez**: os 3 cards normais do site; as partículas se juntam em volta do card do passo que está na tela, os outros ficam com pouca poeira |
| Explore | **Temas se montando**: o card "Redes neurais" pronto, com a borda aqua firme; os cards "em breve" com borda tracejada e partículas ainda se juntando |
| Fim | a Aqua feita de partículas, com o olho feliz (igual) |

As outras versões ficam no Figma só como histórico.

## No código (2026-11-19)

- **Canvas 2D**, sem biblioteca nova: 1.800 partículas no computador e 900 no celular, desenhadas como quadradinhos de 2,6 px (combinam com a pixel-art). O WebGL não foi preciso.
- `web/components/nuvem-particulas.tsx`: o `<canvas>` fica preso atrás da página (`position: fixed`), e o conteúdo fica por cima. Cada seção marca a área do desenho com `data-forma`. O **ScrollTrigger** com *scrub* liga a rolagem a um número `p` (0 = primeira forma, 1 = segunda...), e um desenho por quadro, no relógio do GSAP, lê esse número. A forma fica parada enquanto a área dela passa pelo meio da tela, e a viagem acontece no caminho entre uma área e a outra.
- `web/components/nuvem-formas.ts`: as formas. O Claude pensando na Aqua é lido de `public/ilustracoes/veja-por-dentro.svg`, e a Aqua do fim usa a grade oficial dela; os dois viram **pontos em grade**.
- **Passagem do topo:** a forma do topo tem os pontos invisíveis em cima da cena do hero; eles aparecem quando começam a viajar. A cena do hero continua sendo a dela (ADR-0036).
- **Como funciona:** os 3 cards ficam lado a lado na mesma altura, então a vez de cada um é espalhada pela rolagem: a nuvem passa do card 1 para o 2 e depois para o 3.
- **Explore:** os cards "em breve" ganharam borda tracejada.
- **Fim:** a chamada final ficou só com o título, a Aqua de partículas e o botão (saíram a faixa colorida e as figuras paradas da Aqua e do Claude).
- **Textos** com `data-revelar` sobem e aparecem ao chegar na tela.
- **Reduzir movimento:** as formas trocam só com um esmaecer, sem viagem e sem tremer.
- A tela do Claude ficou **sem texto**: o título dela no Figma repetia o do "03 · Veja por dentro".

## Atualização 5: igual ao Figma, ponto por ponto (2026-11-19) — vale esta

O autor viu a primeira versão no código e pediu que ficasse **igual** aos quadros do Figma: o topo não tinha mudado, os cards não eram os do quadro e as formas estavam imprecisas (o "0.42" da lupa mal aparecia).

O que mudou (substitui os detalhes da seção "No código" acima onde eles conflitam):

- **Os pontos vêm do Figma.** `web/scripts/gerar-nuvem-home.py` gera `web/public/nuvem/home.json` com a posição, a cor, o tamanho e a transparência de cada ponto, em coordenadas do quadro de 1440 × 900:
  - as telas escolhidas (neurônio B, bancada B, lupa B, nuvem do card C, Explore C) saem do mesmo gerador que desenhou os quadros, com a mesma semente (o número que fixa o sorteio), então os pontos são os mesmos;
  - o topo, o Claude pensando na Aqua e a Aqua do fim são lidos dos SVGs exportados do Figma (`web/scripts/figma-nuvem/`).
  - Em "Como funciona" há três formas, uma para cada card da vez (a do card 02 é a do quadro).
- **A Home virou os quadros.** Cada seção tem a proporção do quadro (1440 × 900; o topo, 1440 × 820, porque o menu fica fora) e os textos e cards ficam nas mesmas posições e tamanhos, medidos em `cqw` (*container query width*: 1cqw = 1% da largura da seção). Assim a tela inteira escala junto com a largura do navegador. No celular, a mesma marcação vira uma coluna normal, e a nuvem fica embaixo do texto.
- **Topo como no Figma:** selo em texto, título de 80 px, o campo de partículas com a Aqua no meio e "Role para ver as partículas virarem uma rede ↓". Saíram a cena animada da ADR-0036 e os botões "Criar novo projeto" e "Ver tutoriais" (o "Criar novo projeto" continua no menu e no fim da Home).
- **Cards como no Figma:** brancos, com borda fina, número, título e texto, sem as ilustrações. Em "Como funciona", o card da vez ganha a borda aqua. No Explore, o card disponível tem borda aqua e os "em breve" têm borda tracejada, sem a Aqua desenhada nos cards.
- **O Claude pensando na Aqua** voltou com o texto do quadro ("Veja por dentro" / "Acompanhe cada número até virar a resposta.").
- **A seta do mouse da bancada** é um desenho cheio, como no quadro, e não partículas.
- **Textos do Explore:** continuam os do site ("Três coisas que uma rede neural faz.", "Classificar"...), que são mais novos que os do quadro (ADR-0035, B8). Só o visual segue o Figma.
- As partículas são quadradinhos com o tamanho de cada ponto do quadro, escalados pela largura.

## Atualização 6: fluida, viva, hover nos cards e só GSAP (2026-11-19) — vale esta

O autor achou a rolagem travando ("não está smooth"), os pontos "meio mortos" e pediu o card da vez por **hover**, tudo só com GSAP.

- **Desempenho.** Antes cada ponto trocava cor e transparência e era pintado sozinho (cerca de 2.800 pinturas por quadro), e as áreas eram medidas de novo a cada quadro. Agora:
  - os pontos são agrupados por cor e transparência (12 níveis) e cada grupo é pintado de uma vez só (um caminho com vários quadradinhos e um preenchimento), com algumas dezenas de pinturas por quadro;
  - a posição de cada área na página é medida uma vez (e de novo só quando a página muda de tamanho);
  - o canvas usa no máximo 1,5 pixel por pixel da tela (*devicePixelRatio*), o que já fica nítido e pesa menos.
  - Medido no modo de desenvolvimento, rolando a Home inteira a 1440 × 900: cerca de 57 quadros por segundo.
- **Pontos vivos.** Seis "ventos" são números que o GSAP leva de −1 a 1 e de volta, sem parar, cada um num ritmo (`gsap.fromTo` com `repeat: -1, yoyo: true`). Cada ponto é empurrado por dois deles em direções próprias (até uns 12 px no quadro) e acende e apaga um pouco com um terceiro. Com "reduzir movimento", os ventos ficam parados.
- **Como funciona com hover.** A rolagem para nessa seção numa forma só, com uma variante por card (a do card 02 é a do quadro). Passar o mouse sobre um card (ou tocar, ou focar pelo teclado) faz um tween do GSAP levar a nuvem até ele: os pontos viajam um pouco desmanchados, como na rolagem, e a borda do card vira aqua (também por tween, sem transição de CSS). A nuvem sai de onde está, mesmo no meio de outra troca.
- **Só GSAP.** Todo movimento da Home vem do GSAP: rolagem (ScrollTrigger), ventos, hover, textos aparecendo e o desenho no relógio do GSAP (`gsap.ticker`). Saíram as transições de CSS da Home.
- Os cards de "Como funciona" ficam com borda de 2 px (no quadro, 1,5 px nos apagados), para a borda não mudar de largura no hover.

## Atualização 7: formas paradas e nítidas, fluidez na rolagem (2026-11-20) — vale esta

O autor reclamou que os "ventos" da atualização 6 tiraram a nitidez (o "0.42" da lupa borrava) e explicou que a fluidez que ele quer é **na rolagem**. Olhando a iorq de novo até o fim:

- as formas ficam **paradas** quando estão formadas (duas fotos com 1 s de diferença mostram a mesma estrela); a logo do fim, os símbolos e os nomes são nítidos. Só a viagem entre formas se mexe;
- a suavidade vem do **ScrollSmoother** do GSAP (a página tem as caixas `smooth-wrapper` e `smooth-content`): a página desliza com inércia em vez de pular a cada giro da roda do mouse.

O que mudou (substitui a parte de "pontos vivos" da atualização 6):

- **Saíram os ventos e o piscar.** Formada, a forma fica parada: medido no navegador, nenhum pixel do desenho muda com a página parada.
- **Pontos em pixels inteiros:** cada quadradinho começa e termina num pixel inteiro da tela, então a borda não borra.
- **Rolagem suave:** a Home fica dentro de `#rolagem-suave` / `#rolagem-suave-conteudo` e o `ScrollSmoother.create({ smooth: 1.1 })` desliza a página. A nuvem usa a posição da página deslizando (`smoother.scrollTop()`), então a forma anda junto com o texto. O ScrollTrigger da troca de forma ficou com `scrub: true`, porque a inércia já vem do ScrollSmoother. Com "reduzir movimento", não há rolagem suave.
- Continuam do GSAP: a troca de forma na rolagem, o hover dos cards, os textos aparecendo e o desenho no `gsap.ticker`.

## Atualização 8: viagem com explosão, sem travadas e menu fixo (2026-11-20) — vale esta

O autor pediu três ajustes:

1. **A viagem estava só "de cima para baixo".** Na iorq os pontos vão para o lado, sobem, explodem e voltam. Agora cada ponto faz uma **curva de Bézier cúbica** (uma curva suave definida por quatro pontos: começo, dois pontos de controle e fim):
   - começo: o lugar dele na forma de onde sai;
   - 1º controle, a **saída**: um pouco para o lado (esquerda ou direita, sorteado) e para cima;
   - 2º controle, a **explosão**: um ponto longe, numa direção sorteada em volta do meio da tela (até ~60% do tamanho da tela);
   - fim: o lugar dele na próxima forma.
   O resultado: a forma se desmancha para os lados e para cima, a nuvem estoura em volta do centro da tela e os pontos caem no lugar da forma nova. No hover dos cards de "Como funciona" há um estouro menor no meio do caminho.
2. **Travadas na rolagem.** A causa principal: o código observava a altura do `<body>`, e o ScrollSmoother muda essa altura; isso refazia todas as formas e o ScrollTrigger no meio da rolagem. Agora:
   - observa só a altura do conteúdo (`#rolagem-suave-conteudo`) e só refaz quando ela muda de verdade (as fontes carregando, a janela mudando de tamanho);
   - o desenho só acontece quando algo mudou (rolagem, troca de forma ou hover). Com a página parada, o canvas não é repintado.
3. **Navegação.** Antes era preciso subir a página inteira para chegar ao laboratório. Agora o menu do topo fica **preso no topo da tela** na Home (`TopoSite fixo`), como na iorq: Laboratório, Tutoriais, Quiz ao vivo e "Criar novo projeto" ficam sempre a um clique. O menu fica fora da rolagem suave, com fundo branco quase opaco e uma linha fina embaixo.

## Atualização 9: o mouse espalha os pontos, e mais travadas a menos (2026-11-20) — vale esta

O autor ainda sentia travadas e pediu que os pontos **se dispersassem e mudassem um pouco de cor** quando o mouse passa por cima.

- **Mouse.** Os pontos a menos de 130 px do mouse são empurrados para longe dele (até 55 px, mais forte quanto mais perto) e os que se afastam mais de 4 px mudam de cor: o azul vira aqua e as outras cores viram azul, e eles acendem um pouco. O mouse é seguido com um pequeno atraso (`gsap.quickTo`), e a força do efeito acende quando o mouse se mexe e apaga em 0,6 s quando ele sai da página (tweens do GSAP). Cada ponto volta para o lugar dele **amortecido** (anda 16% do caminho por quadro), então a forma fica nítida de novo quando o mouse vai embora. Só em aparelhos com mouse (`hover: hover` e `pointer: fine`) e sem "reduzir movimento".
- **Travadas.** Medido no site de produção (o `next build`), o desenho de um quadro leva cerca de 1,4 ms, e nada é refeito no meio da rolagem (a altura do conteúdo não muda e o canvas não é recriado). Mudanças:
  - o canto de cada forma cai num **pixel inteiro** antes de somar os pontos: a forma anda inteira com a rolagem, sem cada ponto arredondar para um lado (isso fazia a forma "tremer" ao rolar);
  - saiu a opção `desynchronized` do canvas, que em algumas placas de vídeo no Windows causa travadas.
- O modo de desenvolvimento (`npm run dev`) é bem mais lento que o site publicado; a fluidez deve ser avaliada no build de produção.

## Atualização 10: o mouse só espalha, sem cor (2026-11-20) — vale esta

O autor aprovou o efeito do mouse com dois ajustes: os pontos **não mudam mais de cor** (nem acendem) quando são empurrados, e o raio do efeito ficou em **100 px** (antes 130 px). O resto da atualização 9 continua igual.

## Atualização 11: o topo volta a ser o da primeira versão (2026-11-20) — vale esta

O autor quer o topo da **primeira versão** da Home (ADR-0018): o selo "Laboratório visual de IA", o título "Veja a IA aprender." no centro, o texto completo ("…passo a passo… até virar uma resposta.") e os botões "Criar novo projeto" e "Ver tutoriais", com o brilho aqua de fundo. Isso substitui o topo do quadro do Figma da atualização 5.

Logo embaixo dos botões fica o **campo de partículas com a Aqua** do quadro "1 · Topo": só a parte do quadro que começa em y = 290 (onde as partículas começam), com a mesma largura de 1440 px, seguida de "Role para ver as partículas virarem uma rede ↓". O resto da Home continua como nas atualizações anteriores.

## Atualização 12: pontos espalhados pelo topo inteiro (2026-11-20) — vale esta

O autor pediu os quadradinhos espalhados pela tela inicial toda, até os cantos, e não só embaixo dos botões. Agora, além dos pontos do campo do Figma, o topo ganha **1.100 pontos sorteados** pela seção do topo inteira (da borda de cima até a frase "Role para ver…", de um canto da tela ao outro), com as mesmas cores, tamanhos e transparências do campo. O retângulo do campo do Figma fica de fora do sorteio, porque já tem os pontos dele. Como os outros pontos, eles viajam e explodem na rolagem; na forma seguinte, os que sobram ficam invisíveis.

## Atualização 13: pontos afastados dos textos e botões do topo (2026-11-20) — vale esta

O autor pediu que os pontos espalhados pelo topo fiquem longe dos textos e dos botões, como acontece com o mouse. Os elementos do topo marcados com `data-afastar` (o selo, o título, o texto, os dois botões e "Role para ver…") ganham uma área livre de 22 px em volta. O ponto sorteado que cai nessa área é **empurrado para a borda mais perto** e um pouco além, com a maioria ficando perto da borda. Assim os textos ficam limpos e os pontos se juntam em volta, como no efeito do mouse. Nos textos, a área é medida linha por linha (com um *Range*, que dá a caixa de cada linha), para o título centrado não bloquear a largura toda da tela.

## Atualização 14: afastamento natural, sem cara de bloco (2026-11-20) — vale esta

Com a atualização 13, a área livre em volta dos textos parecia um bloco (bordas retas e pontos amontoados na borda) e ainda havia pontos perto dos botões. Agora o afastamento funciona como o do mouse:

- cada texto ou botão é um **retângulo de cantos redondos** (os botões viram pílulas, cada linha de texto vira uma caixa arredondada), e a distância é medida até essa forma (uma *função de distância com sinal*: diz o quanto o ponto está fora ou dentro da forma);
- até um **alcance**, o ponto é empurrado para fora com força que cai com a distância (forte perto, zero no alcance);
- perto demais (dentro da **área livre**), o ponto some; entre a área livre e o alcance, a chance de ele ficar sobe suave de 0 a 1. A nuvem vai **rareando** até a borda, sem linha reta;
- os botões têm mais espaço (área livre de 30 px e alcance de 110 px) que as linhas de texto (14 px e 70 px) e o selo (18 px e 70 px);
- vale também para os pontos do campo do Figma que ficavam logo embaixo dos botões.

## Atualização 15: viagem fluida, sem explosão (2026-11-21) — vale esta

O autor pediu os pontos **fluidos** na troca de forma, **sem a explosão** da atualização 8. Agora:

- cada ponto faz uma **curva suave em S** (Bézier cúbica): sai para o lado e um pouco para cima e chega no lugar novo vindo do outro lado, sem passar por um ponto longe no meio da tela. A curva se abre até ~160 px para o lado (menos em telas estreitas);
- cada ponto tem um **atraso** próprio: começa a andar num momento sorteado dos primeiros 35% da viagem e termina junto com os outros. A forma não se move inteira de uma vez; ela **escorre** como uma onda, ponto por ponto;
- a cor, o tamanho e a transparência de cada ponto mudam junto com o andamento dele (não com o da forma inteira);
- no hover dos cards de "Como funciona" saiu o estouro: a nuvem escorre de um card para o outro com o mesmo atraso.

## Alternativas consideradas

- **Neurônio → camadas → números passando:** descartado; as três formas eram parecidas demais.
- **Cards em partículas:** descartados pelo autor; os cards ficam como estão no site.
- **Sigmoide em "Veja por dentro":** trocada pela passagem dos números, porque nem toda rede usa sigmoide (e depois a tela saiu de vez).

- **Fundo escuro como na referência:** descartado pelo autor.
- **3D de verdade, com profundidade e câmera girando:** fica para depois. Daria mais "uau", mas pesa mais e foge do visual plano do site.
