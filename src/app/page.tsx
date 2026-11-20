import Link from "next/link";
import { Marco, boton, enlace } from "@/components/pc2-marco";

export default function Home() {
  return (
    <Marco titulo="Encuentra dónde entregar tus reciclables">
      <p className="mb-6 max-w-xl">
        Busca puntos de acopio por distrito y material. Consulta su dirección,
        horario y materiales aceptados antes de visitarlos.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/puntos-de-acopio" className={boton}>Buscar puntos de acopio</Link>
        <Link href="/registro" className={enlace}>Crear cuenta</Link>
        <Link href="/ingresar" className={enlace}>Iniciar sesión</Link>
      </div>
    </Marco>
  );
}

