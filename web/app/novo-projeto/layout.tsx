import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo projeto · LearningThinking" };

export default function Layout({ children }: LayoutProps<"/novo-projeto">) {
  return children;
}
