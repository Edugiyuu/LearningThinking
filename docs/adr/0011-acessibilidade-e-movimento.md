# ADR-0011 · Acessibilidade e *reduced motion* como requisitos

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

Um site educacional, muito visual e animado, corre o risco de excluir justamente quem mais precisa: pessoas com baixa visão, daltonismo, sensibilidade a movimento, ou que usam teclado/leitor de tela. Também será projetado em sala, muitas vezes em projetores ruins.

## Decisão

Acessibilidade é **critério de pronto**, não melhoria futura. Meta: **WCAG 2.2 AA**.

- **Movimento:** respeitar `prefers-reduced-motion` (transições viram crossfade/troca direta) + controle próprio de velocidade e pausa em toda animação.
- **Cor:** contraste AA em texto; nada de significado só por cor (forma, rótulo ou padrão junto); paleta azul × laranja para sinais.
- **Teclado:** todo controle de laboratório operável por teclado; passos da aula navegáveis com setas no modo apresentação; foco sempre visível.
- **Leitores de tela:** cada visualização tem uma descrição textual que **acompanha o estado** (`aria-live` educado em mudanças relevantes, ex.: "perda caiu para 0,12"); tabelas de dados alternativas para gráficos.
- **Zoom:** layout funciona até 200% sem perder conteúdo.
- **Projetor:** modo apresentação com fontes maiores e contraste reforçado.

## Consequências

- Mais trabalho por visualização (descrição textual dinâmica).
- Testes automáticos com axe no Playwright em toda página; revisão manual com teclado e leitor de tela antes de publicar cada aula.
