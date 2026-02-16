import { useId, useState, type ChangeEvent, type KeyboardEvent } from "react";

import type {
  AssistantFileUploadResponse,
  UploadErrorResponse,
} from "@/app/features/home/types/upload";

/**
 * Archivo: app/features/home/components/ChatInput.tsx
 * Proposito: renderizar la caja de entrada del chat y gestionar:
 * - envio de preguntas al flujo principal (via onSubmit),
 * - subida de documentos PDF al backend,
 * - feedback visual de validaciones/errores mediante modal.
 */

// Props controladas por el contenedor (page.tsx).
type ChatInputProps = {
  question: string;
  loading: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
};

// Estructura interna para mostrar mensajes de estado al usuario.
type UploadFeedback = {
  kind: "success" | "error";
  title: string;
  message: string;
};

// Limite local alineado con la validacion del backend (10MB).
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function ChatInput({ question, loading, onQuestionChange, onSubmit }: ChatInputProps) {
  // Solo se puede enviar si hay texto y no hay solicitud activa.
  const canSubmit = question.trim().length > 0 && !loading;
  // ID unico para vincular label e input file oculto.
  const uploadInputId = useId();
  // Estado de subida de documento.
  const [uploading, setUploading] = useState(false);
  // Estado del modal de feedback (exito o error).
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);
  // URL base del backend configurada por entorno.
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const uploadEndpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/assistant/files/upload`;

  // Permite Enter para enviar y Shift+Enter para salto de linea.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  const closeFeedback = () => {
    setFeedback(null);
  };

  // Normaliza distintas formas de error para mostrar un mensaje consistente.
  const resolveUploadErrorMessage = (payload: unknown): string => {
    if (typeof payload === "string" && payload.trim().length > 0) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      const maybePayload = payload as UploadErrorResponse;
      if (typeof maybePayload.detail === "string" && maybePayload.detail.trim().length > 0) {
        return maybePayload.detail;
      }
      if (typeof maybePayload.message === "string" && maybePayload.message.trim().length > 0) {
        return maybePayload.message;
      }
    }
    return "No se pudo subir el documento.";
  };

  // Flujo completo de carga: valida PDF, envia al backend y muestra resultado.
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const [file] = Array.from(input.files ?? []);

    if (!file) {
      return;
    }

    // Doble validacion de PDF por extension y MIME type.
    const isPdfByName = file.name.toLowerCase().endsWith(".pdf");
    const isPdfByType = file.type.length === 0 || file.type === "application/pdf";

    if (!isPdfByName || !isPdfByType) {
      setFeedback({
        kind: "error",
        title: "Formato invalido",
        message: "Solo se permiten archivos PDF.",
      });
      input.value = "";
      return;
    }

    // Validacion de archivo vacio.
    if (file.size === 0) {
      setFeedback({
        kind: "error",
        title: "Archivo invalido",
        message: "El archivo esta vacio.",
      });
      input.value = "";
      return;
    }

    // Validacion de limite de tamano.
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      setFeedback({
        kind: "error",
        title: "Archivo demasiado grande",
        message: "El archivo supera el limite de 10MB.",
      });
      input.value = "";
      return;
    }

    try {
      setUploading(true);

      // Construye payload multipart esperado por el endpoint.
      const formData = new FormData();
      formData.append("file", file);

      // Header util para trazar la solicitud en logs backend.
      const requestId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `upload-${Date.now()}`;

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          "X-Request-Id": requestId,
        },
        body: formData,
      });

      // Parseo robusto: JSON si viene como application/json, sino texto plano.
      const contentType = response.headers.get("content-type") ?? "";
      const payload: unknown = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      // Manejo de errores HTTP con detalle devuelto por backend.
      if (!response.ok) {
        setFeedback({
          kind: "error",
          title: "Error al subir documento",
          message: resolveUploadErrorMessage(payload),
        });
        return;
      }

      // Manejo de exito usando mensaje del backend como prioridad.
      const successPayload = payload as AssistantFileUploadResponse;
      const message =
        typeof successPayload.message === "string" && successPayload.message.trim().length > 0
          ? successPayload.message
          : `El documento ${successPayload.name ?? file.name} se subio correctamente.`;

      setFeedback({
        kind: "success",
        title: "Documento subido",
        message,
      });
    } catch {
      setFeedback({
        kind: "error",
        title: "Error de conexion",
        message: "No se pudo conectar con el servidor para subir el documento.",
      });
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <>
      {/* Bloque principal del input de chat. */}
      <section className="w-full rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC]/90 p-2 sm:rounded-[24px] sm:p-2">
        <div className="relative rounded-[22px] border border-[#E2E8F0] bg-white px-3 py-2 sm:px-4 sm:py-2">
          {/* Input file oculto: se dispara desde el label/icono de clip. */}
          <input
            id={uploadInputId}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
          {/* Icono para adjuntar PDF. En estado uploading cambia a spinner. */}
          <label
            htmlFor={uploadInputId}
            className={`absolute left-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[#64748B] transition sm:left-3 sm:h-8 sm:w-8 ${
              uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-[#1E2E4D]"
            }`}
            aria-label="Adjuntar documentos PDF"
            title={uploading ? "Subiendo documento..." : "Adjuntar documentos PDF"}
          >
            {uploading ? (
              <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-30"
                />
                <path
                  d="M20 12a8 8 0 00-8-8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M7.3 8.2L11.9 3.6C13.1 2.4 15 2.4 16.2 3.6C17.4 4.8 17.4 6.7 16.2 7.9L9.6 14.5C8.8 15.3 7.5 15.3 6.7 14.5C5.9 13.7 5.9 12.4 6.7 11.6L12.4 5.9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </label>

          {/* Textarea controlado para la consulta del usuario. */}
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Pregunta lo que quieras"
            className="h-7 w-full resize-none bg-transparent py-0 pl-11 pr-12 text-sm leading-7 text-[#334155] outline-none placeholder:text-[#64748B] sm:h-8 sm:pl-12 sm:text-base sm:leading-8"
          />

          {/* Boton para enviar pregunta al endpoint de chat. */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#152139] text-white transition hover:bg-[#1E2E4D] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] sm:right-3 sm:h-8 sm:w-8"
            aria-label="Enviar consulta"
          >
            {loading ? (
              <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-30"
                />
                <path
                  d="M20 12a8 8 0 00-8-8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M10 3.5V14.2M10 3.5L5.9 7.6M10 3.5L14.1 7.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Texto auxiliar de contexto debajo del input. */}
        <div className="mt-1.5 text-[11px] text-[#64748B] sm:mt-2 sm:text-xs">
          <p className="leading-4">Colabora con Sententia usando leyes, sentencias y tus documentos PDF</p>
        </div>
      </section>

      {/* Modal pequeno para feedback de carga de documentos. */}
      {feedback && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/30 p-4 pt-20"
          onClick={closeFeedback}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-feedback-title"
            className="w-full max-w-xs rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,33,57,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="upload-feedback-title"
                  className={`text-sm font-semibold ${
                    feedback.kind === "success" ? "text-[#0F766E]" : "text-[#7F1D1D]"
                  }`}
                >
                  {feedback.title}
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">{feedback.message}</p>
              </div>

              {/* Cierre manual del modal de feedback. */}
              <button
                type="button"
                onClick={closeFeedback}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#334155]"
                aria-label="Cerrar notificacion"
              >
                <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
