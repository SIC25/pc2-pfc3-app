import { redirect } from "next/navigation";
import { Marco, boton } from "@/components/pc2-marco";
import { salir } from "@/features/acceso/actions";
import { obtenerPerfil } from "@/features/acceso/perfil";

export const instant = false;

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const perfil = await obtenerPerfil();
  const { estado } = await searchParams;
  if (perfil && !estado) redirect(`/mi-cuenta/${perfil.rol}`);

  return (
    <Marco titulo="Mi cuenta" variant="compacta">
      {estado === "acceso-denegado" && <p role="alert" className="pc2-alert" data-kind="error">Tu perfil no tiene acceso a esa sección.</p>}
      {estado === "error-salida" && <p role="alert" className="pc2-alert" data-kind="error">No se pudo cerrar la sesión. Inténtalo nuevamente.</p>}
      {!perfil && <p className="pc2-empty">Tu cuenta aún no tiene un perfil de participante asociado.</p>}
      <form action={salir} className="pc2-form-actions"><button className={boton}>Cerrar sesión</button></form>
    </Marco>
  );
}

