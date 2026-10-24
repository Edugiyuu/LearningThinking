# ADR-0026 · Modo Foco no Rodar

- **Status:** Aceita e implementada (decisões do autor; detalhes propostos pela IA e confirmados no Figma)
- **Data:** 2026-10-23
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0025](0025-bloco-backward-pass.md) (a volta do Backward pass)

## Contexto

Na volta, o aluno viu "erro 0,03 → × 0,03 → culpa 0,001" e não entendeu de onde veio o "× 0,03" (a inclinação da sigmoide, que encolhe a culpa quando a resposta está perto de 0 ou de 1: **saturação**), nem se o peso sobe ou desce. Hoje a atenção se divide entre o canvas inteiro, a lupa e o painel Contas.

## Decisões do autor

1. **Um botão "Modo Foco" embaixo de Anterior / Próximo**, no topo do painel Contas. Liga e desliga a qualquer momento do Rodar.
2. **Vale na ida e na volta.** Com o foco ligado, a conta da vez aparece num **quadro pop-up** (uma **lousa clara**, quadro branco com moldura cinza) por cima do canvas apagado: o neurônio, depois a linha com o peso, depois o que chega no próximo neurônio. Na volta, o mesmo caminho ao contrário, com a culpa.
3. **A Aqua fica pequena, no canto do quadro, apontando para ele** como uma professora, para o foco ficar no quadro.
4. **Na volta, a explicação mostra:**
   - **de onde vem a culpa**, cada número com nome (erro × inclinação da sigmoide × o que passou);
   - **a culpa com sinal** (+0,060 / −0,060), em vez de só o tamanho. Pelo sinal o aluno deduz a direção: culpa + → o peso desce; culpa − → o peso sobe.
   - **o teste "e se?"**: duas linhas, "peso sobe ↑ → resposta sobe ↑ → longe do certo ✗" e "peso desce ↓ → resposta desce ↓ → perto do certo ✓", com "culpa + = subir piora". A linha escolhida fica acesa. É a resposta a "por que culpa + faz o peso descer", com pouco texto.
5. **"ver conta" em cada conta do quadro** (decidido em 2026-10-23): abre um **pop-up por cima do quadro, só com aquela conta** (ex.: 0,50 × 0,25 = 0,125), **montada no papel** (conta armada), número por número, para quem não é bom em matemática.
   - **A Aqua ensina** a conta (um personagem só).
   - **Vírgula do jeito da escola:** tira o zero do fim e a vírgula (0,50 = 0,5 → 5; 0,25 → 25), faz a conta armada algarismo por algarismo, soma as linhas (125), conta as casas (1 + 2 = 3) e põe a vírgula (0,125).
   - **Número negativo** (proposto pela IA, confirmado): a conta é feita sem o sinal e o sinal volta no último passo (+ × − = −; sinais diferentes dão −, iguais dão +). Zeros no fim depois da vírgula saem antes (4,00 = 4; 0,50 = 0,5).
   - **Cada número tem nome em toda tela da conta:** uma legenda fixa embaixo do título (ex.: "4,00 = o que o neurônio 2 passou · −0,50 = peso da linha") e o nome embaixo do número no primeiro e no último passo (pedido do autor: sem nome, o −0,50 não dizia que era o peso).
   - **Cada passo é uma tela do mesmo pop-up**, com ← Anterior / Próximo → e bolinhas de progresso; no último passo o botão vira "Voltar ao quadro".
6. **Mostrar tudo e focar na linha da conta** (decidido em 2026-10-23): o resultado de uma linha (o que passou × peso, ex.: 4,00 × −0,50 = −2,00) é **a parte desta linha** na soma do próximo neurônio, e não o resultado dele. Por isso o quadro da ida mostra **todas as linhas que chegam** no neurônio e **a soma inteira** (parte de cada linha → soma → ReLU ou sigmoide → resposta), com a linha da conta **acesa** e as outras **apagadas**. O "ver conta" ganha um último passo, "Onde esse −2,00 entra", com o mesmo desenho.
7. **Mostrar a camada** (pedido do autor em 2026-10-24: "neurônio 1" aparecia como destino num passo e como origem no outro, e parecia ser outro neurônio). Proposto pela IA, a confirmar:
   - nome completo: "Camada 1 · neurônio 1";
   - **mini-mapa** no topo do quadro (Entrada → Camada 1 → Saída), com a camada da vez marcada, o neurônio da vez aceso e a Aqua pequena em cima da camada da vez; na volta, a seta do mini-mapa aponta para trás;
   - **ao mudar de camada, a Aqua anda** no mini-mapa até a próxima coluna (cerca de 1 s), com o aviso "Os resultados da Camada 1 viram as entradas da Saída" e o que cada neurônio passou. Depois o quadro mostra a conta, como antes.
8. **No fim da ida, a rede toda, de forma visual** (decidido em 2026-10-24): o último passo do quadro mostra Entrada (a cor e R G B), cada camada e a Saída com a resposta, os valores dentro dos neurônios e as linhas com a cor e a espessura do peso. A Aqua fica em cima da Saída.
9. **Tela da linha na volta mais limpa** (decidido em 2026-10-24, o autor achou a tela poluída): a cadeia fica curta, só "culpa da Saída × o que passou = culpa da linha". O "erro × inclinação = culpa da Saída" aparece só no passo anterior (a culpa chegando na Saída); na linha, ele continua no "ver conta" embaixo da culpa da Saída. Mudanças do autor no Figma, a seguir no código: "certo: 0" vira **"número correto: 0"**, maior, e a Aqua do canto fica um pouco maior.
10. **O quadro ocupa a área e se adapta a telas menores** (pedido do autor em 2026-10-24: sobrava fundo escuro demais). O quadro cobre a paleta e o canvas, com margem de 24 px, numa coluna só e com o conteúdo crescendo junto com a tela. O "e se?" fica embaixo da conta, em duas linhas largas (o autor não gostou dele ao lado). Numa tela de PC menor (ex.: 1280 × 720) o layout é o mesmo, só menor.
11. **"Onde estamos" vira uma lousa própria, embaixo do quadro** (decidido em 2026-10-24, no lugar do mini-mapa no topo): Entrada → camadas → Saída, a camada da vez marcada, o neurônio da vez aceso, a seta no sentido da ida ou da volta e uma frase curta ("a culpa está voltando da Saída"). A Aqua fica nessa lousa e anda até a próxima coluna quando a conta muda de camada (o frame "· 5" continua valendo, agora nessa lousa). Telas "· 2c volta + lousa onde estamos (1440 × 900)" e "(1280 × 720)".
12. **O quadro vai sempre até a lousa "Onde estamos"** (decidido em 2026-10-24, o autor achou que sobrava tela). A letra tem **um tamanho só para todos os passos**: muda só com a altura da tela, nunca de um passo para outro (o autor viu que ampliar cada passo deixava letras grandes num e pequenas no outro). Os passos com pouca coisa (erro, culpa chegando, fim da volta) ficam no centro do quadro; o nome da etapa fica fixo no topo. Tela "· 7 quadro sempre alto". Depois (pedido do autor): o título fica em cima, o desenho cresce no meio e a conta e o "e se?" ficam embaixo, para o espaço ir para o desenho; e a letra do quadro ficou maior (título 28 px, números 30 a 36 px; 24 a 30 px em telas baixas, 32 a 42 px em telas altas).

## Detalhes propostos pela IA (a confirmar no Figma)

- Na ida não há culpa: o quadro mostra "o que passou × peso = chega no próximo neurônio".
- Na volta, a cadeia com nome em cada número: erro × inclinação da sigmoide = culpa da Saída × o que passou = culpa da linha; embaixo, o teste "e se?".
- O quadro mostra as três partes em três tempos (neurônio → linha e peso → resultado), e os botões Anterior / Próximo continuam no painel.
- Telas: "Laboratório · Modo Foco · 1 ida (lousa clara)" e "· 2 volta (lousa clara, e se?)". Mais "· 3 ver conta (conta armada)" (os 6 passos de 0,50 × 0,25) e "· 4 ver conta com negativo" (4,00 × −0,50, com a navegação do pop-up) e "· 4 ver conta, passo 6 (onde entra)". Mais "· 5 mudando de camada (a Aqua anda)", em 3 tempos; os quadros 1 e 2 ganharam o mini-mapa. E "· 6 fim da ida (a rede toda)". O "· 1 ida" agora é "(lousa clara, soma toda)".
- Exemplo das telas, com números fáceis (pedido do autor): o neurônio 2 passou 4,00, peso −0,50, a Saída respondeu 0,50 e o certo é 0. Ida: 4,00 × −0,50 = −2,00. Volta: 0,50 × 0,25 = +0,125 × 4,00 = +0,50; o peso desce 0,25 (passinho 0,5): −0,50 → −0,75.

## Como ficou no código (2026-10-24)

- `web/lib/foco.ts`: `quadroDaIda` (todas as linhas do neurônio, a da vez acesa, e a soma), `quadroDaVolta` (de onde vem a culpa e o teste "e se?"), `culpaComSinal` e `contaArmada` (as telas do "ver conta"). Testes em `foco.test.ts`, incluindo a conta armada batendo com a conta do computador.
- `QuadroFoco.tsx`: o quadro (lousa clara) e o "ver conta". Ele cobre a paleta e o canvas; o painel com Anterior / Próximo continua à vista. Esc fecha o "ver conta" e depois o quadro.
- `PainelContas.tsx`: o botão "Modo Foco" embaixo de Anterior / Próximo.
- Os números do "ver conta" são os que aparecem no quadro (2 casas; a culpa, 3). A conta armada arredonda no fim para as casas do lab.
- **Zero do fim sai antes (opção B, escolhida pelo autor em 2026-10-24):** em 0,50 × 0,25, o primeiro passo mostra "0,50 = 0,5 → 5" e a Aqua diz "Zero no fim não muda o número"; a conta vira 5 × 25, com 3 casas = 0,125. O quadro "· 3 ver conta" do Figma foi refeito assim (5 passos).
- O quadro da ida mostra o valor de todas as linhas, também das que ainda não passaram no painel ("mostrar tudo").
- Na volta, a Saída mostra "respondeu" e "certo"; num neurônio do meio, a cadeia é "culpa que chegou × inclinação da ReLU = culpa do neurônio".
- **2026-10-24, segunda leva:** `mapaDaRede` e `ondeEstamos` (`lib/foco.ts`, com teste) montam a lousa "Onde estamos" a partir da própria rodada (Entrada, cada camada, Saída), em qualquer montagem. A Aqua anda por transição de CSS (desligada com *reduced motion*) e o aviso "Próxima camada!" fica 2,6 s. O fim da ida mostra a rede toda (`RedeToda`). Na volta, a cadeia curta e "número correto". Os nomes levam a camada ("Camada 1 · neurônio 1"); só a soma usa o nome curto. Em telas baixas (até 820 px de altura) o quadro fica mais compacto e cabe sem rolar em 1280 × 720.
- Na volta, a lousa segue a culpa neurônio por neurônio; por isso a Aqua pode voltar da Entrada para a Camada 1 quando começa o próximo neurônio.

## Consequências

- Muda uma escolha da ADR-0025: lá a culpa aparecia sem sinal (quem dizia o lado era só o + − =). No Modo Foco ela aparece com sinal.
