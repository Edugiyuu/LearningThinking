import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quiz ao vivo · LearningThinking" };

/** Tudo do quiz fica um pouco menor no computador (ver `.quiz-menor` no globals.css). */
export default function Layout({ children }: LayoutProps<"/quiz">) {
  return <div className="quiz-menor">{children}</div>;
}
