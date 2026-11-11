import type { NextConfig } from "next";

// Site estático no GitHub Pages (ADR-0033): `next build` gera a pasta `out/` com HTML, CSS e JS.
// No Pages o site mora em /LearningThinking; o workflow passa esse caminho em BASE_PATH.
// No `npm run dev` fica vazio e o site abre em /.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true, // /laboratorio/ vira laboratorio/index.html, que o Pages serve sem configuração
  env: { NEXT_PUBLIC_BASE_PATH: basePath }, // para os arquivos de public/ que o <Image> não prefixa sozinho
  images: { unoptimized: true }, // sem servidor, não há otimização de imagem
  // Sem cacheComponents/partialPrefetching: eles precisam de servidor (PPR) e não funcionam em export.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
