# ADR-0032 · Salvar sem travar e blocos que entram e saem com GSAP

- **Status:** Aceita (autor), código feito (2026-11-10)
- **Data:** 2026-11-10
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0017](0017-stack.md) (a montagem fica salva no navegador), [ADR-0031](0031-paineis-recolhiveis.md) (mesma branch)

## Contexto

**1. "Salvando…" a cada milímetro.** O laboratório salvava a montagem (blocos, fios, pesos e Dados) no `localStorage` (o armazenamento do navegador) um pouco depois de **qualquer** mudança nos blocos. Só que o React Flow (a biblioteca do canvas) muda a lista de blocos o tempo todo, mesmo quando a montagem não muda:

- a cada quadro de um arraste (umas 60 vezes por segundo);
- ao selecionar um bloco;
- ao medir o tamanho de um bloco que acabou de aparecer.

A cada uma dessas mudanças, o rótulo trocava para "Salvando…" e o laboratório inteiro era redesenhado. Isso causava um leve travamento ao arrastar.

**2. Blocos aparecendo e sumindo de uma vez.** Um bloco solto da paleta, ou um neurônio que entra numa camada, aparecia de repente. Ao ser apagado, sumia de repente.

## Decisão

### Salvar só o que muda a montagem

- O salvamento compara uma **assinatura** da montagem: um texto em JSON (o formato de texto dos dados) com o tipo, a posição (arredondada), a camada e os dados de cada bloco, além dos fios, pesos, Dados e se a rede já rodou. Selecionar e medir os blocos não mudam a assinatura, então não salvam.
- **Enquanto o aluno arrasta, nada é salvo.** Salva uma vez, quando ele solta o bloco.
- Isso é um **debounce** (esperar parar de mexer antes de agir): espera 800 ms sem mudanças e só então grava.
- O rótulo "Salvando…" saiu. O rótulo fica "Salvo", ou "Não salvo" se o navegador não deixou gravar. Gravar no `localStorage` é instantâneo, então o "Salvando…" só aparecia piscando.

### Entrada e saída dos blocos com GSAP

As duas animações valem para todos os blocos: Entrada, Camada, Neurônio, Saída e Backward pass. Seguem a regra do projeto: movimento sempre em **timeline do GSAP** (uma sequência de animações com tempo marcado), nunca keyframes de CSS.

- **Entrar:** o bloco começa em 60% do tamanho e invisível, e cresce até o tamanho certo. A escala usa `back.out` (passa um pouco do tamanho final e volta, como uma "mola") e a opacidade aparece suave. Com vários de uma vez (por exemplo, a camada passa de 1 para 3 neurônios), eles entram um depois do outro (`stagger`).
- **Sair:** o bloco encolhe e some (cerca de 0,2 s). **Só depois** ele sai da montagem. Até a animação terminar, a rede continua com ele.
- A montagem que abre com a página não anima. Só animam os blocos que entram ou saem depois.
- O GSAP anima o **filho** da caixa do bloco (`.react-flow__node > *`), porque o React Flow usa o `transform` da caixa de fora para posicionar o bloco.
- **No fim da entrada, o React Flow mede o bloco de novo** (`updateNodeInternals`). Ele mede onde ficam as bolinhas de conexão (os *handles*) quando o bloco aparece, e nessa hora o bloco ainda está em 60% do tamanho, encolhido para o centro. Sem medir de novo, os fios ficavam presos uns 25 px mais perto do meio do bloco e não nas bolinhas (o autor viu isso numa Camada nova). Mudar só a escala com `transform` não dispara uma nova medida sozinho.
- **Aba escondida:** o navegador para os quadros de animação (`requestAnimationFrame`) quando a aba não está visível. Nesse caso, o bloco sai e entra na hora, sem animação. Se não fosse assim, o apagar ficaria esperando uma animação que não anda.

### Arrastar sem redesenhar o que está parado (segunda rodada, 2026-11-10)

Só tirar o salvamento do caminho não bastou: o autor ainda sentia travadas ao segurar e arrastar um bloco. Medindo com o `Profiler` do React (a ferramenta que mostra quanto tempo cada parte leva para desenhar), apareceram três causas:

1. **O `treino` era um objeto novo a cada desenho.** O `useTreino` devolvia `{ fase, config, comecar, … }` criado de novo toda vez. Como ele vai no contexto do lab (`LabContexto`), **todos os blocos se redesenhavam a cada movimento do mouse**, até os parados. Agora o objeto é memorizado (`useMemo`) e as funções são estáveis (`useCallback`). O `ler` mais novo fica numa ref (uma caixinha que guarda um valor sem redesenhar a tela).
2. **As linhas de peso eram refeitas a cada quadro.** Linhas, contas e o aviso da Aqua agora usam a **forma** da montagem: quais blocos existem, em que camada e com que dados. Enquanto só a posição muda, a forma é a mesma e nada disso é recalculado.
3. **A posição dos números dos pesos era recalculada a cada quadro.** No meio do arraste, os números ficam no mesmo ponto da linha (eles andam junto com ela). A posição só é recalculada quando o aluno solta o bloco. Ela também foi para um contexto separado (`PosicaoDoPesoContexto`), que só as linhas leem. Assim, soltar um bloco não redesenha todos os outros.

Medido em modo de desenvolvimento (mais lento que o site publicado): soltar um bloco caiu de cerca de 46 ms para 15 ms de desenho. A Entrada e a Saída pararam de se redesenhar quando outro bloco é arrastado.

### Terceira rodada: travadas que voltam de tempos em tempos (2026-11-10)

O autor mandou um vídeo arrastando a Entrada de uma rede com 5 neurônios na Camada 1 (20 linhas de peso). Seguindo o bloco quadro a quadro no vídeo (30 quadros por segundo):

- o bloco ficava **atrás do cursor** e só mudava de lugar a cada 2 ou 3 quadros (uns 10 a 15 fps);
- as piores travadas se repetiam a cada **~1 s**, durando uns 0,3 s.

O que mudou no código:

- **Props do `<ReactFlow>` estáveis.** O React Flow guarda as props numa memória interna (um *store*) e atualiza essa memória quando uma prop vira um objeto ou uma função nova. Três props mudavam a cada movimento:
  - `onEdgeDoubleClick`, uma função escrita direto no JSX;
  - `fitViewOptions`, um objeto escrito direto no JSX;
  - `isValidConnection`, que dependia de `nodes`.

  Agora as duas primeiras são fixas (`useCallback` e uma constante). O `isValidConnection` passou a olhar só a forma da montagem.
- **Paleta, painel de contas e as Aquas do topo memorizados** (`memo`: o componente só se redesenha quando as props mudam). Para isso, as props do painel ficaram estáveis: `irPara`, `rodarAgora` e `textoResposta` são funções fixas, e a seção do Treinar é memorizada.

Medindo no painel do navegador do app, o mesmo desenho do React chegou a custar de 3 a 5 vezes mais em algumas fases do que em outras, fazendo o mesmo trabalho. **Suspeita, não confirmada:** parte disso é o **modo de desenvolvimento** (`npm run dev`), em que o React confere tudo duas vezes (StrictMode) e o Next.js roda ferramentas extras. A versão publicada (`npm run build` e `npm start`) compilou, mas não deu para medir nela com o painel do navegador escondido.

**Confirmado pelo autor (2026-11-10):** depois dessas mudanças, arrastar ficou liso no `npm run dev`.

### Topo responsivo

- "Rodar de novo" e "Perguntar à Aqua" nunca quebram em duas linhas (`white-space: nowrap`).
- **Até 1200 px:** espaços e botões ficam mais justos.
- **Até 960 px:**
  - o logo fica só com a Aqua (o link continua com nome para o leitor de tela);
  - o rótulo "Salvo" sai;
  - a aba desativada "Busca por significado" sai, para não ficar por baixo dos botões.
- Testado em 1024 px e 880 px: tudo numa linha, sem nada por cima de nada.

## Consequências

- Arrastar fica liso. O salvamento acontece uma vez, quando o aluno solta o bloco.
- Apagar um bloco demora uns 0,2 s a mais para refletir na rede (o tempo da saída).
- A mudança de posição dos neurônios que **ficam** na camada (quando um sai e os outros se reorganizam) ainda não é animada.
