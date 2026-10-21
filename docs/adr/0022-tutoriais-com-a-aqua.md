# ADR-0022 · Tutoriais: trilha com a Aqua e aulas passo a passo

- **Status:** Aceita (autor) para fazer a aba de tutoriais, visual e com a Aqua; o formato e os detalhes são *proposta da IA*, aguardando a revisão do autor
- **Data:** 2026-10-20
- **Decisores:** autor do projeto

## Contexto

O [ADR-0013](0013-formato-tutoriais-e-laboratorio.md) separou o produto em laboratório + **tutoriais em páginas separadas**, mas deixou em aberto o formato deles. O [ADR-0021](0021-bolinhas-cores-e-espremer.md) prometeu "a tela de aulas com a Aqua, que vai explicar o espremer com mais detalhe". O link **Tutoriais** da Home apontava para uma página que não existia.

O autor pediu as telas da aba de aulas/tutoriais, **visuais e com a Aqua, para ficar entendível**, enquanto discutia o treino (backward pass) em outra sessão.

## Decisão

Telas no Figma (página 1, abaixo de "Novo projeto · Desktop"): **Tutoriais · Desktop**, **Tutorial · O neurônio · Desktop** (passo 1, o cérebro), **Tutorial · O neurônio · cérebro × IA · Desktop** (passo 4) e **Tutorial · O neurônio · fim com teste rápido · Desktop**. Em código em `web/app/tutoriais/`.

*Tudo abaixo é proposta da IA:*

1. **Lista (`/tutoriais`): uma trilha.** Os tutoriais de Redes neurais aparecem em ordem, como **blocos do laboratório ligados por fios** (portas aqua e fio tracejado entre os cards). Cada card tem uma miniatura com a Aqua, número, título, uma frase, minutos e o estado: **Concluído ✓**, **Começar/Continuar →** (o card da vez, com borda aqua) ou nada. Em cima, "N de 4 concluídos". Embaixo, **05 · Como a rede aprende** como "Em breve" (Aqua dormindo), e os outros temas (Busca por significado, RAG) também em breve.
2. **Aula (`/tutoriais/[slug]`): palco + texto, um passo por vez.** Em vez do scrollytelling da proposta antiga, é um passo a passo com **Anterior/Próximo** (e as setas do teclado), igual ao "Passo a passo" do laboratório. À esquerda, o **palco** (fundo `#F5F5F7`) muda **uma coisa por passo**; à direita, título, texto curto, a caixa **"A conta"** e, quando houver, **"Onde a ideia quebra"** (fundo âmbar claro). Barra de progresso em segmentos no topo.
3. **A Aqua é personagem do palco, não narradora:** ela é o neurônio que recebe as linhas, senta na curva em S no ponto da soma, é o bloco Saída na montagem. Ela não fala em balões (regra da seção 7.1 do design system).
4. **Mesma gramática do laboratório:** linhas verdes/vermelhas pelo sinal do peso, espessura pela força, **bolinhas com o número de verdade** que passam pelo peso e mudam de cor, fios cinza tracejados entre blocos, camada solta em âmbar. As contas batem com `web/lib/rede.ts`: no meio da rede o neurônio **acende** (passa a soma se for positiva, senão 0) e no último a soma passa pela **sigmoide**.
5. **Passos interativos:** em alguns passos o aluno mexe num controle deslizante (o peso, ou a soma na curva em S) e a conta da direita acompanha.
6. **Fim com teste rápido:** o último passo é uma pergunta de 3 opções. Errar mostra "Quase…" e deixa tentar de novo; acertar **acende a lâmpada da Aqua** (pose "Com a lâmpada"), mostra "Você aprendeu" e marca o tutorial como concluído. Sempre há um quadro **"Agora no laboratório"** com o que fazer lá, e o botão **Praticar no laboratório →** (vai para Novo projeto).
7. **Primeiros quatro tutoriais** (conteúdo em `web/lib/tutoriais.ts`):
   | # | Tutorial | Passos |
   |---|---|---|
   | 01 | O neurônio | **o neurônio do cérebro** (dendritos, corpo, axônio) → dispara ou não → sinapses têm força → a IA copiou a ideia (cérebro × IA) → entradas → multiplica → soma → decide se acende (ReLU) → teste |
   | 02 | Os pesos | volume → verde → vermelho → mexa você → onde fica no lab → teste |
   | 03 | A sigmoide | soma sem limite → tudo cabe entre 0 e 1 → curva em S → a conta com o *e* → no lab → teste |
   | 04 | Camadas e fios | blocos → o fio dá a ordem → todos com todos → camada solta → montagem básica → teste |
   | 05 | Como a rede aprende | **Em breve**: depende do Treinar e da discussão do backward pass |
8. **Progresso no navegador** (`localStorage`, chave `learningthinking:tutoriais`, formato com `versao: 1`), como os projetos. O passo atual fica na URL (`?passo=3`), então recarregar ou compartilhar o link abre no mesmo ponto. Concluído continua concluído mesmo se o aluno voltar para rever.
9. **Barra do site como componente** (`web/components/topo-site.tsx`), usada na Home e na lista, com o item da página atual marcado em aqua.

## Revisão (2026-10-20): o neurônio começa pelo cérebro, e "espremer" vira sigmoide

Pedido do autor:
- **A tela de aula no Figma passou a ser a do tutorial 01 · O neurônio**, no lugar de "O espremer".
- **O tutorial 01 começa explicando o cérebro humano**: o neurônio de verdade (dendritos recebem, o corpo da célula junta, o axônio leva), o disparo "tudo ou nada" quando passa de um limite, e a sinapse com ligações fortes e fracas ("aprender é mudar a força das ligações"). Depois vem a ponte **cérebro × IA** (dendritos → entradas, sinapses → pesos, corpo → soma, disparar → acender) com o quadro "Onde a comparação com o cérebro quebra", e só então a continha da IA.
- **"Espremer" saiu.** O autor achou o apelido estranho. Vale o nome de verdade, **sigmoide**: o tutorial 03 virou **A sigmoide** (`/tutoriais/sigmoide`), e o painel do laboratório agora diz "Sigmoide (deixa entre 0 e 1) · soma …". A regra do meio da rede também ganhou o nome dela, **ReLU**.

*Proposta da IA* nos detalhes: o neurônio biológico é desenhado em rosa (`#FBD5DE`, traço `#D9708A`, texto `#A3435C`) para não se confundir com o aqua da IA nem com o vermelho do peso negativo; o disparo usa amarelo/âmbar e um pulso que corre pelo axônio (parado com "reduzir movimento").

## Revisão 2 (2026-10-20): só o que o laboratório tem, cérebro simples e a Aqua cozinhando

O autor revisou o roteiro técnico do tutorial 01 no Figma e decidiu:
- **O objetivo é aprender IA, não o cérebro.** A parte biológica ficou em 2 passos simples (a ideia do neurônio e as ligações fortes/fracas), sem mV, PEPS/PIPS, neurotransmissores por nome, LTP/LTD.
- **O tutorial só fala do que existe no laboratório.** Saíram o **viés (b)** e a **função degrau**, que o sandbox não tem. Ficam: entradas (vetor x), pesos (w), soma ponderada (z), função de ativação com **ReLU** (neurônios do meio) e **sigmoide** (último neurônio). A ponte "cérebro × IA" ganhou uma terceira coluna, **no laboratório**, dizendo onde cada parte aparece.
- **A história fica** (1943 McCulloch-Pitts, 1958 perceptron, 1986 retropropagação): o autor gostou.
- **Passo 2 com um exemplo do dia a dia:** a **Aqua aprendendo a fazer panqueca**, com as ligações que ajudam ficando fortes e a que atrapalha (a música) ficando fraca. A analogia está documentada em [07-guia-de-conteudo.md](../07-guia-de-conteudo.md#exemplo-do-dia-a-dia-a-aqua-aprendendo-a-cozinhar).
- **Desenhos da cozinha** (pedido do autor): a Aqua **preocupada** porque a panqueca queimou e **confiante** porque acertou o ponto. Frame "Aqua · cozinhando (poses)". **O rosto da Aqua continua o original (sem boca)**: a emoção vem de ícones acima da cabeça ("!" e gota de suor; estrela), e ela segura a frigideira pelo cabo. Poses descritas no [04-design-system.md](../04-design-system.md), seção 7.1. O autor viu outras opções de exemplo (feira, guarda-chuva, pênalti) e manteve a cozinha.
- **Analogia ao lado da técnica** (pedido do autor): o público é leigo, então cada passo técnico (5 a 8) mantém a fórmula e ganha um quadro **"No dia a dia"**. Os números da conta são os da cozinha (x = (0,90; 0,60; 0,30), w = (0,80; 0,50; −0,10), z = 0,99, sigmoide 0,73), e entram também a média da escola, a previsão do tempo e o "amigo que cozinha bem". Tabela em [07-guia-de-conteudo.md](../07-guia-de-conteudo.md#a-mesma-panqueca-com-números-passos-5-a-8).
- **Um tutorial só** (10 passos), já que a parte biológica encolheu. A divisão em dois, cogitada antes, não é mais necessária.
- **Revisão visual no fim** (pedido do autor): antes do teste, um passo junta tudo com a Aqua fazendo cada parte da conta, cada uma com uma reação nova (observando = entradas, pesando = pesos, somando = soma, decidindo = ativação) e o número da panqueca, terminando em a = f(Σ wᵢ·xᵢ). As reações estão no frame "Aqua · reações" e no [04-design-system.md](../04-design-system.md), seção 7.1.
- **Teste rápido visual:** o palco mostra o neurônio com as linhas e pesos e a conta em caixas (multiplica → soma → ativação), com lacunas em z e ReLU(z); a Aqua aparece "pensando". Acertar acende a lâmpada dela; errar a deixa preocupada e mostra a conta.
- **Figma primeiro.** O roteiro está no frame "Tutorial 01 · O neurônio · roteiro"; o código muda depois da aprovação.

Roteiro (10 passos): a ideia veio do cérebro → a Aqua aprendendo a cozinhar → do cérebro à matemática (história) → cérebro × IA × laboratório → entradas: o vetor x → pesos: wᵢ·xᵢ → soma ponderada → função de ativação (ReLU e sigmoide) → revisão visual com a Aqua → teste rápido visual (panqueca nova, ver Revisão 3).

## Revisão 3 (2026-10-20): passos 7, 8 e 10 mais claros

O autor achou os passos 7 e 10 confusos; a IA apontou também o 8. Decidido:
- **Passo 10 · uma escolha preenche as duas lacunas.** Antes o palco tinha duas lacunas (z e ReLU(z)) e a resposta era um número só ("0,30 acende"), sem dizer se era o z, o resultado ou os dois. Agora cada opção traz o par: **z = 0,60 · certeza 0,65** ✓, z = 0,60 · certeza 0,60, z = 0,90 · certeza 0,71 (esquecer os pesos).
- **"Acende / fica apagada" saiu do teste** (pedido do autor): a resposta é um número **de 0 a 1**, como a certeza do passo 8. Por isso o teste usa a **sigmoide**, igual à revisão do passo 9, com o lembrete "z = 0 → 0,5 · z positivo → mais de 0,5".
- **O teste usa os pesos que a Aqua aprendeu** (w = (0,80; 0,50)), numa panqueca nova sem música: x = (0,50; 0,40), z = 0,40 + 0,20 = 0,60, sigmoide ≈ 0,65. Antes os pesos mudavam do nada e o tempo virava negativo.
- **"Neurônios do meio" e "último neurônio" ficam para a aula de camadas** (pedido do autor). O tutorial 01 tem um neurônio só. No passo 8, a ReLU aparece pelo que faz (**negativo vira 0**: −0,50 → 0; 0,99 → 0,99) e a sigmoide também (**sempre entre 0 e 1**: 0 → 0,5; 0,99 → 0,73).
- **Passo 7 · a barra mostra a subtração.** Massa + tempo vão até 1,02, e a música aparece numa linha embaixo, em vermelho, "tirando 0,03" até o marcador z = 0,99. O quadro da média da escola saiu do palco (a analogia continua no texto "No dia a dia").
- **Passo 6:** a música "quase não conta, até tira um pouco (−0,10)", para combinar com a "ligação fraca" do passo 2.
- **Passo 3 · a Aqua fantasiada de cada pesquisador** (pedido do autor): McCulloch e Pitts (duas Aquas em 1943), Rosenblatt de óculos e topete (1958), cabelo e suéter dos anos 80 (1986) e a Aqua normal em "hoje". Detalhes no [04-design-system.md](../04-design-system.md), seção 7.1.
- **Passo 5 fica como está** (autor): é só a entrada; a nota de cada coisa não precisa ser explicada.

## Consequências

- O link **Tutoriais** da Home passa a funcionar.
- As visualizações são **SVG feito à mão a partir de números reais** (não o React Flow), leves e com transições CSS. Com "reduzir movimento" ligado, as mudanças acontecem sem animação ([ADR-0011](0011-acessibilidade-e-movimento.md)).
- Escrever um tutorial novo hoje é editar `web/lib/tutoriais.ts` (e, se precisar de um visual novo, `web/components/tutoriais/visuais.tsx`). O MDX do [ADR-0003](0003-conteudo-em-mdx.md) fica para quando houver muitos tutoriais.
- No celular, o palco fica em cima e o texto embaixo; os textos dentro do SVG ficam pequenos e podem precisar de um layout próprio.

## Em aberto

- O autor ainda não revisou o formato (passo a passo × rolagem) nem os textos.
- **Para a aula de camadas:** explicar onde cada ativação entra na rede (ReLU nos neurônios do meio, sigmoide no último, ligado à Saída), que saiu do tutorial 01 na Revisão 3.
- O código (`web/lib/tutoriais.ts`) ainda segue o roteiro antigo dos passos 6 a 10; muda depois da aprovação no Figma.
- **05 · Como a rede aprende**: o conteúdo depende da decisão sobre o Treinar e o backward pass ([ADR-0016](0016-modo-debug-backward-pass.md)).
- Se o tutorial deve abrir o laboratório já com a montagem certa (hoje leva para Novo projeto).
