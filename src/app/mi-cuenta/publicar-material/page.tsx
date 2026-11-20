import { redirect } from "next/navigation";
import { Marco, boton, campo } from "@/components/pc2-marco";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { publicarMaterial } from "@/features/ofertas/actions";
import { materiales, unidades } from "@/features/ofertas/modelo";

export const instant = false;
const mensajes = new Map([
  ["publicado", "Tu material quedó publicado como disponible para recojo."],
  ["datos", "Revisa los campos. La cantidad debe ser positiva y las unidades deben ser enteras."],
  ["error", "No se pudo publicar el material. Inténtalo de nuevo."],
]);

export default async function PublicarMaterial({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (!perfil || (perfil.rol !== "hogar" && perfil.rol !== "negocio")) {
    redirect("/mi-cuenta?estado=acceso-denegado");
  }

  const { estado } = await searchParams;
  const mensaje = mensajes.get(estado ?? "");

  return (
    <Marco titulo="Publicar material para recojo">
      {mensaje && <p role="status" className="mb-4">{mensaje}</p>}
      <form action={publicarMaterial} className="max-w-lg space-y-4">
        <label className="block">Material
          <select name="material" defaultValue="" required className={campo}>
            <option value="" disabled>Selecciona un material</option>
            {materiales.map((material) => <option key={material}>{material}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label>Cantidad aproximada
            <input name="cantidad" type="number" min="0.01" max="9999999.99" step="0.01" required className={campo} />
          </label>
          <label>Unidad
            <select name="unidad" required className={campo}>
              {unidades.map((unidad) => <option key={unidad}>{unidad}</option>)}
            </select>
          </label>
        </div>
        <label className="block">Distrito <input name="distrito" minLength={2} maxLength={80} required className={campo} /></label>
        <label className="block">Dirección de recojo
          <input name="direccion" minLength={5} maxLength={200} required className={campo} aria-describedby="privacidad-direccion" />
        </label>
        <p id="privacidad-direccion" className="text-sm text-slate-600">El listado de ofertas muestra el distrito. La dirección exacta queda reservada.</p>
        <button className={boton}>Publicar</button>
      </form>
    </Marco>
  );
}

