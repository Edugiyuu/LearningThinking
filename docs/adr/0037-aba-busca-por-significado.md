# ADR-0037 · Aba Busca por significado: como seria

- **Status:** Proposta, **rascunho para discussão** (nada decidido ainda; tudo abaixo é proposta da IA para o autor ter uma ideia)
- **Data:** 2026-11-16
- **Decisores:** Eduardo (autor), com propostas da IA
- **Usa:** [ADR-0014](0014-laboratorio-abas-projetos-e-erros.md) (a aba faz parte da v1), [ADR-0005](0005-ml-no-navegador.md) (Transformers.js no navegador), [currículo, módulo 3](../02-curriculo.md), [ADR-0035](0035-revisao-de-ui-ux.md) (Busca por significado é feita em cima de uma rede neural)

## Contexto

A [ADR-0014](0014-laboratorio-abas-projetos-e-erros.md) colocou duas abas na v1: **Redes neurais** e **Busca por significado**. A primeira existe e funciona; a segunda aparece como "Em breve" porque nunca foi desenhada. Faltam os blocos, a montagem básica, o que o Rodar mostra e o papel da Aqua.

O nome técnico do tema é **busca semântica com embeddings**: achar textos pelo **sentido**, não pela palavra exata. "Estou com fome" deve achar "quero comer", mesmo sem nenhuma palavra em comum.

## A ideia em três passos

1. **Frase → números.** Uma rede neural lê a frase e devolve uma lista de números, o **embedding** (*vetor de embedding*). Frases de sentido parecido ganham listas parecidas.
2. **Números → ponto no mapa.** Cada lista é um ponto num **espaço vetorial**. Perto = sentido parecido.
3. **Comparar.** A pergunta do aluno também vira um ponto. A busca devolve os pontos mais perto dela, medidos pela **similaridade de cosseno** (perto de 1 = mesmo sentido, perto de 0 = nada a ver).

O passo 1 é o mesmo forward pass que o aluno já conhece da aba Redes neurais, só que com uma rede grande e já treinada.

## Como poderia ser (proposta da IA, para dar forma à ideia)

**Blocos**, ligados por fios como na aba Redes neurais:

| Bloco | O que faz | Parecido com |
|---|---|---|
| **Frases** | A lista de textos onde se vai procurar (o aluno escreve ou usa uma coleção pronta: comidas, animais, sentimentos) | Os Dados do Treinar |
| **Embedding** | Transforma cada frase numa lista de números | Uma Camada, só que pronta |
| **Pergunta** | O texto que o aluno quer achar | A Entrada |
| **Comparar** | Calcula a similaridade de cosseno entre a pergunta e cada frase | Um neurônio fazendo a soma |
| **Resultado** | As frases em ordem, da mais parecida para a menos, com a nota de cada uma | A Saída |

**Montagem básica pronta:** Frases (coleção "comidas e bichos") → Embedding → Comparar ← Embedding ← Pergunta → Resultado.

**Rodar:** como na aba Redes neurais, passo a passo. A pergunta cai no mapa, as linhas até os vizinhos acendem uma de cada vez com a nota (`0,82`), e no fim o Resultado mostra a lista em ordem.

**O mapa:** um quadro com os pontos em 2D. Os embeddings têm centenas de números; para desenhar, eles são levados para 2 (**redução de dimensionalidade**). O mapa é uma aproximação; a busca usa os números completos.

**A Aqua:** poderia ser quem "sai procurando" no mapa e volta com as frases achadas, com os olhos mudando conforme a nota (achou algo bem parecido × não achou nada).

## Perguntas em aberto (decisões do autor)

1. **De onde vêm os números do embedding?** É a maior escolha, porque muda o que o aluno consegue fazer e ver:
   - **A · Modelo de verdade no navegador** (`all-MiniLM-L6-v2` com Transformers.js): o aluno escreve qualquer frase. Custa um download de uns 25 MB, e cada frase vira 384 números, que não dá para mostrar um por um.
   - **B · Números já calculados** para coleções prontas: abre na hora, sem download, mas o aluno não escreve frases novas.
   - **C · Embedding de brinquedo**, feito à mão: poucos eixos com nome (ex.: "é comida?", "é animal?", "é bom?") e o aluno dá a nota de cada frase. Dá para ver todas as contas, mas não é como funciona de verdade.
   - Ou uma mistura (ex.: C para aprender a conta, A para ver o real).
2. **O que o Rodar mostra passo a passo?** Com 384 números, a conta do cosseno não cabe no painel. Com 2 ou 3 eixos, cabe.
3. **Mapa, lista ou os dois?** O mapa é bonito, mas é aproximado; a lista com notas é exata.
4. **Quais blocos o aluno liga sozinho?** Os cinco acima, menos, ou outros?
5. **A Aqua entra como?** Procurando no mapa, respondendo perguntas como na aba da Aqua, ou só nos tutoriais?
6. **Cor do tema.** O ciano previsto (`#14B8C4`) ficou parecido demais com o aqua da marca ([04-design-system](../04-design-system.md)).

## Nomes técnicos

| Nome técnico | O que é |
|---|---|
| **Busca semântica** | Achar pelo sentido, não pela palavra exata. |
| **Embedding** | A lista de números que representa uma frase. |
| **Modelo de embeddings** | A rede neural já treinada que transforma texto em embedding. |
| **Espaço vetorial** | O "mapa" onde cada embedding é um ponto. |
| **Similaridade de cosseno** | Mede se duas listas "apontam para o mesmo lado": de −1 a 1, perto de 1 = sentido parecido. |
| **Vizinhos mais próximos** (*k-NN*) | As *k* frases com maior similaridade com a pergunta. |
| **Redução de dimensionalidade** | Levar centenas de números para 2, para desenhar (PCA, t-SNE, UMAP). |

## Cuidados

- **Seguir o que o lab já tem:** os blocos e o Rodar devem parecer com os da aba Redes neurais (fios, passo a passo, Anterior/Próximo, erros no lugar exato).
- **Download do modelo** (opção A): precisa de barra de progresso e só baixar quando o aluno pedir; o texto não sai do navegador.
- **Mapa enganoso:** dois pontos podem parecer perto no 2D e não ser. O Resultado precisa mostrar a nota de verdade.
- **Tutoriais:** só depois que a aba existir (regra do projeto: tutoriais só com o que o lab tem).

## Quando revisitar

- Quando o autor responder as perguntas em aberto. Aí esta ADR vira **Aceita**, com telas no Figma antes do código.
