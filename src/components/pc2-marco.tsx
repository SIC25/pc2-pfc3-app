import Link from "next/link";
import type { ReactNode } from "react";

export const campo = "w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900";
export const boton = "rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900";
export const enlace = "font-semibold text-emerald-800 underline underline-offset-4";

export function Marco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav aria-label="Navegación principal" className="mx-auto flex max-w-5xl flex-wrap gap-4 px-5 py-4">
          <Link href="/" className="font-bold text-emerald-900">Reciclaje PC2</Link>
          <Link href="/puntos-de-acopio" className={enlace}>Puntos de acopio</Link>
          <Link href="/mi-cuenta" className={enlace}>Mi cuenta</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="mb-6 text-3xl font-bold text-slate-950">{titulo}</h1>
        {children}
      </main>
    </div>
  );
}

