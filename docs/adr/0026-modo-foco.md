# ADR-0026 · Modo Foco no Rodar

- **Status:** Aceita (decisões do autor), falta o Figma e o código
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
   - **Vírgula do jeito da escola:** tira a vírgula (50 × 25), faz a conta armada algarismo por algarismo, soma as linhas (1250), conta as casas (2 + 2 = 4) e põe a vírgula (0,1250 = 0,125).
   - **Número negativo** (proposto pela IA, confirmado): a conta é feita sem o sinal e o sinal volta no último passo (+ × − = −; sinais diferentes dão −, iguais dão +). Zeros no fim depois da vírgula saem antes (4,00 = 4; 0,50 = 0,5).
   - **Cada número tem nome em toda tela da conta:** uma legenda fixa embaixo do título (ex.: "4,00 = o que o neurônio 2 passou · −0,50 = peso da linha") e o nome embaixo do número no primeiro e no último passo (pedido do autor: sem nome, o −0,50 não dizia que era o peso).
   - **Cada passo é uma tela do mesmo pop-up**, com ← Anterior / Próximo → e bolinhas de progresso; no último passo o botão vira "Voltar ao quadro".
6. **Mostrar tudo e focar na linha da conta** (decidido em 2026-10-23): o resultado de uma linha (o que passou × peso, ex.: 4,00 × −0,50 = −2,00) é **a parte desta linha** na soma do próximo neurônio, e não o resultado dele. Por isso o quadro da ida mostra **todas as linhas que chegam** no neurônio e **a soma inteira** (parte de cada linha → soma → ReLU ou sigmoide → resposta), com a linha da conta **acesa** e as outras **apagadas**. O "ver conta" ganha um último passo, "Onde esse −2,00 entra", com o mesmo desenho.

## Detalhes propostos pela IA (a confirmar no Figma)

- Na ida não há culpa: o quadro mostra "o que passou × peso = chega no próximo neurônio".
- Na volta, a cadeia com nome em cada número: erro × inclinação da sigmoide = culpa da Saída × o que passou = culpa da linha; embaixo, o teste "e se?".
- O quadro mostra as três partes em três tempos (neurônio → linha e peso → resultado), e os botões Anterior / Próximo continuam no painel.
- Telas: "Laboratório · Modo Foco · 1 ida (lousa clara)" e "· 2 volta (lousa clara, e se?)". Mais "· 3 ver conta (conta armada)" (os 6 passos de 0,50 × 0,25) e "· 4 ver conta com negativo" (4,00 × −0,50, com a navegação do pop-up) e "· 4 ver conta, passo 6 (onde entra)". O "· 1 ida" agora é "(lousa clara, soma toda)".
- Exemplo das telas, com números fáceis (pedido do autor): o neurônio 2 passou 4,00, peso −0,50, a Saída respondeu 0,50 e o certo é 0. Ida: 4,00 × −0,50 = −2,00. Volta: 0,50 × 0,25 = +0,125 × 4,00 = +0,50; o peso desce 0,25 (passinho 0,5): −0,50 → −0,75.

## Consequências

- Muda uma escolha da ADR-0025: lá a culpa aparecia sem sinal (quem dizia o lado era só o + − =). No Modo Foco ela aparece com sinal.
