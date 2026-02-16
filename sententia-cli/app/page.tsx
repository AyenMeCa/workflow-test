"use client";

/**
 * Archivo: app/page.tsx
 * Proposito: pagina principal de la interfaz de Sententia.
 * Orquesta el layout general, el estado de la consulta y la comunicacion con el endpoint de chat.
 */

import { useState } from "react";

import { MOCK_CONVERSATIONS } from "@/app/features/home/constants/mockConversations";
import { AnswerCard } from "@/app/features/home/components/AnswerCard";
import { ChatInput } from "@/app/features/home/components/ChatInput";
import { Header } from "@/app/features/home/components/Header";
import { Sidebar } from "@/app/features/home/components/Sidebar";
import { WelcomeSection } from "@/app/features/home/components/WelcomeSection";
import type { ChatResponse } from "@/app/features/home/types/chat";

export default function Home() {
  // Estado local de la pregunta escrita por el usuario.
  const [question, setQuestion] = useState("");
  // Bandera para bloquear acciones y mostrar estados de carga durante la peticion.
  const [loading, setLoading] = useState(false);
  // Mensaje de error para problemas de red, backend o parseo.
  const [error, setError] = useState<string | null>(null);
  // Respuesta estructurada del backend para renderizar la tarjeta de resultado.
  const [response, setResponse] = useState<ChatResponse | null>(null);

  // Construye el endpoint con base en variable de entorno, removiendo "/" final si existe.
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/assistant/chat`;

  // Ejecuta la consulta contra el backend y actualiza estados de UI.
  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    // No limpiamos `response` aqui: la respuesta anterior permanece visible
    // durante el loading para evitar parpadeo hacia WelcomeSection.

    try {
      // Envia la pregunta junto con parametros de recuperacion/contexto.
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          top_k: 5,
          strict: true,
        }),
      });

      // Se lee como texto primero para tener mejor control de errores y parseo.
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Convierte la respuesta JSON al contrato tipado del frontend.
      const data = JSON.parse(text) as ChatResponse;
      setResponse(data);
      // Limpia el campo de pregunta solo tras recibir respuesta exitosa.
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor de pagina completa con gradiente base.
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#F8FAFC] p-2 font-[family-name:var(--font-geist-sans)] sm:p-3">
      <div className="flex h-full w-full gap-3">
        {/* Sidebar lateral de historial (solo visible en desktop por clases internas). */}
        <Sidebar conversations={MOCK_CONVERSATIONS} />

        {/* Area principal con header, zona de contenido y caja de entrada de chat. */}
        <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] rounded-[24px] border border-[#E2E8F0] bg-white/85 px-3 py-3 shadow-[0_22px_60px_-45px_rgba(15,33,57,0.45)] sm:px-5 sm:py-4">
          {/* Marca compacta para mobile cuando no esta visible el sidebar completo. */}
          <div className="mb-2 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#152139] lg:hidden">
            Sententia
          </div>

          <Header />

          <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3 py-2 sm:py-3">
            <section className="min-h-0 overflow-hidden">
              {/* Estado inicial: se muestra bienvenida antes de consultar. */}
              {!response && !error && (
                <div className="flex h-full items-center justify-center overflow-hidden px-3 py-3 sm:px-6 sm:py-4">
                  <WelcomeSection />
                </div>
              )}

              {/* Estado de error sin respuesta previa. */}
              {error && !response && (
                <div className="flex h-full items-center justify-center px-1">
                  <p className="w-full rounded-2xl border border-[#7F1D1D]/20 bg-[#7F1D1D]/10 px-4 py-3 text-sm text-[#7F1D1D]">
                    {error}
                  </p>
                </div>
              )}

              {/* Estado exitoso: renderiza la respuesta con fuentes y detalles. */}
              {response && (
                <div className="h-full overflow-y-auto pr-1">
                  <AnswerCard response={response} />
                </div>
              )}
            </section>

            <section className="mx-auto w-full max-w-2xl space-y-3">
              {/* Entrada de pregunta y subida de documentos. */}
              <ChatInput
                question={question}
                loading={loading}
                onQuestionChange={setQuestion}
                onSubmit={handleRequest}
              />

              {/* Error mostrado debajo del input cuando hay respuesta previa en pantalla. */}
              {error && response && (
                <p className="rounded-2xl border border-[#7F1D1D]/20 bg-[#7F1D1D]/10 px-4 py-3 text-sm text-[#7F1D1D]">
                  {error}
                </p>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
