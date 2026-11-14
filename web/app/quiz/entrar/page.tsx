"use client";

import dynamic from "next/dynamic";

// Quiz ao vivo (ADR-0034): a tela do aluno. O QR code e o botão da Home caem aqui.
// Só roda no navegador: lê o ?codigo= do endereço e liga o PeerJS.
const QuizAluno = dynamic(() => import("@/components/quiz/QuizAluno"), { ssr: false, loading: () => <div className="min-h-dvh" /> });

export default function Entrar() {
  return <QuizAluno />;
}
