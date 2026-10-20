# ADR-0021 · Bolinhas nas linhas, verde/vermelho e o passo do espremer

- **Status:** Aceita (autor); detalhes marcados são *proposta da IA*
- **Data:** 2026-10-19
- **Decisores:** autor do projeto

## Contexto

No laboratório em código ([ADR-0020](0020-laboratorio-em-codigo.md)), o autor achou as contas ok, mas o passo final ("Espremer entre 0 e 1: 1,20 → 0,77") não explicava como a soma vira o número. Ele também pediu um jeito visual de ver um neurônio "passando" o valor para a próxima camada.

Na rede de verdade nada viaja pela linha: o computador só multiplica o valor pelo peso e soma no neurônio da frente. A bolinha é uma metáfora visual. Ela só é honesta se carregar o número de verdade.

## Decisão

1. **Cores do sinal:** positivo em **verde**, negativo em **vermelho**, nas linhas, nos números dos pesos, na legenda e nas bolinhas. Isso substitui o azul/laranja ([04-design-system.md](../04-design-system.md)). O autor manteve verde/vermelho mesmo com o alerta de daltonismo. Tons `#16A34A` / `#DC2626`, e números em `#15803D` / `#B91C1C` (*proposta da IA*). O azul/laranja da Saída continua, porque ali são as cores que a rede classifica.
2. **Bolinhas:** a cada **Próximo** (e no Automático), uma bolinha **neutra** sai da origem com o valor dela. Ao passar pelo **número do peso**, faz a conta e vira o resultado, verde ou vermelha, e segue até o neurônio da próxima camada. A animação usa **GSAP** e dura cerca de **2 s**.
3. **Espremer:** no painel aparece a conta simples `1 ÷ (1 + 0,30) = 0,77`, com a fórmula completa `1 ÷ (1 + e^(−soma))` ao lado. O detalhe (o que é o *e*, por que a curva tem forma de S) fica para as aulas.
4. *Proposta da IA*, aprovada sem discussão:
   - O Automático passou de 0,9 s para 2,3 s por passo, para a bolinha terminar o caminho.
   - Resultado zero deixa a bolinha cinza.
   - Com "reduzir movimento" ligado no sistema, a bolinha aparece direto no fim, já com o resultado ([ADR-0011](0011-acessibilidade-e-movimento.md)).
   - O número na bolinha leva o sinal (−0,36), para não depender só da cor.

## Consequências

- `web/components/laboratorio/PesoEdge.tsx` desenha a bolinha (`Bolinha`) dentro do SVG da linha da vez. Ela anda junto com o zoom e o arraste do canvas e lê as pontas atuais da linha sem recomeçar.
- `gsap` entra nas dependências de `web/`.
- Figma: o frame "Laboratório · Desktop" foi atualizado com verde/vermelho e a bolinha na linha da vez. O frame novo "Laboratório · bolinhas e espremer" mostra os estados.
- A tela de aulas com a Aqua, que vai explicar o espremer com mais detalhe, ainda não existe. *(Feita depois: tutorial 03 · A sigmoide, [ADR-0022](0022-tutoriais-com-a-aqua.md). O nome "espremer" foi trocado por **sigmoide** na mesma revisão.)*

## Revisão (2026-10-19): bolinhas que se fundem, visual clean e pesos sem sobreposição

Depois de testar, o autor apontou quatro problemas. A bolinha parava e sumia, quando devia entrar no neurônio e somar com a próxima. Ela ficava fora do centro. Os números dos pesos se encavalavam ou ficavam embaixo dos blocos. E o "Como montar" não servia para nada. Regra dele: **na tela, nada pode ficar um em cima do outro**. Duas direções visuais (suave; curvas com rastro) foram recusadas por serem detalhadas demais. O autor pediu algo **clean, como Apple ou Claude**. Ele aprovou a versão chapada no Figma (frame "Laboratório · bolinhas clean"), pedindo a linha da vez em **aqua** e uma **borda em volta dos neurônios**.

1. **A bolinha entra no neurônio e soma:** ela anda centrada na linha, termina no **centro** do neurônio, encolhe e some dentro dele. O neurônio passa a mostrar a soma das parcelas que já entraram (ex.: 2,00 → 2,28), com um pulinho no número. Depois da ativação, ele mostra o valor que passa adiante.
2. **Visual clean:** sem sombra, sem brilho e sem gradiente. A bolinha é pequena e lisa: neutra branca com contorno aqua escuro, e o resultado verde, vermelho ou cinza (zero). O número fica em cima dela. A linha da vez é aqua, 2,5 px. O número do peso da vez vira "× 0,50" em texto escuro. Os neurônios têm borda aqua; com valor, ficam preenchidos pela cor do sinal, com a borda por fora.
3. **Números dos pesos sem sobreposição** (`posicionarPesos` em `web/lib/rede.ts`): cada linha informa suas pontas. O laboratório escolhe, para cada número, um ponto da linha (do meio para as pontas) que não encoste em outro número nem fique embaixo de um bloco. A linha da vez escolhe primeiro. *Proposta da IA.*
4. **Saíram:** o quadro "Como montar" da paleta e o selo da conta pendurado no canvas (`G: 0,55 × 0,50 = 0,28`). A conta continua no painel; no canvas, quem mostra é a bolinha.
5. *Proposta da IA:*
   - Voltar com ← Anterior não repete a viagem: a parcela daquele passo já aparece no neurônio.
   - A espessura da linha continua mostrando a força do peso (decisão anterior do autor), só que mais fina.
   - `formatar` arredonda 2,275 para 2,28, para a soma na tela bater com as parcelas.
6. **Só o neurônio da vez fica aceso** (pedido do autor): as linhas já feitas continuam acesas apenas enquanto o neurônio delas está fazendo a conta. Quando a vez passa para o próximo, elas voltam a ficar quase invisíveis.
7. **Igual ao Figma** (pedido do autor): os pontos da Entrada de onde saem as linhas ficaram pequenos e vazados (10 px, anel cinza), para não serem confundidos com neurônios. Os números dos pesos ganharam um espaço livre em volta, que corta a linha. Isso já estava no CSS, mas a camada dos números ficava abaixo das linhas no React Flow e o estado "apagada" deixava o fundo transparente.
8. **Painel mais enxuto** (pedido do autor): saiu a nota "Depois: se a soma for positiva, o neurônio acende; se não, passa 0." enquanto a soma ainda não está pronta. Ficam só o resultado (Positivo / Negativo ou zero) e o quadro do espremer.
