import Link from "next/link";
import type { ReactNode } from "react";

export const campo = "pc2-field";
export const boton = "pc2-button";
export const enlace = "pc2-link";

export function Marco({
  titulo, descripcion, variant = "normal", children,
}: {
  titulo?: string;
  descripcion?: string;
  variant?: "normal" | "compacta" | "portada";
  children: ReactNode;
}) {
  return (
    <div className="pc2-site">
      <a href="#contenido" className="pc2-skip">Ir al contenido</a>
      <header className="pc2-header">
        <div className="pc2-header-inner">
          <Link href="/" className="pc2-brand" aria-label="Reciclaje PC2, inicio">
            <span className="pc2-brand-mark" aria-hidden="true">♻</span>
            <span>Reciclaje <strong>PC2</strong></span>
          </Link>
          <nav aria-label="Navegación principal" className="pc2-nav">
            <Link href="/puntos-de-acopio">Puntos de acopio</Link>
            <Link href="/mi-cuenta" className="pc2-nav-account">Mi cuenta</Link>
          </nav>
        </div>
      </header>
      <main id="contenido" className={`pc2-main pc2-main-${variant}`}>
        {titulo && <div className="pc2-page-heading">
          <h1>{titulo}</h1>
          {descripcion && <p>{descripcion}</p>}
        </div>}
        {children}
      </main>
      <footer className="pc2-footer">
        <span>Reciclaje PC2</span>
        <Link href="/puntos-de-acopio">Directorio de acopio</Link>
      </footer>
    </div>
  );
}

