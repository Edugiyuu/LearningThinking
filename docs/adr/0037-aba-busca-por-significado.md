# ADR-0037 · Aba Busca por significado: como seria

- **Status:** Proposta, **perguntas decididas** (1 a 6, o nome, a origem do download e os tokens na tela, até 2026-11-26). Próximo passo: telas no Figma, depois o código.
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

### Objetivo da aba (2026-11-22)

**O que o aluno tem que sair sabendo** (palavras do autor): *frases parecidas ficam perto mesmo sem ter a mesma palavra.*

É o que separa esta aba da aba Redes neurais. Lá o aluno **monta e treina** a rede; aqui a rede (o modelo de embeddings) vem **pronta**, e o aluno **explora e compara** o que sai dela. Por isso o autor acha que esta aba deve ser **bem diferente** do lab das cores. Ainda não está decidido se os blocos e fios do rascunho abaixo continuam.

**Ideia do autor (2026-11-22):** mostrar os **tokens** na aba, ou seja, o texto sendo quebrado em pedaços antes de virar números. O jeito de mostrar ainda não foi definido.

**Decidido pelo autor (2026-11-26): o Rodar mostra também `[CLS]` e `[SEP]`.** São os **tokens especiais** (*special tokens*) que o modelo põe sozinho em todo texto: `[CLS]` no começo e `[SEP]` no fim. Ex.: *keybaord* → `[CLS]` `key` `##ba` `##ord` `[SEP]` (5 tokens; `##` = pedaço grudado no anterior). **Decidido (2026-11-26): as marcas aparecem de outra cor** que os pedaços do texto do aluno; o tom exato fica para o Figma.

- **Nota da IA, a conferir no código:** no all-MiniLM-L6-v2 a média (*mean pooling*) **inclui** o `[CLS]` e o `[SEP]`. Então o embedding de *keyboard* é a média de **3** listas de 384 números, não de 1. Se for confirmado, o Rodar mostra isso.
- **Mapa completo dos tokens especiais** (regra 1 da [ADR-0039](0039-explicacoes-completas-que-ficam.md)): cada família de modelo tem os seus. Na nossa (BERT, cortador **WordPiece**): `[CLS]` começo, `[SEP]` fim ou separador entre dois textos, `[PAD]` enchimento para textos do mesmo tamanho, `[UNK]` pedaço desconhecido, `[MASK]` palavra escondida no treino. Na família RoBERTa e XLM-R (ex.: o multilíngue de 118 MB): `<s>` e `</s>`. No GPT (cortador **BPE**), na versão **base**, que só continua texto: quase só `<|endoftext|>`, sem marca de começo. Quando um LLM (GPT, Claude…) é **ajustado para chat**, ganha também marcas de quem está falando (usuário, assistente). Correção de 2026-11-26: a primeira versão desta nota punha "GPT" e "LLMs de chat" como famílias diferentes; o ChatGPT **é** um GPT, e a diferença é **base × chat**, não de família. Na aba só aparecem `[CLS]` e `[SEP]`; os outros ficam para o glossário.

**Ideia do autor (2026-11-22): começar por palavras.** Primeiro palavras soltas (ex.: o aluno digita "keyboard" e vê que fica perto de "electronics"), depois frases. Uma palavra sozinha também vira 384 números, então o modelo escolhido serve para as duas. O nome técnico do que o aluno faz é **classificação zero-shot** (*zero-shot classification*): pôr a palavra na categoria mais perto sem treinar com nenhum exemplo.

**Decidido pelo autor (2026-11-22):**

- **O aluno escreve as categorias.** Elas não vêm prontas.
- **Frases só depois.** Elas entram quando as palavras estiverem claras: ideia, telas, como o aluno interage e o que ele vê.

**Como mostrar a comparação.** A IA desenhou três opções: barras com a nota, setas com o ângulo de verdade (uma por categoria) e mapa de pontos (aproximado).

**Proposta do autor (2026-11-23, em discussão):** juntar o **mapa** e as **barras**. O aluno vê primeiro o mapa, com o mais próximo em destaque. Clicando na palavra dele ("keyboard"), aparecem as barras com a nota de todas as categorias. Clicando numa categoria ("electronics"), também aparecem barras. O mapa dá a intuição ("perto = parecido") e as barras dão o número exato. Em aberto: o que fazer quando o mapa e as barras discordam; os pontos mudando de lugar quando o aluno escreve uma categoria nova.

- **Decidido (2026-11-23): clique numa categoria** mostra **uma barra só**, a nota entre a palavra do aluno e a categoria clicada (ex.: keyboard × electronics).
- **Fato registrado:** escrever uma categoria nova **não muda as notas** das que já estavam. Cada nota depende só das duas listas comparadas. O que pode mudar é a **posição dos pontos no mapa**, porque a redução para 2 números (ex.: PCA) usa todas as palavras juntas.
- **Autor (2026-11-23):** os pontos se mexerem **não é um problema**, embora possa confundir o aluno.
- **Decidido (2026-11-23): o mapa é feito com PCA** (*Principal Component Analysis*). Cada eixo do mapa é uma soma ponderada dos 384 números, com pesos escolhidos pelo PCA para os pontos ficarem o mais espalhados possível. O mapa é aproximado; a nota exata fica nas barras.
- **Decidido (2026-11-23): várias palavras no mesmo mapa** ("misturado"). Keyboard, nintendo e as categorias ficam todos no mesmo mapa PCA.
- **Decidido (2026-11-23): clique numa categoria** mostra **uma barra por palavra do aluno** (ex.: clicou em electronics → keyboard × electronics e nintendo × electronics). Com uma palavra só, continua sendo uma barra.
- **Decidido (2026-11-23): caixa ao lado para esconder palavras e categorias.** Para não virar bagunça, o aluno pode **esconder** uma palavra ou uma categoria em vez de apagar (ex.: esconder nintendo para olhar só keyboard; esconder animals para olhar só electronics e games).
  - **Esconder não refaz o mapa.** Os pontos ficam onde estavam e o escondido só some do desenho. Motivo do autor: *"ele só fica escondido, não está tirando"*. Ou seja, o PCA (redução de dimensionalidade) continua calculado com tudo o que o aluno escreveu, e só **apagar** muda o cálculo.
  - As barras também não mudam, porque a nota (similaridade de cosseno) de um par não depende das outras palavras. O que está escondido só não aparece nas barras.
- **Preocupação do autor (2026-11-23): o aluno interage pouco.** Só `palavra → tokens → 384 números → mapa` é um caminho fixo, em que o aluno escreve e olha. Por isso o autor quer **embedding e frases** também na aba. Ainda não está decidido como o aluno mexe nisso.
  - Lembrete de nome: **embedding** (vetor de embedding) é o resultado, a lista de 384 números. Quem calcula é o **modelo de embeddings** (all-MiniLM-L6-v2). Uma frase vira vários tokens; o modelo dá 384 números por token e tira a média (*mean pooling*). Por isso palavra e frase acabam com o mesmo tamanho, 384, e podem ficar **no mesmo mapa**.
- **Ideia do autor (2026-11-23): frases com categorias de sentimento.** O aluno escreve categorias como `love` e `hate`, e a frase *"I like playing games"* deve ficar perto de `love`, não de `hate`. É a mesma ideia das palavras (**classificação zero-shot**), agora aplicada a sentimento (**análise de sentimento**).
  - Risco levantado pela IA, **não medido**: modelos de embedding costumam juntar frases pelo **assunto** mais do que pelo **sentimento**. *"I love games"* e *"I hate games"* podem dar notas parecidas, e a **negação** (*"I don't like games"*) pode cair perto de `love`. Isso precisa ser medido quando o modelo estiver no código. Pode virar parte da aula ("tentar enganar o modelo").
  - Observação do autor (2026-11-24): *o modelo não sabe que errou, só o aluno sabe.* Está certo. Na aba o modelo só faz o *forward pass*, com os pesos parados: não existe **perda** (*loss*), nem *backward pass*, nem **descida do gradiente**. "Errou" só existe em relação ao que o aluno esperava. Então a aba **não consegue detectar o erro sozinha**: quem julga é o aluno.
  - **Decidido (2026-11-25): quando o resultado parece errado, a aba não avisa nem explica na hora.** O aluno descobre sozinho. Motivo do autor: *"é bom fazer o aluno se perguntar o porquê"*.
    - Riscos levantados pela IA: (1) o aluno pode **nunca chegar** ao caso, porque precisa ter a ideia de escrever uma negação; (2) depois de se perguntar o porquê, ele precisa **achar a resposta em algum lugar**, senão volta a sensação da [ADR-0039](0039-explicacoes-completas-que-ficam.md) (*"você nunca me fala tudo"*). Em aberto: onde fica essa resposta.
    - **Decidido (2026-11-25): a resposta fica no glossário** ([ADR-0039](0039-explicacoes-completas-que-ficam.md)), com um **link na própria aba**. Vale para qualquer resultado que surpreenda, não só para sentimento.
  - **Decidido (2026-11-25): frases com sentimento ficam para depois.** O foco agora são as **palavras** (ex.: keyboard fica mais perto de electronics do que de food). Resultados que surpreendem também aparecem com palavras, todos **não medidos**:
    - **palavra com dois sentidos** (*mouse*: animal ou eletrônico; *apple*: fruta ou empresa);
    - **palavra em português** (*teclado*), porque o modelo é só em inglês;
    - **palavra rara, gíria ou nome de marca**, que vira vários tokens;
    - **erro de digitação** (*keybaord*).
  - Ideia levantada pelo autor (2026-11-24), **não decidida**: o aluno "punir ou recompensar" o modelo quando ele erra. Fazer o *backward pass* num modelo pronto é possível e se chama **ajuste fino** (*fine-tuning*). Para embeddings, o jeito comum é o **aprendizado contrastivo**: dizer "estas duas frases deviam ficar perto, estas longe". É assim que o MiniLM foi treinado. "Punir e recompensar" de verdade é outra técnica, o **aprendizado por reforço** (*reinforcement learning*), e nos LLMs aparece como **RLHF**. Fora do escopo agora: pelo que se sabe, o Transformers.js só **usa** o modelo (inferência) e não treina. Se o autor quiser, vira ADR adiada, perto do módulo 6 (Aprendizado contínuo).
  - **Escolha do autor (2026-11-24): aprendizado contrastivo primeiro**, aprendizado por reforço depois. **Adiado**, porque o lab ainda não tem o que isso precisa. O treino do lab (`retropropagar` em `web/lib/treino.ts`) compara **uma saída com um número-objetivo**, e o contrastivo precisa de uma **perda contrastiva**, que olha um **par** de embeddings (ex.: perda = 1 − cosseno para um par que devia ficar perto). Um caminho possível, ainda não avaliado: deixar o MiniLM parado e treinar só uma camada pequena por cima dos 384 números, com o motor de treino do próprio lab.
- **Ideia do autor (2026-11-23): mostrar rápido como os 384 números foram feitos**, mesmo que simulado. Isso liga com a aba Redes neurais, porque é o mesmo *forward pass* (passagem para frente), só que numa rede pronta.
  - Nota da IA, a conferir no código: com o Transformers.js dá para pegar os 384 números de **cada token antes da média** (`pooling: 'none'`). Então o passo **tokens → média → embedding** pode ser **real**. Só o que acontece **dentro** das 6 camadas do modelo teria que ser simulado, e a tela precisa dizer o que é simulado.
- **Opção levantada pela IA e não escolhida:** em vez do mapa PCA, um **mapa centrado na palavra do aluno**, com anéis: a distância de cada categoria até o centro vem da nota exata (1 − nota). Assim o mapa e as barras nunca discordam sobre a palavra do aluno, e os pontos não pulam quando entra categoria nova. Em troca, a distância *entre* duas categorias não quer dizer nada.

### 1. De onde vêm os números do embedding (2026-11-21)

**Decisão do autor:** opção **A**, modelo de verdade no navegador.

- **Modelo:** `all-MiniLM-L6-v2`, versão **quantizada** (*quantization*: pesos guardados com menos casas decimais) de **23 MB**, rodando com Transformers.js. Cada texto, seja uma palavra ou uma frase, vira **384 números**. O modelo quebra o texto em pedaços (**tokens**), a última camada dá 384 números para cada pedaço, e o modelo tira a **média** deles (*mean pooling*). O 384 é escolha de quem criou o modelo, não um padrão. Textos muito longos são cortados (o modelo lê até 256 tokens).
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

**Era a dúvida (decidida abaixo):** de onde o arquivo é baixado, se dos servidores do Hugging Face (padrão do Transformers.js; o texto do aluno não sai do navegador, só o arquivo do modelo vem de fora) ou do próprio site no GitHub Pages.

**Comparação da IA (2026-11-25), para o autor decidir:**

| | Hugging Face (padrão) | Próprio site (GitHub Pages) |
|---|---|---|
| Trabalho | Nenhum: o Transformers.js já baixa de lá | Copiar os arquivos do modelo (~23 MB) para dentro do projeto |
| Rede da escola | Precisa liberar mais um endereço (huggingface.co); se for bloqueado, a aba não funciona | Só o endereço do site, que já precisa funcionar |
| Se o serviço cair | Depende do Hugging Face estar no ar | Depende só do GitHub Pages |
| Versão do modelo | Pode mudar lá se não for fixada | Fica parada no nosso repositório |
| Limites | Nenhum para nós | Arquivo até 100 MB (ok); tráfego sugerido de ~100 GB/mês, ou seja, umas 4 mil cargas de 23 MB (cerca de 140 turmas de 30) |

Recomendação da IA: **próprio site**, pelo mesmo motivo da [ADR-0034](0034-quiz-ao-vivo.md): a rede da escola é o risco que mais pesa, e um endereço só é mais seguro.

**Decidido pelo autor (2026-11-26): próprio site.** Os arquivos do modelo (~23 MB) ficam no repositório e saem do GitHub Pages junto com o site. Se o tráfego passar do limite sugerido, a decisão é revista.

## Perguntas em aberto (decisões do autor)

1. ~~**De onde vêm os números do embedding?**~~ **Decidido: opção A, em inglês (ver acima).** As opções que estavam na mesa:
   - **A · Modelo de verdade no navegador** (`all-MiniLM-L6-v2` com Transformers.js): o aluno escreve qualquer frase. Custa um download de uns 25 MB, e cada frase vira 384 números, que não dá para mostrar um por um.
   - **B · Números já calculados** para coleções prontas: abre na hora, sem download, mas o aluno não escreve frases novas.
   - **C · Embedding de brinquedo**, feito à mão: poucos eixos com nome (ex.: "é comida?", "é animal?", "é bom?") e o aluno dá a nota de cada frase. Dá para ver todas as contas, mas não é como funciona de verdade.
   - Ou uma mistura (ex.: C para aprender a conta, A para ver o real).
2. ~~**O que o Rodar mostra passo a passo?**~~ **Decidido (2026-11-25):** o Rodar mostra (a) os **tokens**, (b) **como os 384 números são feitos** e, **o principal**, (c) o modelo **posicionando** cada palavra e categoria no mapa.
   - O que é real e o que é simulado (a conferir no código): tokens **reais** (o tokenizador do modelo); 384 números por token e a média **reais** (`pooling: 'none'`, depois a média); o que acontece **dentro** das 6 camadas é **simulado** e a tela diz isso; o PCA é **real** (conta feita no navegador).
   - Riscos levantados pela IA: (1) o PCA calcula **todas as posições juntas**, porque cada posição depende de todos os pontos. Se a animação colocar uma palavra de cada vez, pode parecer que cada uma é posicionada sozinha. (2) A posição no mapa é **aproximada**; quem diz de verdade o que está perto é o **cosseno** dos 384 números (as barras). Se o Rodar só mostrar o posicionamento, o aluno pode achar que o mapa é a medida.
   - **Decidido (2026-11-25): o Rodar termina no posicionamento.** As barras (o cosseno dos 384 números, a medida de verdade) aparecem quando o aluno **clica**, como já decidido. Por enquanto, a função do Rodar é essa: pegar as categorias e as palavras e mostrar qual está mais relacionada com qual.

### O nome da aba (2026-11-25)

O autor percebeu que o nome **"Busca por significado" talvez não combine** com o que a aba faz agora. Está certo, e o motivo é técnico:

| Nome técnico | O que é | A aba faz isso hoje? |
|---|---|---|
| **Busca semântica** (*semantic search*) | Uma **pergunta** procura numa **coleção** de textos e volta com os mais parecidos, em ordem (k-NN de busca) | **Não.** Não há pergunta nem coleção. |
| **Classificação zero-shot** | Cada item vai para a **categoria mais perto**, sem treino (k-NN classificador com k = 1) | **Sim**, é o centro da aba. |
| **Similaridade semântica** | Medir **quanto** dois textos se parecem no sentido (o cosseno) | **Sim**, são as barras. |
| **Espaço de embeddings** (espaço vetorial) | O "lugar" onde cada texto vira um ponto; parecido = perto | **Sim**, é o mapa. |

Pontos a considerar (levantados pela IA):
- **A conta é a mesma; muda a pergunta.** A busca pergunta *"quais textos combinam com o que eu procuro?"*. A classificação pergunta *"em qual categoria esta palavra entra?"*. Os dois usam embedding + cosseno.
- **Meia busca já existe na aba:** clicar numa categoria mostra uma barra por palavra. Se as barras vierem em ordem, isso é uma busca pequena, com a categoria fazendo o papel de pergunta e as palavras o de coleção. Por isso o nome atual combina **pela metade**.
- A **busca** volta mais tarde: o currículo põe a busca semântica no módulo 3 (aula 3.3), e o RAG (módulo 4) depende dela. Se a aba ganhar frases e uma pergunta, o nome antigo volta a servir.
- O nome aparece em **5 arquivos do site** (`web/app/page.tsx`, `web/app/novo-projeto/page.tsx`, `web/app/projetos/page.tsx`, `web/app/tutoriais/page.tsx`, `web/components/laboratorio/Lab.tsx`) e em **cerca de 14 documentos**. Trocar o nome é fácil no código, mas precisa ser feito em todos.

**Decidido (2026-11-25): mantém "Busca por significado"**, porque a aba vai crescer (frases, pergunta, busca de verdade). Essa expansão fica para **depois que o frontend da versão com palavras estiver pronto e funcionando**, numa **branch e ADR próprias**. Até lá, segue o que já foi decidido nesta ADR.
3. ~~**Mapa, lista ou os dois?**~~ **Decidido (2026-11-23): os dois.** Mapa PCA com tudo misturado, mais barras com a nota exata ao clicar numa palavra ou numa categoria (ver "Decidido" acima).
4. ~~**Quais blocos o aluno liga sozinho?**~~ **Decidido (2026-11-25): sem blocos e sem fios.** A aba tem só **caixas de texto** (palavras e categorias), o **mapa** e as **barras**. Os blocos do rascunho (Frases, Embedding, Pergunta, Comparar, Resultado) saem.
5. ~~**A Aqua entra como?**~~ **Decidido (2026-11-25): a Aqua representa o modelo de embeddings** (o all-MiniLM-L6-v2). Ela é quem **faz** o embedding; o embedding é o que **sai** dela. É ela que transforma cada palavra nos 384 números, e por isso é dela que depende o que fica perto. (Detalhe: a Aqua faz os números; quem mede a distância é o cosseno, que é uma conta fixa, igual para qualquer modelo.)
   - **Decidido (2026-11-25): um modelo só; 2 modelos ficam para depois.**
   - O que o autor quis dizer: 2 modelos **iguais** dariam resultados diferentes, e daria para fazer a **média dos 2 mapas**. Resposta da IA:
     - O **mesmo modelo** (mesmos pesos) com a mesma palavra dá **os mesmos números** toda vez, porque o forward pass é só conta e não sorteia nada. Só modelos **treinados separadamente** (ex.: com outra semente, como no Treinar do lab) dariam números diferentes.
     - A ideia de juntar modelos existe e se chama **ensemble** (comitê). O que se junta são as **notas** (média dos cossenos) ou os votos, não os mapas: os eixos de cada mapa PCA não combinam entre si, então a média de dois mapas não teria sentido.
   - **Pergunta anterior do autor: e se tiver 2 modelos?** Fatos levantados pela IA:
     - Cada modelo cria o **seu próprio espaço**. Mesmo com o mesmo tamanho, o número 1 de um modelo não quer dizer o mesmo que o número 1 do outro. Então **não dá para pôr as palavras dos dois modelos no mesmo mapa** nem comparar um embedding do modelo A com um do modelo B: cada modelo precisa do seu mapa.
     - As **notas também mudam de escala**. Modelos da família e5 costumam dar notas altas para quase tudo (algo como 0,7 a 0,9), e o MiniLM espalha mais. O que dá para comparar entre modelos é a **ordem** (qual categoria ficou em 1º), não o valor.
     - Custo: o segundo modelo pensado antes, o multilíngue, tem 118 MB. Ele resolveria o caso *teclado* em português.
     - Pela regra do autor de não pedir ao lab o que ele ainda não tem, se for mais de um modelo isso provavelmente vira **ADR adiada** depois que a aba funcionar com um.
6. ~~**Cor do tema.**~~ **Decidido (2026-11-25): as mesmas cores do lab das cores**: aqua claro `#5ED3DB` com fundo branco e `#E8FAFB` ([04-design-system](../04-design-system.md)). O ciano `#14B8C4` sai. Referência de estilo do autor: simples, claro e arredondado, *"igual ao dos Mii da Nintendo"*. Só a sensação geral serve de inspiração; nenhum elemento, personagem ou visual da Nintendo é copiado.

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
