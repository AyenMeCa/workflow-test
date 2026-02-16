/**
 * Archivo: app/features/home/types/chat.ts
 * Proposito: definir el contrato de datos del chat en frontend.
 * Estos tipos tipan la respuesta de backend y el render en AnswerCard.
 */

// Fuente documental individual citada por el backend.
export type ChatSource = {
  // Nombre del documento fuente.
  file: string;
  // Lista de paginas referenciadas dentro del documento.
  pages: number[];
  // Fragmento de texto destacado (si existe).
  excerpt?: string;
};

// Respuesta completa del endpoint de chat.
export type ChatResponse = {
  // Texto de respuesta generado por el asistente.
  answer: string;
  // Fuentes citadas para respaldar la respuesta.
  sources: ChatSource[];
  // Confianza opcional calculada por backend.
  confidence?: "low" | "medium" | "high";
  // Metricas de uso de tokens (si el backend las envia).
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};
