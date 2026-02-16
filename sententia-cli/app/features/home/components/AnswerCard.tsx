import type { ChatResponse } from "../types/chat";

/**
 * Archivo: app/features/home/components/AnswerCard.tsx
 * Proposito: mostrar la respuesta del asistente y sus fuentes documentales.
 * Incluye un detalle expandable con el JSON crudo para depuracion.
 */

// Props tipadas con la estructura del endpoint de chat.
type AnswerCardProps = {
  response: ChatResponse;
};

export function AnswerCard({ response }: AnswerCardProps) {
  return (
    // Tarjeta principal de respuesta.
    <section className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-[0_10px_36px_-24px_rgba(15,33,57,0.45)] sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight text-[#152139]">Respuesta</h2>

      {/* Cuerpo de la respuesta generada. */}
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#334155] sm:text-base">
        {response.answer || "Sin respuesta."}
      </p>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">Fuentes</h3>

        {/* Lista de fuentes si existen; fallback cuando no hay evidencia. */}
        {response.sources.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {response.sources.map((source, index) => (
              // Cada item representa una fuente documental con metadata relevante.
              <li key={`${source.file}-${index}`} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#152139]">Documento: {source.file}</p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Paginas: {source.pages.length > 0 ? source.pages.join(", ") : "N/A"}
                </p>
                <p className="mt-2 text-sm text-[#334155]">
                  Fragmento destacado: {source.excerpt?.trim() ? source.excerpt : "No disponible."}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#64748B]">No se reportaron fuentes para esta respuesta.</p>
        )}
      </div>

      {/* Bloque tecnico para inspeccionar la respuesta completa en formato JSON. */}
      <details className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <summary className="cursor-pointer text-sm font-medium text-[#334155]">
          Ver JSON completo de respuesta
        </summary>
        <pre className="mt-3 overflow-auto text-xs leading-5 text-[#334155]">
          {JSON.stringify(response, null, 2)}
        </pre>
      </details>
    </section>
  );
}
