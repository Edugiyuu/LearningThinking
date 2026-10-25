# ADR-0023 · Sigmoide em passos e tutorial 01 com o exemplo do laboratório

- **Status:** Aceita
- **Data:** 2026-10-21
- **Decisores:** Eduardo (autor), com propostas da IA

## Contexto

O autor achou a sigmoide confusa no laboratório e no tutorial. O painel mostrava "soma −0,23 → 1 ÷ (1 + 1,26) = 0,44" e depois "Fórmula completa: 1 ÷ (1 + e0,23)". O sinal trocava sem explicação, o expoente parecia "e vezes 0,23" e o 1,26 aparecia do nada. A intuição ("soma alta chega perto de 1") vinha só no fim.

Revendo o tutorial 01, o autor também achou que ele explicava coisa demais. O passo 7 trazia Σ e "pré-ativação"; o passo 8 trazia ReLU e sigmoide juntas, com `f(z)`, `max(0, z)` e "73% de certeza"; e o teste pedia sigmoide(0,60) ≈ 0,65, que não dá para calcular de cabeça. Além disso, o exemplo da panqueca forçava a barra ("a música" como entrada) e não aparecia no laboratório.

## Opções consideradas

1. Só reordenar o texto da sigmoide (intuição primeiro, conta depois).
2. Mostrar no lab só a curva e o valor, sem conta.
3. **No lab, curva em S pequena + a conta em 3 passos com os números da rodada, sem a fórmula geral; no tutorial 03, a intuição primeiro, depois a fórmula, o *e* explicado e a mesma conta em passos.**
4. Esconder o *e* atrás de um "ver conta".

Para o tutorial 01: manter a panqueca e só cortar texto, ou trocar o exemplo pela tarefa do próprio laboratório.

## Decisão

Escolhemos a **opção 3** (o autor pediu "a fórmula só no tutorial, mas faça a conta normalmente"):

- **Laboratório, último neurônio:** o bloco se chama **Sigmoide** (nunca "espremer") e mostra a soma, uma curva em S de −6 a 6 com o ponto da soma e o resultado, e a conta em 3 passos: *1 · troca o sinal da soma*, *2 · e elevado a isso*, *3 · 1 ÷ (1 + …)*. No fim, um link "Por que essa conta? Tutorial A sigmoide →".
- **Tutorial 03, passo "A conta, passo a passo":** primeiro a ideia (soma 0 dá 0,50), depois a fórmula 1 ÷ (1 + e⁻ˢᵒᵐᵃ), o *e* como "um número fixo, como o π", a conta em 3 passos com a soma 3,41 do laboratório, e um quadro "Por que o sinal troca?".
- **Tutorial 01 usa o exemplo do laboratório:** a Aqua aprende a separar laranja de azul com os números do **detector de laranja** da montagem básica (pesos 2,00 · 0,50 · −2,00; laranja → 2,28).
- **Tutorial 01 mais simples:** o passo 7 fica só com "multiplica e soma" (sem Σ nem pré-ativação; z é "o nome que a IA dá para essa soma"). O passo 8 fica **só com a ReLU**, e a sigmoide vira uma linha que leva ao tutorial 03. A fórmula a = f(Σ wᵢ·xᵢ) do passo 9 vai para um bloco **"Para quem quiser"**, fechado por padrão.
- **Teste rápido com perguntas fáceis, de cabeça.** O tutorial agora tem uma **lista** de perguntas (`testes`), uma por tela. No 01 são duas, com o roxo (0,50; 0,00; 1,00) no mesmo detector: a soma (−1,00) e se acende (não, passa 0).
- **Sprites:** desenhos novos, pequenos, **sem ícone de emoção na cabeça**, só onde ajudam (Aqua separando cores no passo 2, Aqua com a lâmpada acesa no passo 8). A cena da cozinha saiu.

No Figma, o roteiro antigo do tutorial 01, a revisão com a panqueca e as poses de cozinha foram apagados; ficou um único "Tutorial 01 · O neurônio · roteiro".

## Consequências

**Positivas**
- O aluno vê no tutorial exatamente os números que o lab mostra (2,28 no detector de laranja; 3,41 → 0,97 na sigmoide).
- Cada passo tem uma ideia só; o teste mede entendimento, não memória.

**Negativas / custos**
- O tutorial 01 não apresenta mais a sigmoide; quem pular o tutorial 03 só vê a sigmoide no painel do lab.
- Os testes dos tutoriais 02 a 04 continuam com uma pergunta só, até o autor decidir.

**Riscos e mitigação**
- Se os pesos da montagem básica mudarem, os números do tutorial 01 ficam errados. Mitigação: os números estão juntos em `DETECTOR`, em `web/components/tutoriais/neuronio.tsx`, com um comentário apontando para `lib/rede.ts`.

## Quando revisitar

- Quando entrar o *bias*, que muda a conta do neurônio.
- Quando o Treinar existir: o tutorial 01 pode mostrar os pesos "chegando" a 2,00 · 0,50 · −2,00.
