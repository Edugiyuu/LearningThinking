# 07 · Guia de Conteúdo

> ⚠️ **Em revisão.** Este documento é uma proposta da IA anterior ao [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md). Hoje os tutoriais ficam em páginas separadas e levam ao laboratório; o formato proposto (passo a passo, conteúdo em `web/lib/tutoriais.ts`) está no [ADR-0022](adr/0022-tutoriais-com-a-aqua.md). A seção de voz e tom do design system continua valendo.

> Como escrever uma aula. Leia junto com [02-curriculo.md](02-curriculo.md) e [04-design-system.md](04-design-system.md#6-voz-e-tom).

## Regras do autor para os tutoriais (2026-10-20)

Valem acima de tudo o que está abaixo (detalhes no [ADR-0022](adr/0022-tutoriais-com-a-aqua.md)):

1. **O objetivo é aprender IA.** O cérebro humano entra só como inspiração, curto e simples. Nada de aula de biologia (sem mV, tipos de sinal, neurotransmissores por nome etc.).
2. **Só ensinar o que existe no laboratório.** Se o tutorial fala de algo, o aluno tem que conseguir ver ou mexer naquilo no sandbox. Conceitos que o laboratório ainda não tem (ex.: viés, função degrau) ficam de fora até ele ter.
3. **Nomes técnicos de verdade**, sempre depois da intuição: entradas (vetor x), peso (w), soma ponderada (z), função de ativação, ReLU, sigmoide. Nada de apelidos inventados no lugar do nome (o "espremer" foi trocado por sigmoide).
4. **Analogia e técnica juntas, em todo passo técnico.** O público é leigo: quem nunca viu IA por dentro lê a fórmula (z = Σ wᵢ·xᵢ) e precisa de algo do cotidiano do lado. A fórmula não sai; ela ganha um quadro **"No dia a dia"** com a Aqua ou com a rotina (escola, previsão do tempo, pedir opinião). Foi para isso que a Aqua foi criada.
5. **Pode ter um pouco de história** quando ajuda a entender de onde veio a ideia (McCulloch-Pitts, perceptron, retropropagação).
6. **Primeiro no Figma, depois no código.**

## Exemplo do dia a dia: a Aqua aprendendo a cozinhar

Usado no tutorial 01 · O neurônio (passo 2) para explicar **ligações fortes e fracas**, e retomado nos passos de entradas e pesos. Frames no Figma: "Tutorial 01 · O neurônio · roteiro" e "Aqua · cozinhando (poses)". O autor considerou outras opções (fruta madura na feira, guarda-chuva, pênalti) e **ficou com a cozinha**.

**Desenhos:** duas cenas em pixel art, com a Aqua segurando a frigideira pelo cabo, no fogão (poses em [04-design-system.md, seção 7.1](04-design-system.md)). O rosto dela não muda; a emoção é um ícone acima da cabeça:
- **1ª tentativa:** Aqua **preocupada** ("!" e gota de suor) e a panqueca **queimada**, soltando fumaça.
- **Depois de treinar:** Aqua **confiante** (estrela, bochechas) e a panqueca **no ponto**, com brilho.

**A história.** A Aqua quer acertar o ponto da panqueca. Para decidir a hora de virar, ela presta atenção em três coisas: a **cor da massa**, o **tempo no fogo** e a **música tocando**.

| Momento | O que acontece | Ligações |
|---|---|---|
| 1ª tentativa | Ela dá a mesma atenção a tudo, até à música. A panqueca queima. | As três com a mesma força (linhas cinza iguais) |
| Depois de treinar | Errando e tentando de novo, ela percebe o que ajuda. A panqueca sai no ponto. | Cor da massa e tempo no fogo **fortes** (verde, grossas); música **fraca** (fina, quase sumindo) |

**O que cada parte vira na IA:**

| Na cozinha | No neurônio artificial | No laboratório |
|---|---|---|
| cor da massa, tempo no fogo, música | **entradas** (features, o vetor x) | bloco Entrada |
| quanto a Aqua liga para cada coisa | **peso** (w) | número na linha |
| a música, que não ajuda | **peso perto de 0** | linha quase invisível |
| juntar tudo e decidir virar ou não | **soma ponderada** + **função de ativação** | painel de contas, neurônio acende |
| treinar várias vezes | **treinamento** (ajustar os pesos) | botão Treinar (em breve) |

**Onde a analogia quebra:** a Aqua "percebe" o que importa; a rede não percebe nada, só ajusta números para errar menos.

### A mesma panqueca, com números (passos 5 a 8)

Os passos técnicos usam a cena da cozinha como os números de verdade da conta. O palco mostra a conta; a coluna de texto tem o quadro **"No dia a dia"** (fundo aqua claro) e, embaixo, **"Na IA"** com o nome técnico e onde fica no laboratório.

| Passo | Conta com os números da Aqua | "No dia a dia" |
|---|---|---|
| 5 · Entradas | x = (cor da massa 0,90; tempo no fogo 0,60; música 0,30) | a Aqua dá uma nota de 0 a 1 para cada coisa; um app de clima faz igual com temperatura, umidade e vento |
| 6 · Pesos | w = (0,80; 0,50; −0,10) → 0,72; 0,30; −0,03 | ela não confia igual em tudo; a música quase não conta, até tira um pouco. Como pedir opinião: o amigo que cozinha bem vale mais |
| 7 · Soma ponderada | z = 0,72 + 0,30 + (−0,03) = 0,99 | a **média da escola**, só que sem dividir no final (só no texto; o palco mostra a barra: massa + tempo = 1,02, a música tira 0,03). "Σ = some tudo" |
| 8 · Ativação | ReLU, negativo vira 0: −0,50 → 0; 0,99 → 0,99. Sigmoide, sempre entre 0 e 1: 0 → 0,5; 0,99 → 0,73 | a sigmoide vira uma certeza, como a **previsão do tempo** ("73% de chance de chuva"): 73% de certeza de que está no ponto |

No laboratório as entradas são o R, o G e o B de uma cor, não a panqueca; o texto "Na IA" diz isso em cada passo. **Fecho (passos 9 e 10).** A **revisão** junta os quatro momentos numa lista visual, com a Aqua fazendo cada um (reações observando, pesando, somando e decidindo), o número da panqueca de cada etapa e, no fim, "panqueca no ponto!" com a = f(Σ wᵢ·xᵢ). O **teste rápido** é uma panqueca nova, sem música, com os pesos que a Aqua aprendeu (x = (0,50; 0,40), w = (0,80; 0,50)): o palco mostra as caixas multiplica → soma → ativação com lacunas em z e sigmoide(z), e cada opção preenche as duas: **z = 0,60 · certeza 0,65** ✓ · z = 0,60 · certeza 0,60 · z = 0,90 · certeza 0,71. A resposta é sempre um número de 0 a 1, nada de "acende/apaga". Onde a ReLU e a sigmoide entram numa rede (meio × último neurônio) fica para a aula de camadas. Regra: **todo tutorial termina com revisão visual + teste visual**, sem perder os nomes técnicos.

**Como reaproveitar.** A mesma cozinha pode voltar em outros tutoriais: o erro (panqueca queimada × no ponto) para a **perda**, e "ajustar um pouco a cada tentativa" para o **Treinar** (tutorial 05 · Como a rede aprende).

## Checklist antes de escrever

- [ ] Qual é o **único fluxo** que esta aula explica?
- [ ] Qual frase o aluno deve conseguir dizer no final? (vira o `objectives` do frontmatter)
- [ ] Qual simulação mostra isso? Ela já existe ou precisa de novas ações?
- [ ] Qual metáfora vou usar — e **onde ela quebra**?

## Esqueleto de aula

```mdx
---
title: "Por que a rede precisa de mais de uma camada"
module: 1
order: 2
duration: 10
sim: neural-playground
objectives:
  - "Explicar por que uma única camada só traça linhas retas"
glossary: [camada, fronteira-de-decisao, ativacao]
---

<Hook>
  Tente separar os pontos azuis dos laranja com uma única régua. Consegue?
</Hook>

<Scrolly sim="neural-playground" seed={42} preset="xor">
  <Step action={{ type: "set-layers", layers: [] }}>
    Com **zero camadas escondidas**, a rede só sabe traçar uma linha reta.
  </Step>
  <Step action={{ type: "train", epochs: 200 }}>
    Treinando… ela tenta, mas sempre deixa pontos do lado errado.
  </Step>
  <Step action={{ type: "set-layers", layers: [4] }}>
    Agora adicionamos **uma camada com 4 neurônios**.
  </Step>
  <Step action={{ type: "train", epochs: 200 }}>
    Cada neurônio traça sua própria linha — e a camada seguinte combina essas linhas.
  </Step>
</Scrolly>

<Callout kind="metafora-quebra">
  Dissemos "cada neurônio traça uma linha". Isso é verdade na primeira camada;
  nas seguintes, eles combinam formas, não linhas.
</Callout>

<OpenInLab label="Teste com a espiral" preset="espiral" />

<Checkpoint>
  <Question answer="b" explain="Sem camadas escondidas, a fronteira é sempre uma reta.">
    Por que a rede sem camadas escondidas não resolve o XOR?
    <Option id="a">Porque aprende devagar</Option>
    <Option id="b">Porque só consegue separar com uma linha reta</Option>
    <Option id="c">Porque tem poucos dados</Option>
  </Question>
</Checkpoint>

<DeepDive title="A matemática">
  $$ y = \sigma(W_2 \, \mathrm{ReLU}(W_1 x + b_1) + b_2) $$
</DeepDive>
```

## Regras de escrita

1. **Um passo, uma mudança.** Se o passo precisa de dois parágrafos, são dois passos.
2. **Intuição → nome → (opcional) fórmula.** Nunca o contrário.
3. **Números reais.** Se o texto diz "a perda caiu", a visualização mostra o número caindo.
4. **Frases de até ~25 palavras** no scrollytelling.
5. **Toda aula tem um "onde quebra".** Inclusive as de RAG e deep thinking (ex.: "pensar mais não cria informação que o modelo não tem").
6. **Exemplos brasileiros e cotidianos** (escola, feira, futebol, receita) em vez de exemplos de empresa americana.

## Revisão antes de publicar

- [ ] Leitura em voz alta (soa como uma explicação em sala?)
- [ ] Percorrer a aula com `prefers-reduced-motion` ligado
- [ ] Percorrer só com teclado
- [ ] Conferir correção técnica com uma segunda pessoa
- [ ] Checkpoint testado com alguém que não leu a aula antes (deve errar) e depois (deve acertar)
