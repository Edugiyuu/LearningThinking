# ADR-0028 · Aba da Aqua: usar a rede treinada

- **Status:** Proposta (ideias do autor; detalhes propostos pela IA, a alinhar ponto a ponto antes do Figma)
- **Data:** 2026-11-02
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0024](0024-treinar-com-backpropagation.md) (os pesos treinados ficam no projeto), [ADR-0026](0026-modo-foco.md) (o passo a passo que o "ver como ela pensou" abre), [ADR-0021](0021-bolinhas-cores-e-espremer.md) (azul = 0, laranja = 1)

## Contexto

Hoje o aluno monta a rede, roda passo a passo e treina, mas nunca **usa** a rede que treinou. O autor quer algo para interagir com ela, como um bichinho virtual: a Aqua no lugar da rede, o aluno escolhe uma cor, a Aqua "pensa" com o que aprendeu e responde.

Há um problema de fundo. A rede do lab só sabe responder "azul ou laranja": a saída é um número entre 0 e 1. Ela não tem como dizer "não sei". Para verde ou roxo, ela responde mesmo assim, às vezes com toda a certeza. Isso ensina uma coisa importante (**a IA só conhece aquilo para que foi treinada**), mas a tela precisa mostrar isso de um jeito que não incomode quem está usando.

**Foco desta ADR: só a ida (forward pass).** O que a aba da Aqua muda no backward pass (a culpa, o erro de uma cor que não está nos Dados) fica para depois.

## Decisões do autor (2026-11-02)

1. **Uma aba nova, só da Aqua.** Ela fica no laboratório e usa o projeto aberto, mas, quando abre, a tela é toda da Aqua: sem canvas, sem paleta, sem painel Contas.
2. **Só abre se a rede já foi treinada.** Projeto nunca treinado não entra na aba (não basta um aviso dentro dela).
3. **Enquanto pensa, não mostra a rede.** Só um texto curto, como "pensando…" ou "rodando a rede neural…", e a Aqua com o ícone de pensando.
4. **A Aqua não fica parada.** A imagem muda conforme o momento (esperando, pensando, respondendo) e conforme a certeza da resposta, com **poses do corpo inteiro** (ex.: mãozinha no queixo ao pensar), e não só o ícone acima da cabeça.
5. **"Ver como ela pensou"** abre o canvas do projeto no passo a passo, igual ao Rodar de hoje, com a cor que o aluno escolheu.
6. **Zoom na cabeça da Aqua** ao clicar em "ver como ela pensou": a tela entra na cabeça dela, fica branca e o laboratório aparece, como se a rede estivesse dentro da cabeça da Aqua.
7. **A Aqua fica confusa com cores muito diferentes dos exemplos**, mas **sem** errar por besteira: um laranja um pouco mais claro do que o dos Dados continua sendo laranja para ela. O aluno não deve precisar dizer se a cor é laranja ou azul.

## Propostas da IA (a alinhar)

### A. A tela da aba

- **Nome da aba:** "Aqua" (proposta). Fica ao lado do Rodar no topo do laboratório.
- **Tela:** a Aqua grande no centro. Embaixo dela, o seletor de cor (uma amostra grande e os controles R G B, os mesmos números que a Entrada do lab usa) e um botão **"Perguntar"**.
- **Resposta:** um balão ao lado da Aqua com a frase e o número da Saída, por exemplo "Acho que é **laranja**" e, menor, "resposta da rede: 0,87". O número continua aparecendo para não esconder que é uma conta.
- **Aba bloqueada:** sem treino, o botão da aba fica apagado, com a dica "Treine a Aqua primeiro (Backward pass → Treinar)".
- **O que conta como "treinada":** o projeto passa a guardar a informação de que um treino terminou, no mesmo momento em que os pesos novos são salvos (`aplicar` em `Treinar.tsx`). Hoje o projeto guarda os pesos, mas não sabe de onde eles vieram.
- **Só com a Entrada de cor.** Com a Entrada de números livres, a aba não abre (a dica explica o motivo).

### B. A Aqua se mexendo (GSAP)

**Decidido pelo autor (2026-11-02): não basta trocar o ícone.** A Aqua ganha **poses de corpo inteiro**, desenhadas no mesmo pixel art das que já existem (as fantasias da linha do tempo, `AquaFantasia`, e `AquaSeparando` / `AquaAcendendo` em `components/mascote.tsx`). Exemplo dado pelo autor: **pensando = a mãozinha no queixo**. O rosto continua fixo (sem boca); a emoção vem da pose do corpo e, quando ajudar, de um ícone acima da cabeça. Movimento só com GSAP.

Poses propostas (a desenhar no Figma primeiro):

| Momento | Pose do corpo | Movimento |
|---|---|---|
| Esperando a cor | em pé, braços para baixo | respira devagar (sobe e desce um pouco) |
| Pensando (~1 s) | **mãozinha no queixo** | balança de leve; o texto "pensando…" com os três pontos animados |
| Resposta perto de 0 ou de 1 | braço levantado / apontando para a cor | um pulinho |
| Resposta no meio (perto de 0,50) | as duas mãos abertas, "hmm" | inclina para o lado |
| Cor muito diferente dos exemplos | coçando a cabeça, com um "?" acima | olha para os lados |

- **Faixas de certeza:** abaixo de 0,30 ou acima de 0,70 = confiante; entre as duas = em dúvida. Os limites são uma proposta.
- O tempo de "pensando" é encenação: a conta leva milissegundos. Ele existe para o aluno ver que a Aqua está fazendo alguma coisa.
- Com "reduzir movimento" ligado, a Aqua troca de reação sem se mexer ([ADR-0011](0011-acessibilidade-e-movimento.md)).

### C. A Aqua confusa sem errar por besteira

O nome real disso é **detecção de fora da distribuição** (*out-of-distribution*): perceber que uma entrada não se parece com nada do treino. A rede não faz isso sozinha. É uma **checagem separada**, ao lado da rede, e a tela diz isso.

**Proposta: comparar pelo tom da cor, e não pela cor exata.** Laranja claro, laranja escuro e laranja vivo têm o mesmo tom (a posição na roda de cores). O que muda neles é o claro/escuro e o quanto a cor é viva. Então:

1. Para cada cor dos Dados, calcular o tom (o *matiz* do HSL, de 0° a 360°).
2. Para a cor escolhida, também.
3. Se o tom estiver perto do tom de algum exemplo (por exemplo, até 30° de distância), a Aqua **não** fica confusa: responde normalmente, confiante ou em dúvida, pelo número da rede.
4. Se estiver longe de todos (verde e roxo, com Dados só de laranjas e azuis), ela fica **confusa**: "Nunca vi uma cor assim… mas minha rede diz **azul** (0,12)". A resposta da rede aparece mesmo assim, porque ela sempre responde.
5. Cores quase sem tom (branco, preto, cinza) não têm um matiz confiável. Elas contam como "nunca vi" se nenhum exemplo for parecido também no claro/escuro.

Por que isso resolve o incômodo: clarear ou escurecer um laranja não muda o tom, então a Aqua continua reconhecendo. Também não é preciso marcar nada à mão, porque a régua vem dos próprios Dados do projeto.

**Uma coisa continua possível, e é de propósito:** a rede pode errar um laranja muito claro mesmo ele sendo "conhecido" pelo tom. Nesse caso a Aqua não fica confusa: ela responde errado, com a certeza que a rede tiver. É um erro da rede, não da checagem, e o "ver como ela pensou" mostra por quê.

**Opções descartadas:**
- *Distância da cor exata (R G B)* até o exemplo mais perto: é justamente o que confundiria a Aqua com um laranja um pouco mais claro.
- *Usar a certeza da rede* (resposta perto de 0,50 = confusa): a rede pode estar muito certa sobre uma cor que nunca viu. Esse é o ponto da lição.
- *O aluno diz se é laranja ou azul*: recusado pelo autor.

### D. "Ver como ela pensou" e o zoom na cabeça

1. **Zoom (GSAP, ~1,2 s):** a tela aproxima até a cabeça da Aqua, que cresce até cobrir tudo e fica branca. Depois o laboratório aparece aos poucos, vindo do branco.
2. **Onde cai:** o canvas do projeto, com a Entrada já na cor escolhida, e o Rodar já começado no primeiro passo (manual, com Anterior / Próximo e o Modo Foco disponível, como hoje).
3. **Só a ida.** Mesmo com o bloco Backward pass na Saída, esse passo a passo para no fim da ida: uma cor fora dos Dados não tem "resposta certa", então não há culpa para voltar (fica para a ADR do backward).
4. **Voltar para a Aqua:** um botão "← Voltar para a Aqua" no topo faz o zoom ao contrário (o lab some no branco, a cabeça encolhe e a Aqua volta, com a mesma resposta na tela).
5. A cor escolhida **não** entra nos Dados nem muda a Entrada salva do projeto. É só uma consulta.
6. Com "reduzir movimento", troca direto de tela, sem zoom.

## Pontos para alinhar

1. O nome da aba: "Aqua", "Perguntar à Aqua" ou outro?
2. O seletor de cor: R G B (igual à Entrada do lab), uma roda de cores, ou os dois?
3. As faixas de certeza (0,30 / 0,70) e a distância de tom (30°) ficam assim para começar?
4. Branco, preto e cinza: confusa sempre, ou só quando nenhum exemplo for parecido?
5. Se o aluno mudar um peso à mão depois de treinar, a aba continua aberta?
6. No passo a passo do "ver como ela pensou", o Modo Foco já abre ligado?
7. A frase da Aqua confusa mostra a resposta da rede ("…mas minha rede diz azul") ou só "Nunca vi uma cor assim"?

## Consequências

**Positivas**
- Fecha o ciclo do laboratório: montar → treinar → usar.
- Ensina sem texto longo que a rede sempre responde, mesmo sobre o que nunca viu, e que perceber isso é um trabalho à parte.
- O zoom na cabeça liga a Aqua à rede: a rede é o "cérebro" dela.

**Negativas / custos**
- Cinco poses novas de corpo inteiro da Aqua e as telas novas no Figma antes do código.
- O projeto passa a guardar se já foi treinado (mudança pequena no formato salvo).
- A checagem de tom é uma regra simples, não um método de pesquisa. Pode errar em cores no limite (um laranja-avermelhado, por exemplo).

**Riscos e mitigação**
- *O aluno achar que a confusão vem da rede:* a tela diz que é uma comparação com os exemplos, e o número da rede aparece sempre.
- *Animação demorar demais e virar espera:* "pensando" curto (~1 s), e um clique pula o zoom.

## Quando revisitar

- Quando o backward pass precisar funcionar com uma cor perguntada na aba (culpa sem resposta certa).
- Se a Entrada de números livres ganhar Dados próprios: aí a aba pode valer para ela também.
- Se entrar uma terceira cor nos Dados (a Saída passa a ter mais de duas respostas).
