# ADR-0029 · Saída com várias cores (o aluno escolhe as cores)

- **Status:** Proposta (pedido do autor; desenho técnico proposto pela IA, a alinhar)
- **Data:** 2026-11-02
- **Decisores:** Eduardo (autor), com propostas da IA
- **Muda:** [ADR-0021](0021-bolinhas-cores-e-espremer.md) (Saída azul = 0 / laranja = 1), [ADR-0024](0024-treinar-com-backpropagation.md) (Dados com 2 cores, sigmoide no fim)
- **Motiva:** [ADR-0028](0028-aba-da-aqua.md) (aba "Perguntar à Aqua")

## Contexto

Ao alinhar a aba da Aqua, o autor levantou dois problemas:

1. **Um laranja que dá 0,58.** Isso não quer dizer que a rede inteira é ruim, mas que ela está **insegura sobre aquela cor**. Pode ser um treino fraco, ou uma cor no meio do caminho entre os exemplos (um laranja bem claro, por exemplo).
2. **Um verde.** A rede de hoje tem **um neurônio só na Saída**, com a sigmoide: perto de 0 é azul, perto de 1 é laranja. Ela não tem um jeito de dizer "verde". Um verde cai em azul ou em laranja, dependendo de para que lado os números dele empurram a soma, e às vezes com toda a certeza.

O autor quer que o aluno **escolha as cores** e que a rede possa ter **mais de duas**.

## O que já existe parecido (pesquisa de 2026-11-02)

- **Color Classifier do The Coding Train** (Daniel Shiffman, série 7 "Intelligence and Learning"): é quase exatamente esta ideia. A entrada é R G B, há uma camada do meio com 16 neurônios e uma **Saída com 9 neurônios, um por nome de cor** (vermelho-ish, verde-ish, azul-ish…). As cores foram rotuladas por pessoas (*crowdsourcing*). A série tem um vídeo só sobre **softmax e cross-entropy**. Existe também a versão com o ml5.js (`ml5.neuralNetwork` com `task: "classification"`).
- **Teachable Machine** (Google): o aluno cria quantas classes quiser e vê uma **barra de confiança por classe**, que somam 100%.
- **TensorFlow Playground:** os exemplos de classificação são de duas classes, como o nosso lab hoje.

Todas usam o mesmo desenho: **um neurônio por classe na Saída e softmax no fim**.

## Conceitos (com os nomes reais)

- **Codificação one-hot:** a resposta certa vira uma lista com um 1 na cor certa e 0 nas outras. Com azul, laranja e verde, "laranja" é `[0, 1, 0]`.
- **Softmax:** pega as somas dos neurônios da Saída (uma por cor) e transforma em **porcentagens que somam 100%**. É o "irmão de várias cores" da sigmoide: com duas cores, softmax e sigmoide dão a mesma resposta.
- **Cross-entropy:** o erro usado com o softmax.
- **A culpa na Saída fica simples:** para cada cor, **culpa = resposta − certo**. Se a rede deu 70% para laranja e era laranja, a culpa do neurônio laranja é 0,70 − 1 = −0,30; a do azul, que deu 20%, é 0,20 − 0 = +0,20. É a mesma ideia de "erro" que o lab já mostra, agora uma por cor, e a volta pelas camadas do meio continua igual.

## Proposta da IA

1. **As cores da Saída vêm dos Dados.** Cada exemplo dos Dados ganha um **rótulo de cor** (nome + amostra), escolhido pelo aluno, no lugar do "azul = 0 / laranja = 1". A Saída cria **um neurônio por rótulo** sozinha.
2. **Montagem básica continua com 2 cores** (azul e laranja). O aluno adiciona uma terceira (ex.: verde) nos Dados e a Saída ganha um neurônio.
3. **Limite de cores:** de 2 a 5. Mais do que isso enche o canvas e o painel. (A confirmar.)
4. **Softmax no lugar da sigmoide na Saída.** Com 2 cores o resultado é o mesmo de hoje, então nada muda para quem não adicionar cores. O tutorial da sigmoide continua valendo; a softmax ganha um tutorial próprio depois.
5. **A tela da Saída** mostra uma barra por cor com a porcentagem (como o Teachable Machine), e a resposta é a cor com a maior barra.
6. **Na aba da Aqua:** "Acho que é **verde** (72%)". A Aqua fica em dúvida quando a maior barra não passa de um limite (ex.: 60%), ou quando as duas maiores estão perto.
7. **A rede ainda não diz "não sei".** Com azul, laranja e verde, um roxo vai cair em uma das três. Há dois caminhos para isso, a decidir:
   - deixar assim (a lição "a IA só conhece o que foi treinada para conhecer" continua);
   - ou o aluno criar um rótulo **"outra cor"** com exemplos variados. É o jeito comum na prática e não precisa de nenhuma conta nova.

## Pontos para alinhar

1. O aluno dá **nome** à cor (texto livre) ou escolhe de uma lista pronta (vermelho, laranja, amarelo, verde, azul, roxo…)?
2. O limite de 2 a 5 cores está bom?
3. Entra o rótulo "outra cor", ou fica para depois?
4. O backward pass com várias cores: o Modo Foco precisa mostrar a culpa de cada neurônio da Saída. Mostramos todas de uma vez, ou uma cor por vez?
5. A ordem: fazer esta ADR **antes** da aba da Aqua (a aba já nasce com várias cores), ou depois (a aba nasce com 2 cores e muda)?

## Consequências

**Positivas**
- O aluno vê a rede separar mais de duas coisas, que é o caso comum na vida real.
- O verde deixa de ser forçado a virar azul ou laranja, se o aluno ensinar o verde.
- A culpa na Saída (resposta − certo) é até mais simples de explicar do que a de hoje com a sigmoide.

**Negativas / custos**
- Mexe no núcleo: `lib/rede.ts`, `lib/treino.ts`, `lib/backward.ts`, `lib/foco.ts`, a Saída, os Dados e o Modo Foco. Os testes precisam cobrir o softmax e o gradiente novo.
- Os projetos salvos precisam migrar (hoje o objetivo é 0 ou 1; passa a ser um rótulo).
- Um tutorial novo (softmax) e telas novas no Figma.

**Riscos e mitigação**
- *Treino mais difícil com mais cores:* o sorteio especial do "Do zero" ([ADR-0024](0024-treinar-com-backpropagation.md)) foi pensado para 2 cores. Precisa ser testado com 3 a 5; o *bias* pode ter de entrar antes.
- *Canvas cheio:* o limite de cores e as barras na Saída seguram isso.

## Quando revisitar

- Quando entrar o *bias* no lab.
- Se os alunos pedirem mais de 5 cores.
