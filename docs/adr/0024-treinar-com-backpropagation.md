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
4. **O aluno escolhe o tamanho do passinho (taxa de aprendizado), com 3 opções:** pequeno, médio e grande. Com o grande, o aluno pode ver a rede "errar para o outro lado" e o erro pular em vez de cair.

## Detalhes técnicos (propostos pela IA)

### A conta
- **Mesma rede do forward pass.** O treino usa a mesma montagem (`lib/rede.ts`): ReLU nas camadas do meio, sigmoide no neurônio ligado à Saída, sem *bias* (ainda não entrou no lab).
- **Erro mostrado:** a média de |objetivo − resposta| nos exemplos, o mesmo "quanto faltou" do tutorial 05. Para o ajuste, a conta usa o erro ao quadrado, que é o padrão e dá o mesmo sentido de correção.
- **Uma repetição** = passar por todos os exemplos uma vez (uma época). Para cada exemplo: rodar (forward), medir o erro, voltar a culpa (backward) e ajustar cada peso um passinho. A ordem dos exemplos é embaralhada a cada repetição, com semente fixa.
- **Passinho:** pequeno, médio e grande são três taxas de aprendizado fixas. Os valores exatos (algo como 0,1 / 0,5 / 3) serão escolhidos testando na montagem básica: o médio precisa convergir em menos de 1.000 repetições e o grande precisa oscilar de forma visível.
- **Limite dos pesos:** os pesos treinados respeitam o mesmo limite de ±5 da edição manual (`PESO_LIMITE`), para a tela ser a mesma nos dois casos.

### Do zero e Já treinada
- **Do zero:** sorteia os pesos entre −1 e 1 com semente. Uma rede sorteada pode nascer "morta" (todos os neurônios do meio apagados para todos os exemplos, com a resposta presa em 0,50, como a ADR-0015 já previu). Por isso o sorteio é refeito, até algumas vezes, se nenhum neurônio do meio acender para algum exemplo.
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
2. `lib/treino.ts` com testes: o gradiente de cada peso conferido contra a diferença numérica, e a montagem básica "Do zero" chegando a laranja > 0,9 e azul < 0,1.
3. A tela, ligando a gravação à reprodução.

## Consequências

**Positivas**
- O tutorial 05 e o botão contam a mesma história com as mesmas palavras (erro, culpa, passinho, repetição).
- Gravar antes e reproduzir depois deixa a animação suave em qualquer velocidade e permite "voltar o filme" no futuro.

**Negativas / custos**
- A lista de exemplos editável e o seletor de passinho aumentam o painel, que já está cheio. O Figma vai dizer se cabem ali ou se o Treinar precisa abrir num painel próprio.
- Com o passinho grande, o treino pode não convergir. É de propósito, mas a tela precisa deixar claro que isso é esperado.

**Riscos e mitigação**
- **Rede morta no Do zero:** mitigada pelo sorteio repetido.
- **Exemplos mal marcados pelo aluno** (um laranja marcado como azul): a rede não acerta todos. A tabela do fim mostra isso claramente, e esse "erro que não cai" também ensina.

## Quando revisitar

- Quando entrar o *bias*.
- Quando o modo debug do backward pass ([ADR-0016](0016-modo-debug-backward-pass.md)) sair do papel.
- Se o treino com redes grandes ficar lento na thread principal.
