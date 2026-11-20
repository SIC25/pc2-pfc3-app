import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Marco, boton, enlace } from "@/components/pc2-marco";
import { salir } from "@/features/acceso/actions";
import { esRol, roles } from "@/features/acceso/modelo";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { esAdminAcopio } from "@/features/acopio/gestion-acceso";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function CuentaPorRol({ params }: { params: Promise<{ rol: string }> }) {
  const { rol } = await params;
  if (!esRol(rol)) notFound();
  const perfil = await obtenerPerfil();
  if (!perfil || perfil.rol !== rol) redirect("/mi-cuenta?estado=acceso-denegado");

  const administrador = await esAdminAcopio(await createClient());
  return (
    <Marco titulo={`Mi cuenta · ${roles[rol].nombre}`}>
      <p className="mb-2">Hola, {perfil.nombre}.</p>
      <p className="mb-4">{roles[rol].mensaje}</p>
      <ul className="space-y-2">
        <li><Link href="/puntos-de-acopio" className={enlace}>Ver puntos de acopio</Link></li>
        {rol === "recolector" ? (
          <li><Link href="/mi-cuenta/ofertas" className={enlace}>Ver ofertas disponibles</Link></li>
        ) : (
          <li><Link href="/mi-cuenta/publicar-material" className={enlace}>Publicar material</Link></li>
        )}
        {administrador && (
          <li><Link href="/mi-cuenta/gestion-acopio" className={enlace}>Gestionar puntos de acopio</Link></li>
        )}
      </ul>
      <form action={salir} className="mt-5"><button className={boton}>Cerrar sesión</button></form>
    </Marco>
  );
}

