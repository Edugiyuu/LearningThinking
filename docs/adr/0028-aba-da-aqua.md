# ADR-0028 · Aba da Aqua: usar a rede treinada

- **Status:** Aceita (autor), telas no Figma; falta o código
- **Data:** 2026-11-02
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0024](0024-treinar-com-backpropagation.md) (os pesos treinados ficam no projeto), [ADR-0026](0026-modo-foco.md) (o passo a passo que o "ver como ela pensou" abre), [ADR-0021](0021-bolinhas-cores-e-espremer.md) (azul = 0, laranja = 1)

## Contexto

Hoje o aluno monta a rede, roda passo a passo e treina, mas nunca **usa** a rede que treinou. O autor quer algo para interagir com ela, como um bichinho virtual: a Aqua no lugar da rede, o aluno escolhe uma cor, a Aqua "pensa" com o que aprendeu e responde.

Há um problema de fundo. A rede do lab só sabe responder "azul ou laranja": a saída é um número entre 0 e 1. Ela não tem como dizer "não sei". Para verde ou roxo, ela responde mesmo assim, às vezes com toda a certeza. Isso ensina uma coisa importante (**a IA só conhece aquilo para que foi treinada**), mas a tela precisa mostrar isso de um jeito que não incomode quem está usando.

**Só duas cores (azul e laranja), como o lab de hoje.** Várias cores ficam para a [ADR-0029](0029-saida-com-varias-cores.md), adiada até o lab ter isso.

**Foco desta ADR: só a ida (forward pass).** O que a aba da Aqua muda no backward pass (a culpa, o erro de uma cor que não está nos Dados) fica para depois.

## Decisões do autor (2026-11-02)

1. **Uma aba nova, só da Aqua.** Ela fica no laboratório e usa o projeto aberto, mas, quando abre, a tela é toda da Aqua: sem canvas, sem paleta, sem painel Contas.
2. **Só abre se a rede já foi treinada.** Projeto nunca treinado não entra na aba (não basta um aviso dentro dela).
3. **Enquanto pensa, não mostra a rede.** Só um texto curto, como "pensando…" ou "rodando a rede neural…", e a Aqua com o ícone de pensando.
4. **A Aqua não fica parada.** A imagem muda conforme o momento (esperando, pensando, respondendo) e conforme a certeza da resposta, com **poses do corpo inteiro** (ex.: mãozinha no queixo ao pensar), e não só o ícone acima da cabeça.
5. **"Ver como ela pensou"** abre o canvas do projeto no passo a passo, igual ao Rodar de hoje, com a cor que o aluno escolheu.
6. **Zoom na cabeça da Aqua** ao clicar em "ver como ela pensou": a tela entra na cabeça dela, fica branca e o laboratório aparece, como se a rede estivesse dentro da cabeça da Aqua.
7. **A resposta é só a do forward pass, igual ao lab** (alinhado em 2026-11-02). Não existe nenhuma regra à parte para decidir se a Aqua "conhece" a cor. Um laranja diferente dos Dados é reconhecido ou não dependendo de como a rede foi treinada, exatamente como no Rodar. O aluno nunca diz se a cor é laranja ou azul.
8. **Nome da aba: "Perguntar à Aqua"**, um terceiro botão no topo do laboratório, ao lado de Treinar e Rodar.
9. **Seletor de cor: roda de cores + R G B.** A roda serve para brincar; o R G B embaixo usa os mesmos números da Entrada do lab.
10. **Peso mudado à mão depois do treino:** a aba continua aberta, e a Aqua responde com os pesos atuais.
11. **"Ver como ela pensou" abre com o Modo Foco desligado:** depois do zoom aparece o canvas inteiro (o "cérebro" dela), e o aluno liga o Foco se quiser.

## Detalhes (propostos pela IA e alinhados com o autor)

### A. A tela da aba

- **Nome da aba:** "Perguntar à Aqua", ao lado de Treinar e Rodar no topo do laboratório.
- **Tela:** a Aqua grande no centro. Embaixo dela, o seletor de cor (uma roda de cores e, embaixo, os controles R G B, os mesmos números que a Entrada do lab usa) e um botão **"Perguntar"**.
- **Resposta:** um balão ao lado da Aqua com a frase e o número da Saída, por exemplo "Acho que é **laranja**" e, menor, "resposta da rede: 0,87". O número continua aparecendo para não esconder que é uma conta.
- **Aba bloqueada:** sem treino, o botão da aba fica apagado, com a dica "Treine a Aqua primeiro (Backward pass → Treinar)".
- **O que conta como "treinada":** o projeto passa a guardar a informação de que um treino terminou, no mesmo momento em que os pesos novos são salvos (`aplicar` em `Treinar.tsx`). Hoje o projeto guarda os pesos, mas não sabe de onde eles vieram.
- **Só com a Entrada de cor.** Com a Entrada de números livres, a aba não abre (a dica explica o motivo).

### B. A Aqua se mexendo (GSAP)

**Decidido pelo autor (2026-11-02): não basta trocar o ícone.** A Aqua ganha **poses de corpo inteiro**, no estilo do Clawd (o mascote do Claude Code). Exemplo dado pelo autor: **pensando = a mãozinha no queixo**. Movimento só com GSAP. Regras de desenho, revistas pelo autor no mesmo dia:

- **Sem boca nem sobrancelhas**, mas **os olhos mudam com a reação**: ^ ^ (feliz), > < (comemorando), meio fechados (hmm), olhando para cima (pensando), para o lado (apontando), fechados (dormindo).
- **Um tamanho de pixel só.** Para caber olhos com forma, o corpo passou para a grade de **16 × 10 pixels** (o dobro da antiga), e todo o desenho usa esse mesmo pixel.
- **Os bracinhos são as portas laterais (2 × 2 pixels):** só mudam de lugar (de lado, em cima, embaixo do rosto), nunca viram braço comprido.
- Poses diferentes precisam ser claramente diferentes.

Poses propostas. A primeira versão está no Figma, no frame "Mascote · versões", seção "Aqua · poses de corpo inteiro". Lá há 12 poses: as 5 da tabela e outras que podem servir depois (comemorando, mostrando a cor no alto, acenando ao abrir a aba, dormindo na aba bloqueada, olhando a roda de cores, lupa para o "ver como ela pensou"). 

| Momento | Pose do corpo | Movimento |
|---|---|---|
| Esperando a cor | em pé, braços para baixo | respira devagar (sobe e desce um pouco) |
| Pensando (~1 s) | **mãozinha no queixo**, olhos para cima, balão | balança de leve; o texto "pensando…" com os três pontos animados |
| Resposta perto de 0 ou de 1 | olhos ^ ^, pulinho (ou apontando para a cor) | um pulinho |
| Resposta no meio (perto de 0,50) | coçando a cabeça, com um "?" acima | olha para os lados |

- **Faixas de certeza:** abaixo de 0,30 ou acima de 0,70 = confiante; entre as duas = em dúvida.
- O tempo de "pensando" é encenação: a conta leva milissegundos. Ele existe para o aluno ver que a Aqua está fazendo alguma coisa.
- Com "reduzir movimento" ligado, a Aqua troca de reação sem se mexer ([ADR-0011](0011-acessibilidade-e-movimento.md)).

### C. A resposta vem só do forward pass

Decidido pelo autor: **funciona igual ao Rodar do lab.** A Aqua roda o forward pass com a cor escolhida e os pesos do projeto, e a resposta é o número da Saída. Não há checagem à parte de "cor conhecida": se um laranja mais claro sai como laranja ou não depende só de como a rede foi treinada.

- **Confiante** (abaixo de 0,30 ou acima de 0,70): "É **laranja**!" (ou azul), com o número embaixo.
- **Em dúvida** (entre 0,30 e 0,70): a Aqua coça a cabeça com o "?" e diz "Hmm… não tenho certeza. Acho que é **laranja** (0,58)." A resposta da rede aparece sempre. (Revisto em 2026-11-02: "nunca vi uma cor assim" era mentira para um laranja dos Dados. Um 0,58 diz que a rede está **insegura sobre aquela cor**: pode ser um treino fraco, ou uma cor no meio do caminho entre os exemplos.)
- A lição de que "a IA só conhece o que foi treinada para conhecer" aparece sozinha: o aluno vê a rede responder até verde ou roxo, às vezes com toda a certeza, e o "ver como ela pensou" mostra por quê.
- **Preto** (0, 0, 0): como o lab ainda não tem *bias*, toda soma dá 0 e a rede responde exatamente 0,50. A Aqua fica em dúvida no preto seja qual for o treino. É a rede de verdade, e liga com a [ADR-0024](0024-treinar-com-backpropagation.md) (quando entrar o bias).

**Descartado:** uma checagem separada pelo tom da cor (detecção de fora da distribuição). Ela mudaria a resposta da Aqua por uma regra que não está na rede, e não seria mais "igual ao lab". Fazer a **própria rede** dizer "não sei" (uma terceira resposta "outra cor" nos Dados) muda o backward pass e fica para outra ADR.

### D. "Ver como ela pensou" e o zoom na cabeça

1. **Zoom (GSAP, ~1,2 s):** a tela aproxima até a cabeça da Aqua, que cresce até cobrir tudo e fica branca. Depois o laboratório aparece aos poucos, vindo do branco.
2. **Onde cai:** o canvas do projeto, com a Entrada já na cor escolhida, e o Rodar já começado no primeiro passo (manual, com Anterior / Próximo e o Modo Foco disponível, como hoje).
3. **Só a ida, com o Modo Foco desligado.** Mesmo com o bloco Backward pass na Saída, esse passo a passo para no fim da ida: uma cor perguntada não tem "resposta certa" nos Dados, então não há culpa para voltar (fica para a ADR do backward).
4. **Voltar para a Aqua:** um botão "← Voltar para a Aqua" no topo faz o zoom ao contrário (o lab some no branco, a cabeça encolhe e a Aqua volta, com a mesma resposta na tela).
5. A cor escolhida **não** entra nos Dados nem muda a Entrada salva do projeto. É só uma consulta.
6. Com "reduzir movimento", troca direto de tela, sem zoom.

## Pontos alinhados (2026-11-02)

1. Nome da aba: **"Perguntar à Aqua"**.
2. Seletor: **roda de cores + R G B**.
3. Faixas de certeza: **0,30 / 0,70** para começar (ajustáveis depois de testar).
4. Cores sem tom (branco, preto, cinza): **sem regra especial**, vale o forward pass.
5. Peso mudado à mão depois do treino: **a aba continua aberta**.
6. "Ver como ela pensou": **Modo Foco desligado** ao abrir.
7. Frase em dúvida: **"não tenho certeza" + a resposta da rede** (revisto: "nunca vi" não vale para uma cor que está nos Dados).

## Figma (2026-11-02)

Telas desenhadas, à esquerda do arquivo (x < −1600):

1. **"Perguntar à Aqua · 1 botão bloqueado (rede sem treino)"**: o lab com o botão novo apagado no topo (Aqua dormindo) e a dica "Treine a Aqua primeiro · Ligue o Backward pass na Saída e clique em Treinar."
2. **"· 2 esperando a cor"**: a aba ocupa a tela toda abaixo do topo. Aqua grande acenando, balão "Oi! Escolha uma cor e me pergunte o que ela é.", cartão com a roda de cores, a amostra (hex) e R G B de 0 a 1 (como a Entrada do lab), e o botão Perguntar. "← Voltar ao laboratório" no canto.
3. **"· 3 pensando"**: mão no queixo e balão de pensamento; "Pensando… rodando a rede neural"; botão apagado.
4. **"· 4 resposta certa"**: apontando para a amostra; "É laranja!", "resposta da rede: 0,97 (perto de 1 = laranja, perto de 0 = azul)" e o botão "ver como ela pensou →" com a Aqua de lupa.
5. **"· 5 em dúvida"**: coçando a cabeça com o "?"; "Hmm… não tenho certeza. Acho que é laranja." e "resposta da rede: 0,58 (bem no meio)".
6. **"· 6 ver como ela pensou (zoom na cabeça, 4 tempos)"**: aproxima da cabeça (0,4 s), a cabeça cobre tudo (0,4 s), branco (0,2 s), o lab aparece com "← Voltar para a Aqua" (0,4 s).

Na mesma revisão, o frame do laboratório foi conferido com o código rodando e atualizado ("Laboratório · Desktop · v3 (igual ao código em 2026-11-02)"): o topo só tem o Rodar, a paleta ganhou o Backward pass e o painel Contas tem Anterior/Próximo, Modo Foco e Passo a passo no topo, sem a seção Treinar. Em "Tutoriais · Desktop", os minutos e a descrição do tutorial 01 foram acertados. Home e Novo projeto já batiam com o código.

## Consequências

**Positivas**
- Fecha o ciclo do laboratório: montar → treinar → usar.
- Ensina sem texto longo que a rede sempre responde, mesmo sobre o que nunca viu.
- O zoom na cabeça liga a Aqua à rede: a rede é o "cérebro" dela.

**Negativas / custos**
- Poses novas de corpo inteiro da Aqua e seis telas novas no Figma antes do código.
- O projeto passa a guardar se já foi treinado (mudança pequena no formato salvo).

**Riscos e mitigação**
- *O aluno não perceber que a resposta é só uma conta:* o número da Saída aparece sempre, e o "ver como ela pensou" leva à conta inteira.
- *Animação demorar demais e virar espera:* "pensando" curto (~1 s), e um clique pula o zoom.

## Quando revisitar

- Quando a Saída tiver mais de duas cores ([ADR-0029](0029-saida-com-varias-cores.md)): a resposta vira "a cor com a maior porcentagem", e as faixas de certeza mudam.
- Quando o backward pass precisar funcionar com uma cor perguntada na aba (culpa sem resposta certa).
- Se a Entrada de números livres ganhar Dados próprios: aí a aba pode valer para ela também.
- Se entrar uma terceira cor nos Dados (a Saída passa a ter mais de duas respostas).
