/**
 * Archivo: app/features/home/types/upload.ts
 * Proposito: contratos TypeScript para la subida de documentos.
 * Centraliza los tipos que usa el componente ChatInput al hablar con backend.
 */

// Respuesta esperada cuando el backend sube un archivo correctamente.
export type AssistantFileUploadResponse = {
  // Identificador del archivo en el proveedor/assistant.
  file_id: string;
  // Nombre final del archivo guardado.
  name: string;
  // Tamano del archivo en bytes.
  size: number;
  // Estado normalizado del archivo (por ejemplo: Available / Processing).
  status: string;
  // Mensaje legible para mostrar en UI.
  message: string;
};

// Forma generica de error devuelta por backend.
export type UploadErrorResponse = {
  // Mensaje de error estandar de FastAPI.
  detail?: string;
  // Variante alternativa de mensaje usada por algunos servicios.
  message?: string;
};
