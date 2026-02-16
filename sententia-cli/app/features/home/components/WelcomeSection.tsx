/**
 * Archivo: app/features/home/components/WelcomeSection.tsx
 * Proposito: estado inicial del home cuando aun no hay consulta.
 * Presenta mensaje de bienvenida y acciones rapidas visuales.
 */

import Image from "next/image";

// Tarjetas informativas iniciales para guiar al usuario.
const QUICK_ACTIONS = [
  { title: "Consulta guiada", description: "Pregunta y recibe evidencias." },
  { title: "Consulta guiada", description: "Pregunta y recibe evidencias." },
  { title: "Consulta guiada", description: "Pregunta y recibe evidencias." },
];

export function WelcomeSection() {
  return (
    // Bloque central de onboarding rapido.
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-2 text-center">
      <Image
        src="/chat_bienvenida_bot.png"
        alt="Sententia Bot"
        width={180}
        height={180}
        className="-mb-5 object-contain"
        priority
      />
      <h1 className="text-sm font-semibold tracking-tight text-[#152139] sm:text-base">
        Bienvenido a Sententia
      </h1>
      <p className="mt-1 max-w-md text-[10px] leading-4 text-[#64748B] sm:text-[11px]">
        Tu asistente juridico con IA para consultar leyes y sentencias en segundos, siempre con
        fuentes verificables.
      </p>

      {/* Grid flexible de acciones/casos sugeridos. */}
      <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {QUICK_ACTIONS.map((action, index) => (
          <article
            key={`${action.title}-${index}`}
            className="flex w-[130px] flex-col items-center rounded-xl border border-[#E2E8F0] bg-white p-2 text-center shadow-[0_8px_24px_-20px_rgba(15,33,57,0.35)] transition hover:bg-[#F8FAFC] sm:w-[148px] sm:p-2.5"
          >
            <div className="mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#334155]">
              <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5">
                <circle cx="9" cy="9" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12.2 12.2L15.2 15.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-[9px] font-semibold text-[#152139] sm:text-[10px]">{action.title}</h3>
            <p className="mt-0.5 text-[8px] leading-3 text-[#64748B] sm:text-[9px]">
              {action.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
