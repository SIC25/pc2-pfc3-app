import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Marco, boton, enlace } from "@/components/pc2-marco";
import { salir } from "@/features/acceso/actions";
import { esRol, roles } from "@/features/acceso/modelo";
import { obtenerPerfil } from "@/features/acceso/perfil";

export const instant = false;

export default async function CuentaPorRol({ params }: { params: Promise<{ rol: string }> }) {
  const { rol } = await params;
  if (!esRol(rol)) notFound();
  const perfil = await obtenerPerfil();
  if (!perfil || perfil.rol !== rol) redirect("/mi-cuenta?estado=acceso-denegado");

  return (
    <Marco titulo={`Mi cuenta · ${roles[rol].nombre}`}>
      <p className="mb-2">Hola, {perfil.nombre}.</p>
      <p className="mb-4">{roles[rol].mensaje}</p>
      <Link href="/puntos-de-acopio" className={enlace}>Ver puntos de acopio</Link>
      <form action={salir} className="mt-5"><button className={boton}>Cerrar sesión</button></form>
    </Marco>
  );
}