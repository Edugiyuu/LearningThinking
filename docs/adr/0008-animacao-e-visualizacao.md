# ADR-0008 · Animação com Motion; visualização em SVG/Canvas/WebGL conforme volume

- **Status:** Proposta (escrita pela IA, aguardando revisão do autor)
- **Data:** 2026-10-18

## Contexto

O coração do produto são visualizações animadas que explicam fluxos. Elas vão de poucos elementos (um neurônio) a milhares (heatmap de fronteira de decisão, nuvem de embeddings) e algumas cenas 3D (superfície de perda). Precisamos de 60 fps em notebook comum e uma linguagem de movimento consistente.

## Opções consideradas

- **Animação de UI:** Motion (ex-Framer Motion) · GSAP · CSS puro.
- **Desenho:** SVG + escalas do D3 · Canvas 2D · WebGL (three.js / react-three-fiber) · uma biblioteca de gráficos pronta (Recharts, ECharts).
- **Scrollytelling:** IntersectionObserver próprio · Scrollama · GSAP ScrollTrigger.

## Decisão

| Necessidade | Escolha | Por quê |
|---|---|---|
| Transições de UI e de elementos da visualização | **Motion** | Integração natural com React, springs, `layout` animations, respeita reduced-motion |
| Visualizações com até ~1 000 elementos | **SVG** desenhado em React + **d3-scale/d3-shape** (só utilitários, sem manipular DOM) | Nítido, acessível, estilizável com tokens |
| Visualizações densas (heatmaps, nuvens grandes) | **Canvas 2D** (OffscreenCanvas quando possível) | Performance |
| Cenas 3D pontuais | **react-three-fiber** carregado sob demanda | Só onde 3D explica melhor (superfície de perda) |
| Gráficos simples (curva de perda, acurácia) | Componentes próprios em SVG | Controle total do visual; evita o "look de dashboard" |
| Scrollytelling | **IntersectionObserver** próprio dentro de `<Scrolly>` | Leve, previsível, sem dependência pesada |
| Fórmulas | **KaTeX** | Rápido, renderiza no build |

Regras:
- A visualização é **função do estado** da simulação; animação interpola entre estados, nunca muda o estado.
- Todo movimento usa os tokens de [04-design-system.md §3](../04-design-system.md#3-movimento).

## Consequências

**Positivas**
- Um único modelo mental: estado → desenho → transição.
- Escolhe a tecnologia de desenho pelo volume, sem lock-in.

**Negativas**
- Mais código de visualização próprio do que usar uma biblioteca de gráficos. Aceito: o visual é o produto.

## Quando revisitar

Se mais de três visualizações precisarem de WebGL, padronizar uma camada de cena 3D compartilhada.
