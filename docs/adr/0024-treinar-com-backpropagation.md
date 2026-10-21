# ADR-0024 · Treinar: backpropagation no laboratório

- **Status:** Aceita (decisões de produto do autor; detalhes técnicos propostos pela IA)
- **Data:** 2026-10-21
- **Decisores:** Eduardo (autor), com propostas da IA
- **Complementa:** [ADR-0015](0015-aba-redes-neurais-montagem.md) (treino como botão, repetições, x100) e [ADR-0016](0016-modo-debug-backward-pass.md) (backward pass passo a passo, adiado)

## Contexto

A seção Treinar já está desenhada no painel do laboratório (Repetições, Velocidade, Do zero / Já treinada, "Treinar 1.000 vezes"), mas ainda não faz nada. A [ADR-0015](0015-aba-redes-neurais-montagem.md) já decidiu que o treino é um botão, que o aluno escolhe quantas repetições e que o treino calcula de verdade, grava e reproduz acelerado (~x100). Faltava decidir com que dados a rede treina, o que aparece durante e depois do treino, se o aluno controla o tamanho do passo, e como a conta é feita.

O tutorial 05 · Como a rede aprende (roteiro no Figma) explica o treino em quatro ideias: o **erro**, a **culpa que volta** pela rede (retropropagação), o **passinho** em cada peso e a **repetição**. O botão precisa mostrar essas mesmas quatro coisas.

## Decisões do autor (2026-10-21)

1. **Exemplos: lista pronta e editável.** A montagem básica vem com cerca de 12 cores (6 laranjas, 6 azuis) já marcadas com o objetivo da Saída (azul = 0, laranja = 1). O aluno pode adicionar e remover cores e trocar a marcação.
2. **Durante o treino: linhas + erro caindo.** As linhas da rede mudam de cor e espessura ao vivo conforme os pesos mudam, e o painel mostra "repetição 700 de 1000 · erro 0,04" com um gráfico pequeno do erro caindo, como no tutorial 05.
3. **No fim: gráfico + tabela.** Um gráfico do erro por repetição e uma tabela com cada cor de exemplo e a resposta **antes e depois** do treino (ex.: laranja 0,48 → 0,97). Isso fecha o "formato da tela de saídas", que estava em aberto na ADR-0015.
4. **O aluno escolhe o tamanho do passinho (taxa de aprendizado), com 3 opções:** pequeno, médio e grande. Com o grande, o aluno vê que passo demais atrapalha: os pesos pulam longe e a rede pode travar com o erro alto.
5. **A lista de exemplos fica recolhida** ("Exemplos · 12 cores", com as amostras de cor e um "editar"). **O resultado do fim abre numa janela flutuante** no pé do canvas, sem escurecer a tela, para ver a rede e o gráfico ao mesmo tempo (dá para minimizar e fechar). Telas: "Laboratório · Treinar · 1 antes / 2 durante / 3 fim" no Figma.

## Detalhes técnicos (propostos pela IA)

### A conta
- **Mesma rede do forward pass.** O treino usa a mesma montagem (`lib/rede.ts`): ReLU nas camadas do meio, sigmoide no neurônio ligado à Saída, sem *bias* (ainda não entrou no lab).
- **Erro mostrado:** a média de |objetivo − resposta| nos exemplos, o mesmo "quanto faltou" do tutorial 05. Para o ajuste, a conta usa o erro ao quadrado, que é o padrão e dá o mesmo sentido de correção.
- **Uma repetição** = passar por todos os exemplos uma vez (uma época). Para cada exemplo: rodar (forward), medir o erro, voltar a culpa (backward) e ajustar cada peso um passinho. A ordem dos exemplos é embaralhada a cada repetição, com semente fixa.
- **Passinho:** pequeno 0,1 · médio 0,5 · grande 15 (`PASSINHOS` em `lib/treino.ts`). Testado na montagem básica: o médio acerta as 12 cores em 30 de 30 sorteios com 1.000 repetições; o pequeno aprende mais devagar; o grande trava com o erro alto em cerca de 4 de 10 sorteios. A ideia inicial era o grande "oscilar", mas com a montagem básica o que se vê é a rede **travar** (neurônios que apagam de vez), e o texto da tela diz isso.
- **Limite dos pesos:** os pesos treinados respeitam o mesmo limite de ±5 da edição manual (`PESO_LIMITE`), para a tela ser a mesma nos dois casos.

### Do zero e Já treinada
- **Do zero:** sorteia os pesos entre −1 e 1 com semente, mas com uma regra, por causa da falta de *bias*. Sem bias, quando nenhum neurônio do meio acende para uma cor, a soma do último neurônio é 0 e a resposta fica presa em 0,50. Com um sorteio qualquer, o treino da montagem básica falhava em ~60% das vezes: um neurônio virava detector de laranja e os azuis ficavam sem nenhum. Então o sorteio é refeito até existir **um neurônio do meio puxando para cada lado** (acende mais para os exemplos daquele objetivo), e as **linhas até o último neurônio começam em 0**. Assim a rede começa chutando 0,50 para todas as cores (6 de 12 certas, o chute de verdade), e o primeiro ajuste já dá a cada linha o sinal do lado que o neurônio puxa. Os outros pesos continuam sorteados. Com isso, o médio acertou em 30 de 30 sorteios. (Uma versão anterior já começava as linhas com o sinal certo, mas aí a rede sorteada já acertava tudo antes de treinar, o que estragava a lição.) Uma rede com 1 neurônio só no meio continua sem conseguir separar as duas cores, e a tabela do fim mostra isso.
- **Já treinada:** continua dos pesos atuais do projeto, incluindo os que o aluno mudou à mão. No fim do treino, os pesos novos ficam salvos no projeto (no navegador), e o Rodar passa a usá-los.

### Calcular, gravar, reproduzir
- **Calcula de uma vez, depois reproduz.** A conta inteira roda primeiro, rápido. Para cada repetição ficam gravados os pesos, o erro médio e a resposta de cada exemplo. Depois a tela **reproduz** a gravação na velocidade escolhida (x1, x10, x100), animando as linhas. Nada trava, e o aluno pode parar no meio.
- **Onde roda:** em `web/lib/treino.ts`, em TypeScript puro e sem bibliotecas, na thread principal e em pedaços. As redes do lab têm dezenas de pesos; mil repetições com 12 exemplos levam milissegundos. Se as redes passarem de alguns milhares de pesos, a conta vai para um Web Worker, como a [ADR-0005](0005-ml-no-navegador.md) propõe.
- **Pronto para o modo debug:** o backward de um exemplo é uma função separada, que devolve o erro e o ajuste de cada peso. É o que a [ADR-0016](0016-modo-debug-backward-pass.md) pede para mostrar o backprop passo a passo no futuro.

### Exemplos
- Valem para a **Entrada de cor**. Com a Entrada de números livres, a lista de exemplos (números + objetivo) fica para depois.
- Ficam salvos no projeto, junto da montagem.

### Ordem de trabalho
1. **Telas no Figma primeiro:** a lista de exemplos, o painel durante o treino (erro e gráfico pequeno), o passinho, e o resultado no fim (gráfico + tabela antes/depois).
2. `lib/treino.ts` com testes (`npm test`): o gradiente de cada peso conferido contra a diferença numérica, o forward igual ao do Rodar, e a montagem básica "Do zero" acertando as 12 cores.
3. A tela, ligando a gravação à reprodução.

## Consequências

**Positivas**
- O tutorial 05 e o botão contam a mesma história com as mesmas palavras (erro, culpa, passinho, repetição).
- Gravar antes e reproduzir depois deixa a animação suave em qualquer velocidade e permite "voltar o filme" no futuro.

**Negativas / custos**
- A lista de exemplos editável e o seletor de passinho aumentam o painel, que já está cheio. O Figma vai dizer se cabem ali ou se o Treinar precisa abrir num painel próprio.
- Com o passinho grande, o treino pode não convergir. É de propósito, mas a tela precisa deixar claro que isso é esperado.

**Riscos e mitigação**
- **Rede morta no Do zero:** mitigada pelo sorteio com um neurônio para cada lado. Quando o lab ganhar *bias*, essa regra pode sair.
- **Exemplos mal marcados pelo aluno** (um laranja marcado como azul): a rede não acerta todos. A tabela do fim mostra isso claramente, e esse "erro que não cai" também ensina.

## Quando revisitar

- Quando entrar o *bias* (aí o sorteio pode voltar a ser livre).
- Quando o modo debug do backward pass ([ADR-0016](0016-modo-debug-backward-pass.md)) sair do papel.
- Se o treino com redes grandes ficar lento na thread principal.
