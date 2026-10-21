# 07 · Guia de Conteúdo

> ⚠️ **Em revisão.** Este documento é uma proposta da IA anterior ao [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md). Hoje os tutoriais ficam em páginas separadas e levam ao laboratório; o formato proposto (passo a passo, conteúdo em `web/lib/tutoriais.ts`) está no [ADR-0022](adr/0022-tutoriais-com-a-aqua.md). A seção de voz e tom do design system continua valendo.

> Como escrever uma aula. Leia junto com [02-curriculo.md](02-curriculo.md) e [04-design-system.md](04-design-system.md#6-voz-e-tom).

## Regras do autor para os tutoriais (2026-10-20)

Valem acima de tudo o que está abaixo (detalhes no [ADR-0022](adr/0022-tutoriais-com-a-aqua.md)):

1. **O objetivo é aprender IA.** O cérebro humano entra só como inspiração, curto e simples. Nada de aula de biologia (sem mV, tipos de sinal, neurotransmissores por nome etc.).
2. **Só ensinar o que existe no laboratório.** Se o tutorial fala de algo, o aluno tem que conseguir ver ou mexer naquilo no sandbox. Conceitos que o laboratório ainda não tem (ex.: viés, função degrau) ficam de fora até ele ter.
3. **Nomes técnicos de verdade**, sempre depois da intuição: entradas (vetor x), peso (w), soma ponderada (z), função de ativação, ReLU, sigmoide. Nada de apelidos inventados no lugar do nome (o "espremer" foi trocado por sigmoide).
4. **Analogia e técnica juntas, em todo passo técnico.** O público é leigo: quem nunca viu IA por dentro lê a conta e precisa de algo do cotidiano do lado. A fórmula não sai; ela ganha um quadro **"No dia a dia"** com a Aqua ou com a rotina (escola, previsão do tempo, pedir opinião). Foi para isso que a Aqua foi criada.
5. **Pode ter um pouco de história** quando ajuda a entender de onde veio a ideia (McCulloch-Pitts, perceptron, retropropagação).
6. **Primeiro no Figma, depois no código.**

## Exemplo do dia a dia: a Aqua aprendendo cores (o mesmo do laboratório)

Usado no tutorial 01 · O neurônio, do passo 2 ao teste ([ADR-0023](adr/0023-sigmoide-em-passos-e-tutorial-01-com-o-lab.md)). Antes era a Aqua cozinhando panqueca, mas o exemplo forçava a barra ("a música" como entrada) e não aparecia no laboratório. Agora o tutorial usa **a tarefa do próprio lab**: separar laranja de azul, com os números do **detector de laranja** da montagem básica (`web/lib/rede.ts`). Frame no Figma: "Tutorial 01 · O neurônio · roteiro".

**A história.** A Aqua quer separar laranja de azul. Toda cor é uma mistura de **vermelho, verde e azul** (o R, o G e o B do bloco Entrada).

| Momento | O que acontece | Ligações |
|---|---|---|
| 1ª tentativa | Ela dá a mesma atenção aos três e erra ("azul?"). | As três com a mesma força (linhas cinza iguais) |
| Depois de muitas cores | Ela acerta ("laranja!"). | Vermelho **forte a favor** (verde, grossa); azul **forte contra** (vermelha, grossa); verde **fraco** (aparece nos dois) |

**Os números (passos 5 a 9)**, os mesmos que o painel de contas mostra no lab:

| Passo | Conta | "No dia a dia" |
|---|---|---|
| 5 · Entradas | laranja `#FF8C00` → x = (1,00; 0,55; 0,00) | toda cor da tela é uma mistura de vermelho, verde e azul |
| 6 · Pesos | w = (2,00; 0,50; −2,00) → 2,00; 0,28; 0,00 | muito vermelho = sinal de laranja; verde vale pouco; muito azul = sinal contra |
| 7 · Soma ponderada | 2,00 + 0,28 + 0,00 = **2,28** (a IA chama de z) | a média da escola, sem dividir |
| 8 · Ativação | **só a ReLU**: laranja 2,28 acende; azul −1,03 passa 0 | a Aqua decide: soma negativa, nem acende |
| 9 · Revisão | os 4 passos com esses números; "é o 1º neurônio da Camada 1 da montagem básica" | o guarda-chuva: olha, confia mais em umas coisas, junta e decide |

A **sigmoide** não entra no tutorial 01: o passo 8 tem só um quadro "E o último neurônio?" que leva ao tutorial 03. A fórmula a = f(Σ wᵢ·xᵢ) fica num bloco **"Para quem quiser"**, fechado, no passo 9. Saíram Σ e "pré-ativação" do passo 7.

**Teste rápido: duas perguntas fáceis, de cabeça.** Uma cor nova, **roxo** (0,50; 0,00; 1,00), no mesmo detector:
1. Quanto dá a soma? 0,50 × 2,00 + 0,00 × 0,50 + 1,00 × −2,00 = **−1,00**.
2. O detector acende? **Não, passa 0** (ReLU). Roxo não é laranja.

**Desenhos:** duas cenas pequenas, só onde ajudam e **sem ícone de emoção na cabeça**: a Aqua separando cartões laranja e azul em dois cestos (passo 2) e a Aqua ligada a uma lâmpada acesa (passo 8). Ver [04-design-system.md, seção 7.1](04-design-system.md).

**Onde a analogia quebra:** a Aqua "percebe" o que importa; a rede não percebe nada, só ajusta números para errar menos.

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
