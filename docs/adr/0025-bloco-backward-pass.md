# ADR-0025 · Bloco Backward pass: a culpa voltando passo a passo

- **Status:** Aceita (decisões de produto do autor; detalhes propostos pela IA e confirmados)
- **Data:** 2026-10-22
- **Decisores:** Eduardo (autor), com propostas da IA
- **Tira do papel:** [ADR-0016](0016-modo-debug-backward-pass.md) (modo "debug" do backward pass)
- **Usa:** [ADR-0024](0024-treinar-com-backpropagation.md) (a conta do backward já existe em `web/lib/treino.ts`)

## Contexto

O Rodar mostra só a ida (forward pass): a entrada atravessa a rede, uma conta de cada vez. O Treinar faz forward e backward milhares de vezes, mas rápido demais para ver a culpa voltando. O autor quis fazer o backward "à mão", passo a passo, como o Rodar faz a ida.

Na conversa ficou claro que:
- forward e backward não são tipos de rede. A mesma rede faz só o forward quando responde e faz forward + backward quando aprende;
- o forward sempre acontece, e o backward precisa dele antes, porque só dá para voltar a culpa depois de saber o erro;
- para um leigo, os números da culpa (0,016…) não dizem nada. O que ele entende é a **consequência**: a linha ajudou e vai ficar mais forte, atrapalhou e vai ficar mais fraca, ou não fez nada e fica igual.

## Decisões do autor

1. **Um bloco "Backward pass", ligado na Saída.** Com ele, o Rodar faz a ida e depois volta a culpa passo a passo. Sem ele, o Rodar faz só o forward, como hoje. Não existe bloco "Forward": o forward sempre acontece.
2. **Nomes em inglês** (*forward pass*, *backward pass*), para o aluno reconhecer quando encontrar o assunto fora do site.
3. **Dentro do bloco: Mostrar ou Salvar.** Com Mostrar, o aluno vê a culpa e quanto cada peso andaria, e os pesos não mudam. Com Salvar, no fim cada peso anda um passinho de verdade (um treino de uma repetição, com um exemplo só).
4. **A culpa aparece na linha responsável**, uma linha por vez, e não num pop-up.
5. **O visual conta a ideia, não o texto:**
   - **termômetro** de 0 a 1 na Saída: a resposta, o objetivo e o erro entre os dois;
   - **bolinha de culpa** (aqua) andando de trás para frente pelas linhas. O tamanho mostra quanta culpa ela leva, e ela some no neurônio que passou 0;
   - **sinais sem cor** em cada linha: **+** ajudou, fica mais forte · **−** atrapalhou, fica mais fraca · **=** não fez nada, fica igual. Verde e vermelho continuam querendo dizer só o sinal do peso (o autor viu, no Figma, que a seta vermelha numa linha vermelha parecia "a culpada");
   - **lupa** no peso da vez ("−1,50 → −1,51 · + mais forte"), porque a mudança de um passinho é pequena demais para ver na espessura da linha.

## Detalhes propostos pela IA (confirmados pelo autor)

- O termômetro é **horizontal, dentro do bloco Saída**.
- A lupa fica no espaço vazio do canvas, ligada ao peso da vez por uma linha tracejada.
- Os botões **Anterior / Próximo** e **Passo a passo / Automático** ficam **fixos no topo do painel Contas**. Isso também resolve um problema do Rodar de hoje: no passo final aparece a mensagem do resultado e o botão Próximo muda de lugar.
- O Salvar usa o passinho **médio** (0,5), o mesmo do Treinar.
- A legenda do canvas ganha a bolinha de culpa e os sinais + − =.
- **Ordem da volta**, a mesma da conta (`retropropagar` em `web/lib/treino.ts`): erro na Saída → culpa depois da sigmoide → linhas até a Saída → neurônios do meio → linhas das entradas → fim. O painel mostra "Forward ✓ · ◀ Backward n de N".
- **"Mais forte" e "mais fraca"** se referem ao tamanho do peso, sem o sinal: −1,50 → −1,51 é mais forte (puxa mais para baixo); −1,00 → −0,998 é mais fraca.

## Telas

No Figma:
- "Laboratório · Backward pass · visual (4 ideias)": o roteiro do visual;
- "Laboratório · Backward pass · 1 a culpa voltando (Mostrar)";
- "Laboratório · Backward pass · 2 fim (Salvar)".

Exemplo usado nas telas: montagem básica, cor azul #378ADD com objetivo azul (0). A rede responde 0,12, a linha do neurônio de baixo até a Saída leva culpa 0,016 (−1,50 → −1,51), o neurônio de cima passou 0 e fica igual, e o erro cai de 0,12 para 0,11.

## Consequências

**Positivas**
- O aluno vê o backward com as mesmas ideias do tutorial 05 (erro, culpa que volta, passinho), em vez de só confiar no Treinar.
- A conta já existe e já é testada (`retropropagar`). Falta só a tela.
- Os botões fixos no topo melhoram o Rodar mesmo sem o bloco.

**Negativas / custos**
- Mais um bloco e mais um tipo de passo no Rodar (os passos da volta).
- Com a rede quase certa, a culpa é pequena e a mudança quase não aparece. A lupa e o termômetro existem para isso, mas o efeito continua pequeno de verdade.

## Em aberto

- **Aba de configuração** (ideia do autor, para uma ADR futura): ligar e desligar números dos pesos, as mensagens do passo final etc. Anotado em [05-laboratorio.md](../05-laboratorio.md).
- Como a bolinha de culpa se divide quando um neurônio tem várias linhas chegando (nas telas, ela se divide em bolinhas menores, uma por linha).
