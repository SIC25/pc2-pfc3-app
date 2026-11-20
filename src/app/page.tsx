import Link from "next/link";
import { Marco } from "@/components/pc2-marco";

export default function Home() {
  return (
    <Marco variant="portada">
      <section className="pc2-hero">
        <div className="pc2-hero-copy">
          <h1>Encuentra dónde entregar <em>tus reciclables.</em></h1>
          <p>Consulta puntos de acopio cerca de ti o publica materiales para que un recolector coordine el recojo.</p>
          <div className="pc2-actions">
            <Link href="/puntos-de-acopio" className="pc2-button">Buscar puntos de acopio <span aria-hidden="true">→</span></Link>
            <Link href="/registro" className="pc2-button pc2-button-secondary">Crear cuenta</Link>
            <Link href="/ingresar" className="pc2-link">Iniciar sesión</Link>
          </div>
        </div>
        <div className="pc2-hero-art" aria-hidden="true">
          <span className="pc2-orbit pc2-orbit-one" />
          <span className="pc2-orbit pc2-orbit-two" />
          <span className="pc2-hero-symbol">♻</span>
          <span className="pc2-orbit-dot pc2-orbit-dot-one" />
          <span className="pc2-orbit-dot pc2-orbit-dot-two" />
          <span className="pc2-orbit-dot pc2-orbit-dot-three" />
        </div>
      </section>
      <section className="pc2-home-paths" aria-label="Qué puedes hacer">
        <Link href="/puntos-de-acopio" className="pc2-task">
          <span className="pc2-task-icon pc2-task-icon-teal" aria-hidden="true">⌖</span>
          <div><h2>Entregar reciclables</h2><p>Revisa direcciones, horarios y materiales que recibe cada punto.</p></div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link href="/mi-cuenta" className="pc2-task">
          <span className="pc2-task-icon pc2-task-icon-tan" aria-hidden="true">↻</span>
          <div><h2>Coordinar un recojo</h2><p>Publica materiales como generador o consulta ofertas como recolector.</p></div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </Marco>
  );
}

