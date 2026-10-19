# ADR-0015 · Aba Redes neurais: camadas, neurônios, exemplos e treino

- **Status:** Aceita
- **Data:** 2026-10-19
- **Decisores:** autor do projeto
- **Complementa:** [ADR-0014](0014-laboratorio-abas-projetos-e-erros.md)

## Contexto

O [ADR-0014](0014-laboratorio-abas-projetos-e-erros.md) definiu a aba **Redes neurais** e a opção "básico pronto" em "Criar novo projeto". Faltava decidir como o aluno monta a rede, de onde vêm os dados e como funciona o treino.

## Decisão

### Camadas e neurônios
- O aluno pega um **bloco Camada** e coloca **neurônios** dentro dele.
- Há duas formas de fazer isso, e a escolha é do aluno:
  - **arrastar neurônio por neurônio** para dentro da camada; ou
  - **digitar a quantidade** de neurônios direto (útil para camadas grandes, ex.: 20 neurônios).
- Os neurônios de camadas vizinhas se ligam entre si (cada linha é um **peso**).

### Montagem básica pronta
- Rede com **entrada → camada oculta → saída**.
- Tarefa: a rede **recebe uma cor** e responde se ela é **azul (0)** ou **laranja (1)**. *(decidido em 2026-10-19)*
  - Por dentro, a cor entra como números: quanto de vermelho, verde e azul ela tem (RGB).
- Já vem com **exemplos prontos** de cores azuis e laranjas, para o aluno não começar sem dados.

### Treino
- O treino é um **botão** ("Treinar"), não um bloco da montagem. *(decidido em 2026-10-19)*

O aluno escolhe:
1. **Treinar do zero:** a rede começa com pesos aleatórios e aprende com os exemplos.
2. **Usar uma rede já treinada:** a rede carrega pesos já salvos e funciona imediatamente.

### Resultado visível
- Os valores aparecem **na própria tela da rede**: o aluno vê os números (ex.: 0,3 ou 0,8) passando pelos neurônios até a saída.
- A forma deve ser **visual**, e não só números soltos.
- **Passo a passo:** o principal é mostrar **o que está acontecendo, um passo de cada vez**, até chegar na saída. Mostrar a rede inteira com todas as linhas e bolinhas de uma vez confunde quem é leigo. *(decidido em 2026-10-19)*

### Controle dos passos *(decidido em 2026-10-19)*
- O usuário escolhe como avançar:
  - **Manual:** um passo por vez (botão "próximo").
  - **Automático:** os passos andam sozinhos.

### Treino acelerado *(decidido em 2026-10-19)*
- No **Treinar**, o usuário escolhe **quantas repetições** quer (ex.: 1000).
- O treino corre até esse número **em alta velocidade**, "como um vídeo em x100".

### Etapas visíveis *(decidido em 2026-10-19)*
- O laboratório mostra o **forward pass** (propagação para frente: a entrada atravessa a rede até a resposta).
- O **backward pass** passo a passo fica para depois: ver [ADR-0016](0016-modo-debug-backward-pass.md).

### Passos do forward pass na tela *(decidido em 2026-10-19)*
1. A cor entra e é mostrada como 3 números: vermelho (R), verde (G), azul (B), de 0 a 1.
2. Cada número vai para uma bolinha de entrada.
3. Cada neurônio oculto, um por vez: multiplica cada entrada pelo peso da linha e soma (a conta aparece na tela). Se o resultado for negativo, vira 0 e o neurônio fica apagado.
4. O neurônio de saída faz a mesma conta com os neurônios ocultos.
5. O resultado é "espremido" para ficar entre 0 e 1 (vira uma chance).
6. Resposta: perto de 1 = laranja, perto de 0 = azul.

Regras visuais:
- As **contas aparecem na tela**, porque ajudam a entender.
- A **espessura das linhas** precisa ser **bem contrastada**: um peso forte fica nitidamente mais grosso que um fraco.

### O que o treino acelerado mostra *(decidido em 2026-10-19)*
- Como funciona: o treino **calcula de verdade**, **grava** cada repetição e **reproduz** acelerado (~x100), sem travar a tela.
- **Durante:** tudo passando rápido.
- **No fim:** as **saídas registradas durante o treinamento**, para o aluno ver a rede melhorando ao longo das repetições.

## Em aberto

- Formato exato da tela de saídas do fim do treino (lista, gráfico...).
- Pontos numa folha (entrada = posição; saída = cor) ficam como possível template futuro.

## Consequências

- Uma "rede já treinada" é a mesma rede com **os pesos salvos**. Para oferecer essa opção, o laboratório precisa saber salvar e carregar pesos.
- Arrastar neurônio por neurônio exige que a tela da camada cresça conforme os neurônios entram. Com muitos neurônios, o desenho das ligações vai ficar denso (ex.: 20 × 20 = 400 linhas).
