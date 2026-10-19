# 07 · Guia de Conteúdo

> ⚠️ **Em revisão.** Este documento é uma proposta da IA anterior ao [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md). Hoje os tutoriais ficam em páginas separadas e levam ao laboratório; o formato deles ainda não foi decidido. A seção de voz e tom do design system continua valendo.

> Como escrever uma aula. Leia junto com [02-curriculo.md](02-curriculo.md) e [04-design-system.md](04-design-system.md#6-voz-e-tom).

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
