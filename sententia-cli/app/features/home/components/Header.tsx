"use client";

/**
 * Archivo: app/features/home/components/Header.tsx
 * Proposito: cabecera de la vista principal del home.
 * Muestra estado de version y un menu compacto de acciones de administrador.
 */

import { useState } from "react";

export function Header() {
  // Controla la apertura/cierre del menu administrativo.
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  return (
    // Barra superior del panel principal.
    <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
      <p className="inline-flex items-center gap-1 text-xs font-medium text-[#334155] sm:text-sm">
        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M3.2 9.7L16.5 3.8C16.9 3.6 17.3 4 17.1 4.5L11.2 17.8C11 18.2 10.4 18.2 10.2 17.8L8 12L3.2 9.7Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12L17 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        v1.260212
      </p>

      <div className="relative flex items-center justify-end gap-2">
        {/* Contenedor animado del menu con acciones del usuario admin. */}
        <div
          className={`overflow-hidden rounded-full border border-[#E2E8F0] bg-white transition-all duration-300 ${
            isAdminMenuOpen
              ? "pointer-events-auto max-w-[300px] px-2 py-1.5 opacity-100"
              : "pointer-events-none max-w-0 px-0 py-1.5 opacity-0"
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              type="button"
              className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-[#E2E8F0]"
            >
              Planes
            </button>
            <button
              type="button"
              className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-[#E2E8F0]"
            >
              Ajustes
            </button>
            <button
              type="button"
              className="rounded-full bg-[#7F1D1D]/10 px-3 py-1.5 text-xs font-medium text-[#7F1D1D] transition hover:bg-[#7F1D1D]/15"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Boton que alterna visibilidad del menu de admin. */}
        <button
          type="button"
          onClick={() => setIsAdminMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-[#F8FAFC] sm:px-3 sm:text-sm"
          aria-expanded={isAdminMenuOpen}
          aria-label="Abrir opciones de administrador"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B]">
            <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-3 w-3">
              <circle cx="10" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M5.8 14.4C6.5 12.9 7.9 12 10 12C12.1 12 13.5 12.9 14.2 14.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Admin
        </button>
      </div>
    </header>
  );
}
