import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meus projetos · LearningThinking" };

export default function Layout({ children }: LayoutProps<"/projetos">) {
  return children;
}
