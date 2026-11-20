import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Marco, boton } from "@/components/pc2-marco";
import { salir } from "@/features/acceso/actions";
import { esRol, roles } from "@/features/acceso/modelo";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { esAdminAcopio } from "@/features/acopio/gestion-acceso";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

function Acceso({ href, titulo, detalle, icono }: {
  href: string; titulo: string; detalle: string; icono: string;
}) {
  return (
    <li>
      <Link href={href} className="pc2-task">
        <span className="pc2-task-icon" aria-hidden="true">{icono}</span>
        <div><h2>{titulo}</h2><p>{detalle}</p></div>
        <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}

export default async function CuentaPorRol({ params }: { params: Promise<{ rol: string }> }) {
  const { rol } = await params;
  if (!esRol(rol)) notFound();
  const perfil = await obtenerPerfil();
  if (!perfil || perfil.rol !== rol) redirect("/mi-cuenta?estado=acceso-denegado");

  const administrador = await esAdminAcopio(await createClient());
  return (
    <Marco titulo={`Hola, ${perfil.nombre}`} descripcion={`Perfil ${roles[rol].nombre}. ${roles[rol].mensaje}`}>
      <ul className="pc2-card-grid">
        {rol === "recolector" ? (
          <>
            <Acceso href="/mi-cuenta/ofertas" titulo="Ofertas disponibles" detalle="Busca materiales por distrito y acepta un recojo." icono="⌕" />
            <Acceso href="/mi-cuenta/mis-recojos" titulo="Mis recojos" detalle="Revisa tus asignaciones y registra la entrega." icono="↻" />
          </>
        ) : (
          <>
            <Acceso href="/mi-cuenta/publicar-material" titulo="Publicar materiales" detalle="Agrupa uno o más materiales para un mismo recojo." icono="+" />
            <Acceso href="/mi-cuenta/mis-publicaciones" titulo="Mis publicaciones" detalle="Consulta el estado o edita ofertas disponibles." icono="≡" />
          </>
        )}
        {administrador && (
          <>
            <Acceso href="/mi-cuenta/gestion-acopio" titulo="Gestionar puntos de acopio" detalle="Registra puntos y actualiza sus datos y disponibilidad." icono="⌘" />
            <Acceso href="/mi-cuenta/reportes" titulo="Reportes de reciclaje" detalle="Consulta recojos completados y cantidades recuperadas." icono="▥" />
          </>
        )}
        <Acceso href="/puntos-de-acopio" titulo="Puntos de acopio" detalle="Busca lugares para entregar tus reciclables." icono="⌖" />
      </ul>
      <form action={salir} className="pc2-form-actions mt-5"><button className={`${boton} pc2-button-secondary`}>Cerrar sesión</button></form>
    </Marco>
  );
}

