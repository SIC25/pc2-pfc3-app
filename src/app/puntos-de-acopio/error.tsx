"use client";

import { Marco, boton } from "@/components/pc2-marco";

export default function ErrorDirectorio({ reset }: { reset: () => void }) {
  return (
    <Marco titulo="Directorio de puntos de acopio">
      <p className="mb-4" role="alert">No se pudo cargar el directorio. Inténtalo de nuevo.</p>
      <button type="button" onClick={reset} className={boton}>Reintentar</button>
    </Marco>
  );
}

