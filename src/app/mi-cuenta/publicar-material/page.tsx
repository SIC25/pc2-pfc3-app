import Link from "next/link";
import { redirect } from "next/navigation";
import { Marco } from "@/components/pc2-marco";
import { MaterialesCampos } from "@/components/pc2-materiales-campos";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { publicarMaterial } from "@/features/ofertas/actions";

export const instant = false;

const mensajes = new Map([
  ["publicado", "Tu publicación está disponible para recojo."],
  ["datos", "Revisa los campos. Usa cantidades positivas, unidades enteras y evita repetir el mismo material con la misma unidad."],
  ["error", "No se pudo publicar. Inténtalo de nuevo."],
]);

export default async function PublicarMaterial({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "hogar" && perfil?.rol !== "negocio") {
    redirect("/mi-cuenta?estado=acceso-denegado");
  }

  const { estado } = await searchParams;
  const mensaje = mensajes.get(estado ?? "");

  return (
    <Marco titulo="Publicar materiales" descripcion="Agrupa distintos materiales para un mismo recojo." variant="compacta">
      {mensaje && (
        <p role="status" className="pc2-alert" data-kind={estado === "publicado" ? "ok" : "error"}>{mensaje}</p>
      )}
      <form action={publicarMaterial} className="pc2-panel pc2-form space-y-5">
        <MaterialesCampos key={estado ?? "nuevo"} />
        <section aria-label="Ubicación del recojo">
          <div className="pc2-section-heading">
            <h2>Lugar del recojo</h2>
            <p>El listado muestra el distrito. Solo el recolector asignado verá la dirección exacta.</p>
          </div>
          <div className="pc2-form-grid">
            <label>Distrito
              <input name="distrito" minLength={2} maxLength={80} required className="pc2-field" placeholder="Ej. Villa El Salvador" />
            </label>
            <label>Dirección
              <input name="direccion" minLength={5} maxLength={200} required className="pc2-field" placeholder="Calle y número" />
            </label>
          </div>
        </section>
        <div className="pc2-form-actions">
          <button className="pc2-button">Publicar para recojo</button>
          <Link href="/mi-cuenta/mis-publicaciones" className="pc2-button pc2-button-secondary">Mis publicaciones</Link>
        </div>
      </form>
    </Marco>
  );
}

