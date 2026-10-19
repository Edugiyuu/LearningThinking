# ADR-0006 · LLM em modo replay por padrão, ao vivo opcional via proxy

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

Os módulos de LLM, RAG e deep thinking ficam muito melhores com um LLM de verdade. Mas:
- Chamadas de API custam dinheiro e o site é público e gratuito.
- Pedir que o aluno traga a própria chave quebra o "zero atrito" e é um risco de segurança para iniciantes.
- Aulas precisam ser **determinísticas** — a mesma explicação tem que mostrar o mesmo resultado.
- Modelos locais no navegador (ex.: WebLLM) exigem downloads de centenas de MB a GB e GPU razoável.

## Opções consideradas

1. Só API ao vivo (servidor paga).
2. Aluno informa a própria chave de API.
3. LLM local no navegador (WebLLM).
4. **Replays gravados por padrão + ao vivo opcional via proxy controlado.**

## Decisão

**Opção 4.**

### Modo Replay (padrão)
- Respostas reais de modelos grandes gravadas offline por um script (`scripts/record-replay.ts`) e salvas como JSON em `public/replays/` (formato em [05-laboratorio.md](../05-laboratorio.md#formato-de-replay-de-llm)).
- Incluem traços de raciocínio (*extended thinking*) quando relevantes, uso de tokens e tempos — reproduzidos com streaming simulado.
- Cobrem os presets dos laboratórios e todas as aulas.
- A interface mostra um selo **"Resposta gravada · modelo X · data"** — sem fingir que é ao vivo.

### Modo Ao Vivo (opcional)
- `POST /api/llm` em route handler; a chave fica **só** no servidor.
- Provedor inicial: **Claude API** (modelo rápido como `claude-haiku-5-5` para RAG; `claude-sonnet-5-5` com extended thinking para o laboratório de raciocínio). Camada `LlmProvider` permite trocar de provedor.
- Habilitado por **código de turma** que o professor gera (variável de ambiente no MVP), com:
  - rate limit por IP e por código;
  - teto de tokens por requisição e por dia;
  - lista fixa de modelos e *system prompt* definido no servidor;
  - aviso claro de que o texto é enviado a um serviço externo.

### Futuro
- Avaliar WebLLM como "modo local" opcional para máquinas com GPU.

## Consequências

**Positivas**
- Experiência completa sem custo e sem chave para 100% dos alunos.
- Aulas reprodutíveis e testáveis.
- Professor tem a experiência "ao vivo" em sala com custo controlado.

**Negativas**
- Replays não respondem a perguntas arbitrárias. Mitigação: muitas perguntas curadas por preset; texto livre → convite ao modo ao vivo.
- Replays envelhecem quando os modelos mudam. Mitigação: data e modelo no selo; script de regravação.

**Riscos**
- Abuso do endpoint ao vivo → rate limit, teto de gasto e possibilidade de desligar por variável de ambiente.

## Quando revisitar

Quando modelos locais pequenos e bons rodarem com download < 300 MB na maioria dos navegadores.
