# ADR-0036 · Hero: cena animada com GSAP, da Aqua até uma constelação de redes

- **Status:** Aceita. Vale a **versão 2** (seção "Atualização 2"), aprovada pelo autor no Figma em 2026-11-16 e implementada em `web/components/cena-heroi.tsx`. A versão 1 e a seção "Atualização: a cena anda com a rolagem" ficam só como histórico.
- **Data:** 2026-11-16
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0028](0028-aba-da-aqua.md) (o desenho da Aqua e os olhos que mudam com a reação), a regra do projeto "Aqua animada por quadros: o GSAP é só o relógio", o componente `RedeHeroi` do hero atual
- **Figma:** página "Hero com vídeo", frame "Cena do hero · quadros-chave (GSAP)"

## Contexto

O autor quer o hero da Home mais impressionante. A primeira ideia foi um vídeo gerado pelo Gemini (10 s por pedido). Testamos dois vídeos:

1. O primeiro trocou a Aqua por outro robô (com pescoço, fones e óculos) e tinha texto fantasma no fundo.
2. O segundo acertou a Aqua e a ideia (zoom out da Aqua até muitas redes neurais ligadas entre si), mas:
   - a **resolução** é 1280 × 720. No quadro do hero (1120 px de largura, ~2240 px numa tela retina), as linhas finas da rede ficam borradas;
   - o **ritmo** ficou ruim: quase todo o zoom acontece nos 3 primeiros segundos;
   - apareceu um risco branco brilhante em 0,9 s, e não houve a "reação em cadeia" pedida.

## Decisão

Fazer a cena **no próprio site**, em **SVG** (*Scalable Vector Graphics*: desenho feito de formas, que fica nítido em qualquer tamanho) animado com **GSAP** (a biblioteca de animação que o projeto já usa). O vídeo do Gemini serve só de roteiro.

A cena tem 10 s, toca **uma vez** e para no último quadro:

| Tempo | Quadro | O que acontece |
|---|---|---|
| 0 s | 1 · Aqua de perto (zoom 9×) | Pulsos ciano correm pelas últimas ligações até o bracinho da Aqua. |
| 3 s | 2 · a rede da Aqua (zoom 4,6×) | A câmera afasta e aparecem os pesos (verde = positivo, vermelho = negativo). Os pulsos andam camada por camada. |
| 7 s | 3 · as outras redes acendem (zoom 1,6×) | Os pulsos saem da rede da Aqua pelos cabos, e cada rede vizinha **acende** quando o pulso chega. |
| 10 s | 4 · constelação (zoom 1×) | Todas as redes estão acesas. A Aqua faz o olho feliz (^ ^) por 1 s. Depois ficam só pulsos lentos. |

Como funciona:

- **Câmera:** todo o desenho fica dentro de um grupo "mundo". Afastar a câmera é um *tween* (uma animação de um valor até outro) da escala e da posição desse grupo, com *ease* `power2.inOut` (começa e termina devagar).
- **Reação em cadeia:** as redes acendem na ordem da **distância em cabos** a partir da Aqua (vizinhas primeiro, depois as vizinhas das vizinhas). Em programação isso é uma **busca em largura** (*BFS*, *breadth-first search*): visitar primeiro tudo o que está a 1 passo, depois a 2 passos, e assim por diante.
- **Aqua:** é o sprite que já existe no site. Os olhos mudam **por quadros** (troca do desenho) e o GSAP só marca a hora da troca, como na aba da Aqua.
- **Desempenho:** as redes de fundo são desenhadas uma vez e ficam paradas. Só os pulsos, a opacidade das redes e a câmera se mexem.
- **Acessibilidade:** quem ativou "reduzir movimento" no sistema (`prefers-reduced-motion`) vê só o quadro 4, parado. Um botão de pausa fica no canto do quadro.

## Atualização: a cena anda com a rolagem (2026-11-16)

Depois de ver os quadros, o autor pediu que a cena **ande com a rolagem**: rolar para baixo avança, rolar para cima volta. Isso muda a parte de "tocar uma vez":

- **ScrollTrigger com scrub:** o ScrollTrigger é o plugin do GSAP que liga uma animação à rolagem da página. Com *scrub*, a posição da linha do tempo acompanha a posição da rolagem, em vez de tocar sozinha. Os 10 s viraram só a régua da linha do tempo; quem decide a velocidade é quem rola. Usamos `scrub: 0.6`, que suaviza (a animação alcança a rolagem em 0,6 s).
- **Quadro preso na tela:** a cena fica dentro de um "trilho" de 260% da altura da tela. O quadro usa `position: sticky` (do CSS: o elemento rola com a página até encostar no topo e fica preso lá até o trilho acabar). A animação começa quando o topo do trilho passa de 70% da tela e termina quando o trilho acaba. Escolhemos o sticky do CSS e não o `pin` do ScrollTrigger porque o `pin` embrulha o elemento num `div` extra, e isso briga com o React.
- Por causa do sticky, o hero trocou `overflow-hidden` por `overflow-x-clip`: o `hidden` transforma a seção numa área de rolagem própria, e aí o sticky não prende.
- **Botão de pausa:** saiu. A cena não toca sozinha, só anda quando a pessoa rola, então não há o que pausar.
- **Reduzir movimento:** quem ativou `prefers-reduced-motion` não ganha o trilho alto (classe `motion-safe:` do Tailwind) e vê o quadro 4 parado. O GSAP decide isso com `gsap.matchMedia()`.
- **Desfazer ao rolar para cima:** toda mudança é um *tween* ou um `set` dentro da mesma linha do tempo, então volta sozinha. O olho normal da Aqua precisa de `visibility="visible"` escrito no SVG, senão o GSAP não sabe para qual valor voltar.

Como ficou no código:

- O **mundo** (as 17 redes, os 23 cabos, os níveis da busca em largura e os caminhos dos pulsos) é gerado por `web/scripts/gerar-cena-heroi.py`, com a mesma semente de sorteio dos quadros do Figma. O script grava `web/components/cena-heroi-mundo.ts`. Para mudar o desenho, muda-se o script e roda-se de novo.
- A **câmera** anda com o zoom em escala logarítmica (de 9× para 4,6× leva o mesmo "tempo de olho" que de 2× para 1×).
- Espessuras que devem parecer iguais na tela, como os cabos e os pulsos, são divididas pelo zoom a cada passo da câmera.
- O `RedeHeroi` foi **retirado**: a rede da Aqua dentro da cena já faz o papel dele.

## Atualização 2: neurônios espalhados, sem quadro, tocando sozinha (2026-11-16)

O autor viu a versão 1 rodando e pediu três mudanças:

1. **Tocar sozinha, como um vídeo**, e não andar com a rolagem. O ScrollTrigger com *scrub* e o trilho *sticky* saem. A cena toca uma vez ao abrir a Home (10 s) e depois fica com pulsos lentos. Como ela se mexe sozinha por mais de 5 s, o **botão de pausa volta**: é o que pede a regra de acessibilidade WCAG 2.2.2 ("Pausar, parar, ocultar"). Quem usa "reduzir movimento" continua vendo só o último quadro.
2. **Neurônios espalhados, não redes arrumadas.** Saem as 17 redes em camadas. Entra um campo de cerca de 340 neurônios soltos:
   - Eles são espalhados por **amostragem de disco de Poisson**: sortear pontos e só aceitar o que não fica perto demais de outro. Isso dá um espalhamento natural, sem grade e sem amontoados.
   - O espaçamento cresce com a distância da Aqua: denso perto dela, ralo longe.
   - Cada neurônio se liga aos **3 vizinhos mais próximos**. A cor da ligação segue o peso, como no resto do site: verde é positivo, vermelho é negativo.
   - A Aqua fica no centro, e os bracinhos dela se ligam aos neurônios mais próximos.
3. **Combinar com o site, sem "quadro de animação".** Sai o cartão com borda arredondada e sombra. A cena fica com o fundo transparente, e as bordas somem no branco da página (uma máscara com degradê radial). Assim ela parece parte do hero.

Como a cena anda:

- **Câmera:** fica parada no centro da Aqua e só afasta, de zoom 6× até 1×. O zoom anda em escala logarítmica com *ease* `sine.inOut`.
- **Onda de ativação:** a Aqua "acende" o mundo. Os pulsos saem dos bracinhos, e cada neurônio acende quando o pulso chega: primeiro pisca cheio de aqua, depois fica com o anel aqua. As ligações passam de cinza para a cor do peso.
- **Ordem da onda:** é a do **caminho mais curto pelas ligações** a partir da Aqua (algoritmo de **Dijkstra**: como a busca em largura, mas somando o comprimento de cada ligação, e não só contando os passos).
- **Velocidade da onda:** a frente acompanha o que a câmera mostra (distância = k × metade da largura visível − c). Assim a onda fica sempre perto da borda da tela durante o afastamento.
- **A Aqua continua visível no fim:** ela encolhe menos que o mundo (pixel = 4,5 × zoom^−0,4). Fica com 263 px de largura no começo e 90 px no fim, e faz o olho feliz (^ ^) quando tudo acende.

Figma: frame "Cena do hero v2 · neurônios espalhados (vídeo automático)", com os 4 quadros, e frame "Hero v2 · cena sem quadro (GSAP, toca sozinha)", com o hero inteiro.

Como ficou no código (v2):

- `web/scripts/gerar-cena-heroi.py` gera o mundo e grava `web/components/cena-heroi-mundo.ts`. É o mesmo sorteio dos quadros do Figma: 341 neurônios, 611 ligações e 6 ligações dos bracinhos. O script também grava o segundo em que cada neurônio acende e de onde vem o pulso que o acende.
- **Servidor × navegador:** a camada apagada (ligações cinza e neurônios com anel cinza) vem pronta do servidor, em poucos caminhos SVG. As camadas que acendem (uma ligação ou um neurônio por elemento, para acender um a um) são montadas pelo navegador quando a página abre. Assim o HTML da Home não fica pesado.
- **Espessura das ligações:** é medida em pixels da tela (`vector-effect: non-scaling-stroke`, que faz o traço não engrossar junto com o zoom). Ela muda com o zoom por grupo de espessura, e não ligação por ligação.
- **Linha do tempo:** 0,6 s com a Aqua parada soltando os primeiros pulsos, mais 10 s de câmera. No fim começa um ciclo de 18 pulsos lentos por ligações sorteadas. O botão de pausa para os dois.
- **Celular:** a cena fica com a largura da tela. Testamos deixá-la mais larga e cortada, mas aí as laterais apareciam cortadas secas, sem o degradê.

## Alternativas consideradas

- **Vídeo do Gemini:** descartado pela resolução baixa, pelo ritmo e por não acertar a Aqua com segurança. Também pesaria uns 2 MB no carregamento da Home.
- **Vídeo no fundo do hero, atrás do título:** descartado já no Figma (opção A), porque o título perde leitura.

## Consequências

- A Home fica mais leve que com vídeo, e a cena fica nítida em qualquer tela.
- Dá mais trabalho que colar um vídeo, e o desempenho com muitas linhas precisa ser medido no celular.
- O `RedeHeroi` saiu do projeto; a legenda "Uma rede neural de verdade, calculada no seu navegador" saiu junto, porque a cena é ilustrativa e não calcula a rede.
- No celular o quadro fica pequeno (16:9 numa tela em pé). Um quadro mais alto só para celular, com outra câmera, fica para depois se fizer falta.
- O desempenho ainda precisa ser medido num navegador de verdade, principalmente no celular: o navegador de testes usado na implementação roda a poucos quadros por segundo mesmo com a página vazia, então não serve para medir isso.
