# ADR-0030 · Entradas além de cor no tema Redes neurais

- **Status:** Proposta, **adiada** (2026-11-04: o lab só tem a Entrada de cor; a aba da Aqua nasce com cor, e esta ADR só volta quando o autor decidir a próxima entrada)
- **Data:** 2026-11-04
- **Decisores:** Eduardo (autor), com propostas da IA
- **Relacionada:** [ADR-0028](0028-aba-da-aqua.md) (seção E: a Aqua não sabe que a entrada é cor), [ADR-0029](0029-saida-com-varias-cores.md) (várias cores na Saída, também adiada)

## Contexto

Hoje a única Entrada com significado é a cor (R G B, três números de 0 a 1). O autor avisou que o tema Redes neurais vai ter **outras entradas além de cores**, ainda sem saber quais. Esta ADR guarda as opções levantadas em 2026-11-03 para quando chegar a hora.

"Busca por significado" **não** é uma entrada deste tema: é o tema 2 do site (módulo 3 do [currículo](../02-curriculo.md), busca semântica com embeddings), um laboratório à parte.

## Opções (todas cabem na rede de hoje: uma Saída com sigmoide, duas respostas, ReLU no meio)

| Entrada | O que o aluno faz | O que ensina | Seletor na aba da Aqua |
|---|---|---|---|
| **Cor (R G B)** · já existe | escolhe uma cor | 3 números viram uma resposta | roda de cores + R G B |
| **Grade de pixels** (ex.: 5 × 5) | pinta quadradinhos: linha em pé × linha deitada, ou X × O | uma imagem é só uma lista de números (25 entradas) | o aluno desenha |
| **Ponto no plano** (x, y) | clica num mapa dividido em duas regiões | por que precisa da camada do meio: uma reta não separa um círculo | o aluno clica no mapa |
| **Ficha com características** (ex.: tamanho e doçura de uma fruta) | preenche 2 a 4 números | dados de tabela, o caso mais comum na vida real | formulário curto |

**Preferência da IA:** a grade de pixels. Combina com o estilo pixel art da Aqua, prepara para redes que reconhecem imagens e é mais divertida de usar na aba da Aqua (desenhar em vez de preencher).

## Nomes técnicos

| Nome técnico | O que é |
|---|---|
| **Característica** (*feature*) | Cada número que entra na rede. Na cor, R, G e B são 3 características. |
| **Vetor de entrada** | A lista com todas as características de um exemplo. |
| **Dados tabulares** | Exemplos descritos por colunas de números, como uma planilha (a "ficha"). |
| **Imagem como pixels** | Cada pixel vira uma característica (0 = apagado, 1 = pintado); uma grade 5 × 5 é um vetor de 25 números. |
| **Fronteira de decisão** (*decision boundary*) | A linha (ou curva) onde a rede troca de resposta. No ponto no plano, ela aparece desenhada no mapa. |
| **Linearmente separável** | Quando uma reta basta para separar as duas respostas. Um círculo dentro de outro não é: aí a camada do meio faz falta. |
| **Bias** | Um número somado em cada neurônio, que deixa a fronteira sair do centro. O lab ainda não tem. |

## Cuidados

- **Sem bias**, o ponto no plano sofre: a fronteira de decisão é obrigada a passar pelo centro do mapa. A grade de pixels quase não sente isso.
- Cada entrada nova traz o seu seletor e a sua leitura da Saída; a Aqua e o zoom da [ADR-0028](0028-aba-da-aqua.md) continuam iguais.
- Mais entradas = mais bolinhas no canvas: uma grade 5 × 5 já tem 25. O canvas precisa mostrar a Entrada agrupada (decidir quando a ADR voltar).

## Quando revisitar

- Quando o autor escolher a próxima entrada do tema Redes neurais.
- Quando entrar o *bias* no lab (destrava o ponto no plano).
