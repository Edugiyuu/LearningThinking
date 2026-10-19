# ADR-0014 · Laboratório: abas por tema, projetos e erros visíveis

- **Status:** Aceita
- **Data:** 2026-10-18
- **Decisores:** autor do projeto
- **Complementa:** [ADR-0013](0013-formato-tutoriais-e-laboratorio.md)

## Contexto

O [ADR-0013](0013-formato-tutoriais-e-laboratorio.md) definiu o laboratório como uma área de trabalho estilo Tinkercad, mas deixou em aberto quais ferramentas entram primeiro e como o aluno monta as coisas.

## Decisão

### Projetos da primeira versão
1. **Rede neural do zero:** treinar uma rede pequena e ver como ela aprende.
2. **Esquecimento:** treinar numa tarefa, depois em outra, e ver a primeira ser "esquecida" (aprendizado contínuo).
3. **Busca por significado:** textos virando embeddings e buscas por semelhança.

Motivo: são a base para entender a IA por dentro.

### Abas por tema
- Cada tema do laboratório tem a **própria aba**, com o próprio conjunto de blocos (como o Tinkercad, que separa 3D, Circuits e Codeblocks).
- Regra: **projetos que usam os mesmos blocos ficam na mesma aba.**
- Na v1, isso dá **duas abas**:
  - **Redes neurais:** inclui Rede neural do zero e Esquecimento (Esquecimento usa os mesmos blocos, mais alguns próprios).
  - **Busca por significado.**
- Dentro de uma aba, o aluno **liga os blocos livremente**.

### Criar novo projeto
Duas opções:
1. **Vazio:** área de trabalho em branco.
2. **Básico pronto:** uma montagem bem simples que já funciona.

### Ligações que não fazem sentido
- Geram um **erro**.
- O erro **mostra onde está o problema** na montagem (o bloco/fio fica destacado), não só uma mensagem.
- O erro aparece **quando o aluno clica em rodar** (como no Tinkercad), não no momento de ligar o fio. *(decidido em 2026-10-18)*

## Em aberto

- O que exatamente vem na montagem básica de cada aba.
- Onde os projetos ficam salvos e se um projeto pertence a uma única aba.
- Como o tutorial "mostra" o laboratório.
- Ferramentas que dependem de um LLM grande (RAG, deep thinking) ficam fora da v1.

## Consequências

- A lista de laboratórios L1 a L5 em [05-laboratorio.md](../05-laboratorio.md) (proposta da IA) foi substituída por esta decisão.
- Reconhecer imagens (ex.: cachorro) ficou fora da v1.
