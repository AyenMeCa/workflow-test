/**
 * Archivo: app/layout.tsx
 * Proposito: layout raiz de Next.js (App Router).
 * Define metadatos globales, carga fuentes y envuelve todas las paginas.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Fuente sans principal usada en la interfaz.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fuente mono disponible para bloques tecnicos o codigo.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos base de la aplicacion: relevantes para SEO y accesibilidad.
export const metadata: Metadata = {
  title: "Sententia — Asistente jurídico",
  description: "Consulta leyes, sentencias y documentos jurídicos con soporte documental verificable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Estructura HTML principal compartida por toda la app.
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Slot donde Next.js renderiza cada pagina/ruta. */}
        {children}
      </body>
    </html>
  );
}
