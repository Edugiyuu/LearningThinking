# ADR-0037 · Aba Busca por significado: como seria

- **Status:** Proposta, **em discussão** (pergunta 1 decidida em 2026-11-21; o resto ainda é proposta da IA)
- **Data:** 2026-11-16 · atualizada em 2026-11-21
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

## Decidido

### 1. De onde vêm os números do embedding (2026-11-21)

**Decisão do autor:** opção **A**, modelo de verdade no navegador.

- **Modelo:** `all-MiniLM-L6-v2`, versão **quantizada** (*quantization*: pesos guardados com menos casas decimais) de **23 MB**, rodando com Transformers.js. Cada frase vira **384 números**, porque a última camada desse modelo tem 384 neurônios; o número é escolha de quem criou o modelo, não um padrão.
- **Só em inglês:** o modelo foi treinado em inglês. As frases e a pergunta precisam estar em inglês, e a aba avisa isso. O resto do site continua em português.
- **O aluno monta enquanto baixa:** o download não bloqueia a aba. A página mostra que o modelo está baixando.
- **Depois:** talvez trocar por um modelo **multilíngue** de 384 números (`paraphrase-multilingual-MiniLM-L12-v2` ou `multilingual-e5-small`, **118 MB** quantizados), para aceitar português. Por agora fica o de 23 MB.

**Por que não o de 118 MB agora:** o download pesa mais, principalmente na escola, com vários alunos dividindo a mesma internet (conta feita em 2026-11-21: 30 alunos a 100 Mbps ≈ 1 min com 23 MB e ≈ 5 min com 118 MB). Tamanhos conferidos no Hugging Face na mesma data.

**Detalhes propostos pela IA e aprovados pelo autor:**

| Detalhe | Como fica |
|---|---|
| Quando baixa | Só quando o aluno abre a aba Busca por significado (**carregamento sob demanda**, *lazy loading*). Home e Redes neurais não baixam nada. |
| Onde aparece | Dentro do bloco **Embedding**: barra de progresso e "12 de 23 MB". |
| Rodar antes de terminar | Destaca o bloco Embedding com "ainda baixando", do mesmo jeito que os erros no lugar exato. |
| Internet cai | Mensagem no bloco Embedding e botão **Tentar de novo**. |
| Segunda visita | O navegador guarda o arquivo (**cache**); não baixa de novo. Só carregar na memória leva alguns segundos. |
| Tela travando | O modelo roda num **Web Worker** (uma linha de execução separada da tela), como previa a [ADR-0017](0017-stack.md). |
| Trocar de modelo | O nome do modelo fica num lugar só no código, para a troca pelo multilíngue ser uma linha. |

**Consequência:** a conta do cosseno tem **384 parcelas sem nome**, então não cabe uma por uma no painel. O que o Rodar mostra fica para a pergunta 2.

**Ainda não decidido:** de onde o arquivo é baixado, se dos servidores do Hugging Face (padrão do Transformers.js; o texto do aluno não sai do navegador, só o arquivo do modelo vem de fora) ou do próprio site no GitHub Pages.

## Perguntas em aberto (decisões do autor)

1. ~~**De onde vêm os números do embedding?**~~ **Decidido: opção A, em inglês (ver acima).** As opções que estavam na mesa:
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
