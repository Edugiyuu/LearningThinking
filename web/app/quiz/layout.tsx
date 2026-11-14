import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quiz ao vivo · LearningThinking" };

export default function Layout({ children }: LayoutProps<"/quiz">) {
  return children;
}
