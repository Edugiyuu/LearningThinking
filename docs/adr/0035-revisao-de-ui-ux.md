# ADR-0035 · Revisão de UI/UX: falhas achadas no site e correções propostas

- **Status:** Em andamento (2026-11-14). O autor pediu para aplicar a ADR; o que já entrou está em "O que já foi feito". O resto espera decisão do autor ou o Figma.
- **Data:** 2026-11-14
- **Decisores:** Eduardo (autor); o levantamento e as propostas são da IA
- **Conversa com:** [ADR-0020](0020-laboratorio-em-codigo.md) (laboratório só para computador), [ADR-0024](0024-treinar-com-backpropagation.md) e [ADR-0025](0025-bloco-backward-pass.md) (treino e bloco Backward pass), [ADR-0026](0026-modo-foco.md) (Modo Foco), [ADR-0028](0028-aba-da-aqua.md) (Perguntar à Aqua), [ADR-0030](0030-entradas-alem-de-cor.md) (entradas além de cor), [ADR-0034](0034-quiz-ao-vivo.md) (Quiz ao vivo)

## Contexto

O autor pediu uma revisão da interface: o que está confuso, o que falta polir, se a navegação faz sentido e o que deixaria os blocos mais claros para o aluno, olhando tanto o aluno quanto o professor. Pediu também a comparação com o Figma.

### Como a revisão foi feita

- O site rodou em `localhost:3100` (branch `main`, commit `2c2a059`), numa janela de **1366 × 768**, que é a tela comum de computador de escola, e depois em **375 × 812** (celular).
- Caminho do aluno: Home → Novo projeto → Laboratório (Rodar passo a passo, Modo Foco, Perguntar à Aqua, bloco Backward pass, Treinar) → Tutoriais (trilha e o tutorial 01).
- Caminho do professor: Quiz ao vivo → Criar sala → sala de espera → 2 perguntas, com um aluno de teste em outra aba.
- Figma: 12 frames exportados e comparados com a tela (Home, Novo projeto, Tutoriais, Tutorial · O neurônio, Laboratório v3, Backward pass 4, Modo Foco 8 · ida, Perguntar à Aqua 2, HOST P3a e P4).

### O que não foi verificado

- **Fluidez das animações.** O painel do navegador estava oculto durante o teste, e nesse estado o navegador atrasa as animações. Não dá para dizer se elas estão fluidas; isso precisa ser visto com a tela aberta.
- **Quiz com turma de verdade.** Só um aluno, na mesma máquina. O pódio, a aba Turma e as perguntas de digitar e de clicar na linha não foram percorridos.
- **Tutoriais 02, 03 e 04** e os frames do Figma que ficaram de fora dos 12.

## O que foi achado

A coluna "No Figma?" diz se o problema já está no desenho (então o conserto começa no Figma) ou se é só do código.

### A. Quebra ou atrapalha o uso

| # | Onde | O que acontece | Por que atrapalha | No Figma? |
|---|---|---|---|---|
| A1 | Menu do site | "Sobre" leva a uma página que não existe (erro 404, tela preta em inglês). | É um link em todas as páginas que termina num beco sem saída, com um visual que não é o do site. | Sim, o menu do Figma tem "Sobre", mas não há tela Sobre. |
| A2 | Laboratório, canvas | A rede abre com zoom 0,68: o neurônio tem 19 px e os números dos pesos ficam com cerca de 7 px. A rede usa uns 135 px de altura num canvas de 704 px. | O aluno não lê os pesos sem dar zoom, e o que ele veio ver é justamente o número na linha. | Em parte. No frame "Laboratório · Desktop · v3" a rede é uns 25% maior, mas também é pequena para o espaço. |
| A3 | Bloco Backward pass | Resposta certa, Mostrar/Salvar, Dados, passinho, repetições, velocidade e o botão Treinar ficam num bloco alto, com o mesmo texto de 7 px. Ao soltar, o bloco cai cortado embaixo e atrás da legenda. Para clicar em Treinar foi preciso arrastar a rede para fora da tela. | O aviso do painel diz "repare nas linhas mudando de cor e espessura", mas a rede não está mais na tela. | Não. O frame "Backward pass · 4" desenha o bloco 1,6× maior para ficar legível; no canvas ele aparece no tamanho real. |
| A4 | Painel Contas | "Forward ✓" e "◀ Backward" têm aparência de abas, mas não clicam. | O aluno clica esperando pular para a volta e nada acontece. | Sim. |
| A5 | Quiz, tela do professor | O botão "Som: ligado" fica por cima do canto de "Próxima pergunta" e de "Encerrar agora" (61 × 22 px de sobreposição em 1366 × 768). | São os botões que o professor mais usa, com a turma olhando. | Não. O botão de som não existe no Figma. |
| A6 | Celular | A Home esconde o menu e não põe nada no lugar. O laboratório abre com os painéis cobrindo o canvas. | A ADR-0020 diz que o lab é só para computador, mas o site não avisa isso a quem chega pelo celular. | Não há tela de celular para Home nem lab. |

### B. Confunde o aluno

| # | Onde | O que acontece | Por que confunde |
|---|---|---|---|
| B1 | Canvas × Modo Foco | O canvas mostra "Camada 2" e "Saída" como dois blocos. O Modo Foco chama a Camada 2 de "Saída", e o mapa "Onde estamos" mostra só Entrada, Camada 1 e Saída. O painel, no mesmo passo, diz "Camada 2 · neurônio 1". | Três nomes para a mesma coisa na mesma tela. O aluno não sabe se são peças diferentes. |
| B2 | Laboratório | "Passinho", "culpa" e "repetição" aparecem sem o nome técnico: **taxa de aprendizado** (o tamanho do ajuste em cada peso), **gradiente** (quanto cada peso contribuiu para o erro) e **época** (uma passada por todos os exemplos). | O aluno aprende o apelido e não reconhece o termo quando o vir em outro lugar. O quiz já escreve "o passinho (taxa de aprendizado)"; o lab não. |
| B3 | Tutoriais × Laboratório | O bloco Backward pass e o Treinar já existem, mas o tutorial 05 · Como a rede aprende está "Em breve". | O aluno encontra "a culpa volta" no lab sem ninguém ter explicado antes. |
| B4 | Fim do Rodar | No passo 12 de 12 o botão Próximo apaga e não há nenhum convite para o que vem depois. | A rodada termina sem dizer "e agora?". |
| B5 | Saída × Aqua × Quiz | O bloco Saída diz "abaixo de 0,50 a resposta é 0; a partir de 0,50 é 1". A Aqua e o quiz usam "fico em dúvida" entre 0,30 e 0,70 (ADR-0028). | Com 0,60 o bloco Saída diz "laranja" e o quiz cobra "fico em dúvida". |
| B6 | Projetos | Não existe lista de projetos. "Praticar no laboratório" (fim do tutorial) e "Criar novo projeto" sempre criam um projeto novo; "Laboratório" abre só o último. | Os projetos antigos ficam guardados no navegador, mas o aluno não tem como voltar a eles. |
| B7 | Perguntar à Aqua | O texto diz "ela usa a rede que você treinou" mesmo quando a rede só rodou. A aba "Redes neurais" continua marcada, embora a tela seja outra. | O texto afirma um treino que não aconteceu. (Também está assim no Figma.) |
| B8 | Novo projeto e Home | Redes neurais, Busca por significado e RAG aparecem como três temas irmãos. O cartão de Redes neurais diz "uma cor virar resposta". | Ver a seção seguinte. |

### C. Falta de polimento

| # | Onde | O que acontece |
|---|---|---|
| C1 | Tutoriais | "5 tutoriais, na ordem" ao lado de "0 de 4 concluídos" (também no Figma). |
| C2 | Tutorial 01 | Dá para pular direto ao passo 11 e clicar em "Praticar no laboratório" sem responder o teste rápido. |
| C3 | Modo Foco | "A soma do Camada 1"; os rótulos R, G, B e "Camada 1 · neurônio 1" ficam escondidos atrás dos círculos (também no Figma); a soma final já aparece, em cinza, antes de a conta chegar nela. |
| C4 | Treinar | A janela "Resultado do treino" e o painel da direita mostram a mesma coisa, com dois botões de rodar ("Rodar agora" e "Rodar com os pesos novos"). |
| C5 | Quiz | "1 de 1 acertaram"; o rótulo "Tempo esgotado" aparece mesmo quando todos responderam antes do tempo; o código de exemplo "K7M2QX" no cartão do professor parece um código de verdade. |
| C6 | Quiz no projetor | Na pergunta, a cor (60 px) e a barra da resposta ocupam um canto, e metade da tela projetada fica vazia. No Figma (P3a) o cartão é maior e ocupa a altura das alternativas. |
| C7 | Quiz, professor | Não há como tirar da sala um apelido impróprio. |
| C8 | Novo projeto | Em 768 px de altura, "Criar projeto" fica abaixo da dobra. |
| C9 | Tutorial no celular | O título sai do centro e os tracinhos de progresso passam da borda direita. |
| C10 | Laboratório | Soltar um bloco novo apaga o resultado da rodada sem aviso. As portas de ligar os fios têm 6 a 9 px. |

## Redes neurais, Busca por significado e RAG

O autor perguntou: o cartão de Redes neurais diz "conta por conta, uma cor virar resposta", mas Busca por significado e RAG não são redes neurais?

São construídos em cima delas:

- **Busca por significado** usa uma rede neural para transformar cada frase numa lista de números, o *embedding* (frases de sentido parecido ficam com números parecidos). A busca compara essas listas.
- **RAG** (*Retrieval-Augmented Generation*, geração com consulta) junta duas partes: uma busca por significado que acha os trechos certos nos documentos, e uma rede neural de linguagem que escreve a resposta usando esses trechos.

Mostrar os três como temas irmãos sugere que só o primeiro é rede neural. E a frase "uma cor virar resposta" amarra o tema à cor, quando a Entrada já aceita números e a ADR-0030 prevê outras entradas.

## Figma × código

**Estão parecidos.** Nas telas comparadas, o layout, as cores, os textos e o mascote do código seguem o Figma. As diferenças achadas:

| Tela | Diferença |
|---|---|
| Menu (Home, Tutoriais) | O Figma tem Laboratório, Tutoriais e Sobre. O código tem também "Quiz ao vivo". |
| Home | O frame "Home · Desktop · mascote" não tem o botão "Entrar numa sala"; ele só aparece no frame da seção ALUNO. |
| Tutorial · O neurônio | Figma: 9 passos, começando por "Começa no seu cérebro". Código: 11 passos, começando por "A ideia veio do cérebro", com outro texto. |
| Laboratório | O frame v3 não tem o botão "Perguntar à Aqua" na barra de cima; a rede é uns 25% maior que na tela em 1366 px. |
| Backward pass | O bloco está desenhado 1,6× maior do que aparece no canvas (A3). |
| Quiz, professor | O botão "Som: ligado" não existe no Figma (A5). O cartão da pergunta é menor no código (C6). |

Os frames são de 1440 × 900. Em 1366 × 768 a tela real tem menos altura, e é aí que aparecem A2, A3, A5 e C8.

## Correções propostas

Nenhuma está decidida. Estão na ordem em que a IA faria.

### 1. Rápidas, sem mexer em desenho

- Tirar "Sobre" do menu até a página existir (A1).
- Mover "Som: ligado" para a barra de cima da sala (A5).
- Textos: "1 de 1 acertou", "A soma da Camada 1", "Todos responderam" no lugar de "Tempo esgotado", contagem certa na trilha (C1, C3, C5).
- "Perguntar à Aqua": "ela usa a rede deste projeto" (B7).
- Trocar o código de exemplo do quiz por algo que não pareça real, como "······" (C5).

### 2. Laboratório legível (Figma antes do código)

- Abrir a rede com zoom perto de 1 e re-enquadrar quando um bloco é solto (A2, A3).
- **Bloco Backward pass.** A ADR-0025 (item 13) decidiu que os controles do Treinar ficam no bloco, e o Figma diz "o bloco é o lugar do aprendizado". Duas saídas, para o autor escolher:
  1. manter tudo no bloco e resolver com o zoom e o enquadramento acima; **(escolhida pelo autor em 2026-11-14)**
  2. deixar no bloco a resposta certa e Mostrar/Salvar, e levar passinho, repetições, velocidade e o botão para o painel da direita, onde o treino já aparece. Isso muda a ADR-0025.
- "Forward / Backward" vira aba de verdade, que pula para o começo da volta, ou perde a aparência de botão (A4).
- No fim do Rodar, três convites: "Mudar a cor", "Ver a volta" (se o bloco estiver ligado) e "Treinar" (B4).

### 3. Ensino

- Fazer o tutorial 05 · Como a rede aprende, que alcança o que o lab já tem (B3).
- Um nome só para cada peça em canvas, Modo Foco e painel (B1).
- Nome técnico ao lado do apelido na primeira vez que aparece em cada tela: "passinho (taxa de aprendizado)", "culpa (gradiente)", "repetição (época)" (B2).
- Explicar no bloco Saída a faixa de dúvida da Aqua, ou explicar na Aqua por que ela é mais exigente que a Saída (B5).
- Apresentar Redes neurais como a base e os outros dois temas como "o que se constrói com redes neurais", dizendo isso no texto de cada cartão. Trocar "uma cor virar resposta" por "uma entrada virar resposta" (B8).

### 4. Navegação

- Lista "Meus projetos", e "Praticar no laboratório" abrindo o projeto básico que já existe em vez de criar outro (B6).
- Menu no celular e um aviso "o laboratório funciona melhor no computador" (A6).

### 5. Professor

- Tirar um aluno da sala de espera (C7).
- Cartão da pergunta ocupando a altura da tela projetada, como no Figma (C6).
- Conferir no teste na escola se a tela de resultado deve mostrar quantos marcaram cada alternativa, como a ADR-0034 previa.

## O que já foi feito (branch `fix/revisao-ui-ux`)

Só o que não muda desenho nem decisão aceita:

| Item | O que mudou |
|---|---|
| A1 | "Sobre" saiu do menu até a página existir. |
| A2 | O laboratório abre enquadrando só a rede (sem o bloco Backward pass), com zoom até 1. Em 1366 × 768 a rede ficou cerca de 1,3× maior. O número do peso passou de 10,5 para 12 px (13 px no da vez). |
| A3 | **O autor escolheu a opção 1: tudo continua no bloco** (a ADR-0025, item 13, não muda). Ao ser solto, o bloco sobe o que for preciso para caber inteiro na parte visível do canvas. Ao clicar em Treinar, a tela volta para a rede (enquadramento animado de 0,5 s), para o aluno ver as linhas mudando. |
| A4 | "Forward" e "◀ Backward" viraram abas de verdade: pulam para o começo da ida e da volta. |
| A5 | "Som: ligado" foi para a barra de cima das telas projetadas, ao lado do que já estava lá. |
| B2 | "Passinho (taxa de aprendizado)", "Repetições (épocas)", "culpa (o gradiente: quanto cada parte pesou no erro)" e "passinho (taxa de aprendizado) × culpa (gradiente)". |
| B5 | O bloco Saída avisa que a Aqua fica em dúvida entre 0,30 e 0,70. |
| B7 | "Ela usa a rede deste projeto." |
| B8 | Redes neurais é "a base de tudo"; Busca por significado e RAG dizem que são "feitos com redes neurais". "Uma cor virar resposta" virou "uma entrada virar resposta" (Home e Novo projeto). |
| C1 | "4 tutoriais, na ordem, e mais 1 em breve." |
| C3 (parte) | "A soma da Camada 1". |
| C5 | "1 de 1 acertou"; "Todos responderam" quando ninguém ficou sem responder; o código de exemplo virou "······". |

### Esperando o autor

- **Um nome para a última camada (B1):** hoje o canvas diz "Camada 2" e o Modo Foco e a volta dizem "Saída". Os testes de `lib/foco.ts` esperam "Saída".
- **Com Figma antes do código:** tutorial 05 (B3), convites no fim do Rodar (B4), lista "Meus projetos" (B6), menu e aviso no celular (A6), tirar aluno da sala (C7), cartão maior no projetor (C6).

## Consequências

**Positivas**
- O autor tem uma lista só, com o motivo de cada item, para comparar com as falhas que ele mesmo já tinha anotado.
- Fica registrado o que é problema do desenho e o que é só do código.

**Negativas / custos**
- A proposta 2 pode mexer numa decisão aceita (ADR-0025, item 13).
- Atualizar o Figma antes do código, como o projeto pede, aumenta o trabalho dos itens 2 a 5.

**Riscos e mitigação**
- A revisão foi feita por uma IA numa única máquina. O teste na escola, que já estava pendente, é o que confirma ou derruba cada item.

## Quando revisitar

Depois que o autor comparar esta lista com a dele e marcar o que entra. Cada item aceito vira uma branch própria (`fix/...` ou `feat/...`) e, quando for uma decisão de desenho, uma ADR própria.
