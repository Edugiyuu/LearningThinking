# ADR-0020 · Laboratório em código, a partir do teste técnico

- **Status:** Aceita (autor) para fazer o laboratório igual ao Figma aproveitando o teste técnico; detalhes são *proposta da IA*
- **Data:** 2026-10-19
- **Decisores:** autor do projeto

## Contexto

Depois da Home e da tela Novo projeto ([ADR-0019](0019-projeto-real-home.md)), o autor pediu o **Laboratório em código, igual ao frame "Laboratório · Desktop" do Figma, aproveitando o teste técnico** ([`spikes/camada-react-flow/`](../../spikes/camada-react-flow/README.md)).

## Decisão

1. **O teste técnico foi trazido para `web/`** quase sem mudar as regras:
   - `web/lib/rede.ts`: blocos, fios, pesos, rodada e passo a passo (cópia de `spikes/.../lib/rede.ts`).
   - `web/components/laboratorio/`: os blocos (Entrada, Camada, Neurônio, Saída), a linha com o peso, o painel de contas e o CSS (`laboratorio.css`).
2. **Layout igual ao Figma** (*proposta da IA* nos detalhes):
   - **Barra de cima:** logo, nome do projeto e "Salvo", abas Redes neurais / Busca por significado (esta desligada, em breve), botões **Treinar** e **Rodar**. O Rodar saiu do painel e foi para a barra, como no Figma.
   - **Paleta:** blocos com ícone e o "Como montar" (removido depois, [ADR-0021](0021-bolinhas-cores-e-espremer.md)).
   - **Canvas:** botões + e − embaixo à esquerda e a **legenda** (peso positivo, peso negativo, "Duplo clique no número muda o peso") embaixo à direita.
   - **Selo da conta da vez** no canvas, pendurado embaixo do número do peso (ex.: `G: 0,55 × 0,50 = 0,28`). Substituído pela bolinha ([ADR-0021](0021-bolinhas-cores-e-espremer.md)).
   - **Painel de contas** como no teste técnico, mais a seção **Treinar** (repetições, velocidade, do zero/já treinada).
3. **Treinar ainda não funciona.** Os campos aparecem como no Figma, mas o botão "Treinar N vezes" fica desligado com a nota "O treino chega na próxima etapa". O botão Treinar da barra rola até essa seção.
4. **O projeto abre e salva sozinho** (*proposta da IA*):
   - `/laboratorio` abre o projeto criado na tela Novo projeto, com **Básico pronto** ou **Vazio** (Vazio = só uma Entrada e uma Saída).
   - Cada mudança é salva no navegador (`localStorage`, formato com `versao: 1`) cerca de 0,4 s depois; a barra mostra "Salvando…" e depois "Salvo".
   - Ao reabrir, os ids novos continuam depois dos que já existem (`continuarIds`), para não misturar os pesos guardados.
   - Sem projeto aberto, o laboratório abre o Básico pronto como "Experimento", com "Não salvo".

## Consequências

- Conferido no navegador em 1440 × 900: Rodar, passo a passo (Passo 2 de 12 mostra `Camada 1 · neurônio 1` e a conta da Entrada G), salvamento e reabertura (a Camada 1 com 3 neurônios voltou igual depois de recarregar). Sem erros no console.
- Os pesos da montagem básica são os do teste técnico, então o selo mostra `0,55 × 0,50`, não o `0,55 × 0,38` desenhado no Figma.
- O laboratório foi pensado para computador. Em telas estreitas ele aperta (a dica da legenda some abaixo de 1280 px), mas não tem versão para celular.
- O teste técnico continua em `spikes/` como referência; o código vivo agora é o de `web/`.

## Em aberto

- Treinar (fazer as contas de verdade, gravar e reproduzir acelerado, ADR-0017) e a tela de saídas no fim do treino.
- Uma lista de projetos para voltar a outro projeto (hoje abre o último criado).
