// Ajuda da nuvem de partículas da Home (ADR-0038). Os pontos das formas vêm prontos de
// public/nuvem/home.json (scripts/gerar-nuvem-home.py), iguais aos quadros do Figma.

/** Sorteio com semente: a mesma ordem e o mesmo desvio em toda visita. */
export function sorteio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
