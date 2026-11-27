# 09 · Resumo: Busca por significado (conversa de 2026-11-16 a 2026-11-26)

> Cola rápida para não esquecer. Os detalhes e os porquês estão na [ADR-0037](adr/0037-aba-busca-por-significado.md); o mapa completo dos tipos de modelo e os nomes que se misturam estão na [ADR-0039](adr/0039-explicacoes-completas-que-ficam.md).

## O que a aba vai ser (decidido)

- **Objetivo:** o aluno sai sabendo que *frases parecidas ficam perto mesmo sem ter a mesma palavra*.
- **Começa com palavras.** O aluno escreve **palavras** (keyboard, nintendo) e **categorias** (electronics, food…).
- **Sem blocos e sem fios:** só caixas de texto, **mapa** e **barras**.
- **Mapa PCA** com tudo misturado. Clicar numa **palavra** mostra uma barra por categoria; clicar numa **categoria** mostra uma barra por palavra.
- **Caixa ao lado** para esconder palavras e categorias; esconder **não** refaz o mapa.
- **Rodar:** mostra os tokens (com `[CLS]` e `[SEP]` de outra cor), como os 384 números são feitos e, o principal, o posicionamento no mapa.
- **Modelo:** all-MiniLM-L6-v2, 23 MB, só inglês, roda no navegador, baixado do próprio site; o aluno monta enquanto baixa.
- **Erro do modelo:** a aba não explica na hora; o aluno descobre e acha o porquê no **glossário** (link na aba).
- **Nome:** continua "Busca por significado", porque a aba vai crescer.

## Conceitos (uma linha cada)

| Conceito | Em uma linha |
|---|---|
| **Token** | Pedaço do texto. O modelo só conhece uma lista fixa de ~30 mil pedaços; a palavra que não está na lista é cortada em pedaços que estão. `##` = "grudado no pedaço anterior". `[CLS]` e `[SEP]` = marcas de começo e fim que o modelo põe sozinho. |
| **Embedding** | O **resultado**: a lista de 384 números que representa uma palavra ou frase. |
| **Modelo de embeddings** | **Quem calcula** o embedding. O nosso é o all-MiniLM-L6-v2. |
| **Mean pooling** | O modelo dá 384 números por token e tira a **média**: frase ou palavra, sempre 384 no fim. |
| **Os 384 eixos** | Não têm nome. O sentido fica espalhado em vários números, como o laranja é uma mistura de R, G e B. |
| **Produto escalar** | Multiplicar par a par e somar: a mesma conta do neurônio. |
| **Norma / normalização** | Norma = tamanho da lista; normalizar = deixar com tamanho 1. |
| **Similaridade de cosseno** | Produto escalar ÷ normas. Vai de −1 a 1; perto de 1 = parecido, perto de 0 = nada a ver. É a **medida de verdade** (as barras). |
| **Classificação zero-shot** | A palavra vai para a categoria mais perto, **sem treino**. |
| **k-NN** | Achar os vizinhos mais perto. **Classificador:** os vizinhos votam (nosso caso, com k = 1). **Busca:** devolve os vizinhos em ordem. |
| **Busca semântica** | Uma pergunta procura numa coleção e volta com os mais parecidos. Mesma conta da classificação, pergunta diferente. |
| **PCA** | Leva 384 números para 2, para desenhar. Cada eixo é uma soma ponderada dos 384. Calcula **todos os pontos juntos**, é **aproximado** e precisa **centralizar** (tirar a média) antes. |
| **Quantização** | Guardar os pesos com menos precisão: 90 MB viram 23 MB. |
| **Inferência** | **Usar** o modelo: só forward pass, pesos parados. O modelo **não sabe que errou**. |

## Tokens (como o texto é cortado)

- **Vocabulário:** a lista fixa de ~30 mil pedaços do modelo. Foi montada **antes** do treino, com os pedaços que mais aparecem em muito texto em inglês, e **não muda**. O nosso modelo herdou a lista do BERT.
- **Corte:** palavra que está na lista fica inteira (*keyboard*); a que não está vira pedaços (*keybaord* → `key` `##ba` `##ord`).
- **`##`:** "grudado no pedaço anterior". O primeiro pedaço da palavra **não** tem `##`.
- **Tokens especiais:** marcas que o modelo põe sozinho. `[CLS]` = começo, `[SEP]` = fim (ou separador entre dois textos). Então *keybaord* vira **5 tokens**: `[CLS]` `key` `##ba` `##ord` `[SEP]`.
- **Cada família tem os seus:** BERT usa `[CLS]` `[SEP]` (e `[PAD]` enchimento, `[UNK]` desconhecido, `[MASK]` escondido no treino); RoBERTa usa `<s>` `</s>`; o GPT base quase só `<|endoftext|>`; modelos de chat ganham marcas de quem fala.
- **Cortadores:** o nosso usa **WordPiece**; o GPT usa **BPE**; existe também o **SentencePiece**. A ideia é a mesma, muda a regra do corte.

## Três jeitos de montar um Transformer

Todos são **Transformers** (a arquitetura de quase todo modelo de texto hoje). A diferença é o que eles fazem com o texto:

| Tipo | O que faz | Bom para | Exemplos |
|---|---|---|---|
| **Encoder** | **Lê** o texto inteiro de uma vez, olhando cada palavra junto com as dos dois lados, e devolve **números** | Embeddings, classificar, buscar | BERT, **MiniLM (o nosso)** |
| **Decoder** | **Escreve**, um token por vez; cada token novo só olha os que vieram **antes** | Conversar, gerar texto | GPT, Claude, Llama |
| **Encoder-decoder** | Uma parte **lê** a entrada toda, a outra **escreve** a saída olhando o que foi lido | Traduzir, resumir | T5, os primeiros tradutores com Transformer |

- Por isso o nosso modelo **não conversa**: ele é um encoder, só transforma texto em 384 números.
- **Modelo base × modelo de chat:** o base só **continua** o texto; o de chat é o mesmo modelo com **ajuste fino** para conversar. O ChatGPT **é** um GPT.

## Treino (o que o lab das cores já faz)

| Passo | O que faz |
|---|---|
| **Forward pass** | Calcula a saída. |
| **Perda** (*loss*) | Mede o erro. |
| **Backward pass** | Calcula a culpa de cada peso (o **gradiente**). |
| **Descida do gradiente** | **Ajusta** os pesos usando o gradiente; a **taxa de aprendizado** é o tamanho do passo. |

- **Sigmoide** é a função (curva em S, leva qualquer número para entre 0 e 1, **não arredonda**). **Regressão logística** é o modelo: soma ponderada + sigmoide. Quem arredonda é a **função degrau**.
- O mesmo modelo com a mesma palavra dá **sempre os mesmos números**. Só treinos separados (outra semente) dão números diferentes.

## Ensinar coisas novas a um modelo pronto

| Técnica | Em uma linha |
|---|---|
| **Ajuste fino** (*fine-tuning*) | Continuar treinando um modelo pronto. |
| **Aprendizado contrastivo** | Pares "perto" e "longe"; perda ex.: 1 − cosseno. É como o MiniLM foi treinado. |
| **Aprendizado por reforço** | Só uma nota: recompensa ou punição. A IA dos jogos. |
| **RLHF** | Reforço com nota dada por pessoas (o 👍 e 👎 dos chats). |
| **Ensemble** | Juntar vários modelos pela **média das notas** (não dos mapas). |

## Riscos ainda não medidos

- Notas reais entre palavras (achamos ~0,4–0,6 para relacionadas e ~0,1 para sem relação).
- Sentimento: modelos juntam mais por **assunto** que por sentimento; a negação pode enganar.
- Palavras que surpreendem: dois sentidos (*mouse*, *apple*), português (*teclado*), gíria ou marca, erro de digitação.

## Para depois

- **Frases, pergunta e busca de verdade** (branch e ADR próprias, depois que o frontend com palavras funcionar).
- Frases com sentimento (love × hate).
- Aprendizado contrastivo (adiado: o lab não tem perda de pares); reforço depois dele.
- Dois modelos (ex.: o multilíngue de 118 MB).
- Glossário no site ([ADR-0039](adr/0039-explicacoes-completas-que-ficam.md)).

## Perguntas da ADR-0037 (todas decididas em 2026-11-26)

1. ~~Tokens na tela~~ decidido: o Rodar mostra os pedaços **e** o `[CLS]` e o `[SEP]`, as marcas **de outra cor** (o tom exato fica para o Figma).
2. ~~Aqua~~ decidido: ela representa o **modelo de embeddings**.
3. ~~Cor~~ decidido: as mesmas do lab (aqua claro `#5ED3DB` e branco), estilo simples.
4. ~~Download~~ decidido: do **próprio site** (GitHub Pages), por causa da rede da escola.

Depois: telas no **Figma**, e só então o código.
