"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PedidoAoModelo, RespostaDoModelo, ResultadoTexto } from "@/lib/significado-modelo";

export type EstadoModelo =
  | { estado: "baixando"; carregado: number; total: number }
  | { estado: "pronto" }
  | { estado: "erro"; carregado: number; total: number; mensagem: string };

/**
 * Liga a aba ao Web Worker do modelo (ADR-0037). Só começa a baixar quando a aba abre
 * (carregamento sob demanda). Na segunda visita o navegador já tem o arquivo guardado (cache).
 */
export function useModelo() {
  const [estado, setEstado] = useState<EstadoModelo>({ estado: "baixando", carregado: 0, total: 0 });
  const worker = useRef<Worker | null>(null);
  const pendentes = useRef(new Map<number, (itens: ResultadoTexto[]) => void>());
  const proximoId = useRef(1);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const w = new Worker(new URL("./modelo.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    let ultimo = { carregado: 0, total: 0 };
    w.onmessage = (e: MessageEvent<RespostaDoModelo>) => {
      const r = e.data;
      if (r.tipo === "progresso") {
        ultimo = { carregado: r.carregado, total: r.total };
        setEstado({ estado: "baixando", ...ultimo });
      } else if (r.tipo === "pronto") setEstado({ estado: "pronto" });
      else if (r.tipo === "erro") {
        console.error("Modelo da Busca por significado:", r.mensagem);
        setEstado({ estado: "erro", ...ultimo, mensagem: r.mensagem });
      }
      else if (r.tipo === "resultado") {
        pendentes.current.get(r.id)?.(r.itens);
        pendentes.current.delete(r.id);
      }
    };
    const pedido: PedidoAoModelo = {
      tipo: "carregar",
      origem: window.location.origin,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
    };
    w.postMessage(pedido);
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, [tentativa]);

  const calcular = useCallback(
    (textos: string[]) =>
      new Promise<ResultadoTexto[]>((resolver) => {
        const id = proximoId.current++;
        pendentes.current.set(id, resolver);
        const pedido: PedidoAoModelo = { tipo: "calcular", id, textos };
        worker.current?.postMessage(pedido);
      }),
    [],
  );

  const tentarDeNovo = useCallback(() => {
    setEstado({ estado: "baixando", carregado: 0, total: 0 });
    setTentativa((t) => t + 1);
  }, []);

  return { modelo: estado, calcular, tentarDeNovo };
}
