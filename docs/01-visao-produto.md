# 01 · Visão do Produto

> ⚠️ **Em revisão.** Este documento é uma proposta da IA anterior ao [ADR-0013](adr/0013-formato-tutoriais-e-laboratorio.md). Hoje o produto é um **laboratório estilo Tinkercad** (produto principal) mais **tutoriais em páginas separadas**. As partes sobre "aulas em scrollytelling", "Abrir no Laboratório" e o núcleo compartilhado entre aula e laboratório não valem mais e serão reescritas.

> **Nome provisório:** LearningThinking
> **Status:** rascunho v0.1 · 2026-10-18

## 1. O problema

A IA virou assunto do dia a dia, mas quase ninguém entende **como ela funciona por dentro**. O material que existe costuma cair em um de dois extremos:

| Extremo | Exemplo | Problema |
|---|---|---|
| Raso demais | "A IA aprende como um cérebro" | Cria metáforas erradas e expectativas mágicas |
| Técnico demais | Papers, cursos com cálculo e PyTorch | Exclui quem não programa ou não sabe matemática |

Faltam explicações **visuais, interativas e corretas**, que levem qualquer pessoa do "não faço ideia" até "consigo explicar o fluxo para outra pessoa".

## 2. A proposta

Um site com duas experiências complementares:

1. **Aulas** — explicações em formato *scrollytelling*: o texto avança e uma visualização ao lado reage a cada passo. Cada aula conta **um fluxo** (ex.: "o que acontece quando você pergunta algo a um sistema RAG").
2. **Sandbox (Laboratório)** — o mesmo modelo visual da aula, mas com os controles liberados. O aluno mexe nos parâmetros, quebra as coisas e vê o que acontece.

O elo entre os dois é o botão **"Abrir no Laboratório"**: em qualquer ponto da aula, o aluno leva o estado exato da visualização para o sandbox e continua experimentando.

> **Princípio central:** *ver → entender → mexer → explicar.*

## 3. Público

| Persona | Quem é | O que precisa |
|---|---|---|
| **Aluno curioso** | Estudante de ensino médio/graduação, sem programar | Entender o conceito sem fórmulas logo de cara |
| **Profissional não técnico** | Gestor, designer, advogado, professor | Saber o suficiente para tomar decisões e não ser enganado |
| **Dev iniciante em IA** | Programa, mas nunca treinou um modelo | Intuição antes da matemática; ponte para a prática |
| **Professor (o autor)** | Dá aulas sobre IA | Material para projetar em sala e mandar como "lição de casa" |

## 4. Objetivos

- **O1 — Compreensão:** depois de uma aula, o aluno consegue descrever o fluxo com as próprias palavras (verificado por um "checkpoint" no fim de cada aula).
- **O2 — Experimentação:** todo conceito importante tem pelo menos um experimento no sandbox.
- **O3 — Acesso zero-atrito:** abrir o link e usar. Sem cadastro, sem instalar nada, sem chave de API.
- **O4 — Uso em sala:** funciona bem projetado (modo apresentação, fontes grandes, alto contraste).
- **O5 — Experiência premium:** visual e movimento no nível de produtos como Apple e ElevenLabs — clareza, espaço em branco, tipografia forte, animações com propósito.

## 5. Não-objetivos (por enquanto)

- Não é um curso de programação nem de matemática formal (a matemática aparece como camada opcional "ver por dentro").
- Não é uma plataforma de cursos com certificados, pagamentos ou fórum.
- Não treina modelos grandes de verdade — usamos modelos pequenos/didáticos e *replays* de modelos grandes.
- Não exige conta no MVP (ver [ADR-0009](adr/0009-sem-backend-no-mvp.md)).

## 6. Métricas de sucesso

| Métrica | Como medir | Meta inicial |
|---|---|---|
| Conclusão de aula | % de quem começa e chega ao checkpoint | > 60% |
| Uso do laboratório | % de sessões que abrem o sandbox a partir de uma aula | > 30% |
| Acerto no checkpoint | % de respostas corretas | > 70% |
| Performance | LCP em notebook comum / celular médio | < 2,0 s / < 3,0 s |
| Acessibilidade | Lighthouse a11y + teste manual com teclado | ≥ 95, sem bloqueios |

Analytics deve ser **anônimo e sem cookies** (ver [03-arquitetura.md](03-arquitetura.md#observabilidade)).

## 7. Princípios de produto

1. **Correção antes de simplificação.** Simplificar é obrigatório; mentir não. Toda metáfora tem um aviso de "onde ela quebra".
2. **Uma ideia por tela.** Cada passo da aula muda uma coisa só na visualização.
3. **Movimento explica.** Animação só existe se mostrar causa → efeito (dado fluindo, peso mudando, vetor se aproximando).
4. **O aluno no controle.** Tudo pode ser pausado, voltado, acelerado e mexido.
5. **Funciona sem internet boa.** Modelos leves, *replays* pré-gravados, nada que dependa de um servidor caro para a experiência básica.
