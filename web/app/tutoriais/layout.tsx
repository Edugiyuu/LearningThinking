import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tutoriais · LearningThinking" };

export default function Layout({ children }: LayoutProps<"/tutoriais">) {
  return children;
}
