import type { Metadata } from "next";

export const metadata: Metadata = { title: "Laboratório · LearningThinking" };

export default function Layout({ children }: LayoutProps<"/laboratorio">) {
  return children;
}
