# Teste técnico · laboratório de redes neurais

Teste técnico do [ADR-0018](../../docs/adr/0018-primeira-entrega-design.md). Ele prova que o React Flow aguenta o editor do laboratório: blocos, fios, pesos e as contas passo a passo. O visual segue o [04-design-system.md](../../docs/04-design-system.md) (tema claro, destaque aqua `#5ED3DB`). Não é o projeto real, mas as regras de `lib/rede.ts` são uma boa base para ele.

## Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` (ou a porta que o terminal mostrar).

## O que testar

1. A **montagem básica** já vem pronta: Entrada (cor laranja) → Camada 1 (2 neurônios) → Camada 2 (1) → Saída.
2. Clicar em **Rodar** (painel da direita). A linha da vez fica destacada em aqua e o painel mostra **uma multiplicação de cada vez**, depois a soma e o que o neurônio faz com ela. Avance com **Próximo** ou ligue o **Automático**. No fim, a Saída mostra `0,97 → laranja (1)`.
3. Trocar a cor no bloco **Entrada** (ex.: um azul) e rodar de novo. Mexer em qualquer coisa cancela a rodada.
4. No bloco Entrada, trocar **Cor** por **Números**: dá para dar nome e valor a cada número, adicionar (até 6) e remover.
5. Arrastar blocos da barra lateral: **Entrada**, **Camada**, **Neurônio** (solte dentro de uma Camada; fora aparece um aviso) e **Saída**.
6. Digitar a quantidade de neurônios no campo da Camada.
7. Puxar um **fio** da bolinha aqua à direita de um bloco até o próximo. Todos os neurônios das duas pontas se ligam. Um fio novo substitui o antigo na mesma porta, e fios que fecham um círculo não ligam.
8. **Duplo clique** no número de uma linha para mudar o peso (Enter salva, Esc cancela).
9. Soltar uma Camada sem fio e clicar em Rodar: ela fica com **borda tracejada âmbar** e um aviso aparece no painel, mas a conta roda mesmo assim. Erros de verdade (ex.: Entrada sem fio) deixam o bloco com **borda vermelha** e não deixam rodar.
10. Clicar na **Saída** para mudar o objetivo (nome e cor das respostas 0 e 1).
11. Selecionar e apertar Delete para apagar (blocos e fios).

## Onde está o código

- `lib/rede.ts`: as regras, sem nada de tela. Blocos, fios, pesos, a **rodada** (confere a montagem e lista as contas em ordem) e a **vista** (o que aparece em cada passo).
- `components/EntradaNode.tsx`, `CamadaNode.tsx`, `NeuronioNode.tsx` e `SaidaNode.tsx`: os blocos.
- `components/PesoEdge.tsx`: a linha com o número do peso, o destaque da linha da vez e a edição por duplo clique.
- `components/PainelContas.tsx`: Rodar, erros e as contas passo a passo.
- `components/Lab.tsx`: canvas, barra lateral, arrastar/soltar, rodada e modo automático.
- `app/globals.css`: estilos com as cores do design system.

## Ainda não tem

Treinar, salvar o projeto, abas por tema e a tela Novo projeto.
