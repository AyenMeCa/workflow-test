"use client";

/**
 * Archivo: app/features/home/components/Sidebar.tsx
 * Proposito: barra lateral con el listado de conversaciones del dia.
 * Permite colapsar/expandir la lista y sirve como navegacion contextual.
 */

import Image from "next/image";
import { useState } from "react";

// Props con etiquetas de conversaciones para renderizar la lista.
type SidebarProps = {
  conversations: string[];
};

export function Sidebar({ conversations }: SidebarProps) {
  // Estado local para mostrar u ocultar el bloque de historial.
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    // Sidebar solo visible en desktop por la clase `lg:flex`.
    <aside className="hidden h-full min-h-0 w-72 shrink-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 lg:flex lg:flex-col">
      {/* Logo + wordmark: la "S" del logo se fusiona visualmente con "ententia". */}
      <div className="flex items-end">
        <Image
          src="/sententia_logo_sin_fondo.png"
          alt="S"
          width={68}
          height={68}
          className="shrink-0 object-contain"
        />
        <h2 className="-ml-3 -mb-0.6 text-xl font-semibold tracking-tight text-[#152139] xl:text-2xl">ententia</h2>
      </div>

      {/* Trigger para expandir o colapsar la seccion de historial. */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-6 flex items-center justify-between rounded-lg px-1 text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]"
        aria-expanded={isExpanded}
        aria-controls="chat-history-list"
      >
        <span>Hoy</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 text-[#64748B] transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
        >
          <path
            d="M5.5 7.5L10 12.5L14.5 7.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Historial con animacion suave de expandir/colapsar. */}
      <div
        className={`mt-4 flex-1 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          isExpanded ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <ul id="chat-history-list" className="h-full space-y-2 overflow-hidden pr-1">
          {conversations.map((label, index) => (
            <li key={`${label}-${index}`}>
              <p className="w-full truncate rounded-lg px-3 py-2 text-left text-xs text-[#64748B] transition-colors duration-200 hover:bg-[#F1F5F9] hover:text-[#152139] xl:text-sm">
                {label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
