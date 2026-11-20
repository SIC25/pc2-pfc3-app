import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { exigirAdminAcopio } from "@/features/acopio/gestion-acceso";
import { cambiarEstadoPunto, guardarPunto } from "@/features/acopio/gestion-actions";
import { esSlugPunto } from "@/features/acopio/gestion-modelo";

export const instant = false;

const ruta = "/mi-cuenta/gestion-acopio";
const mensajes = new Map([
  ["datos", "Revisa los campos del punto de acopio."],
  ["duplicado", "Ya existe un punto con ese identificador."],
  ["error", "No se pudo guardar el cambio. Inténtalo de nuevo."],
  ["guardado", "Punto de acopio guardado."],
  ["actualizado", "Estado del punto de acopio actualizado."],
]);

export default async function GestionAcopio({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; estado?: string }>;
}) {
  const supabase = await exigirAdminAcopio();
  const { editar, estado } = await searchParams;
  const { data: puntos, error } = await supabase.from("pc2_puntos_acopio")
    .select("slug, nombre, distrito, direccion, horario, materiales, activo")
    .order("nombre").limit(1000);
  if (error) throw new Error("No se pudo cargar la gestión de acopio.");
  const punto = typeof editar === "string" && esSlugPunto(editar)
    ? puntos.find((item) => item.slug === editar)
    : undefined;
  const mensaje = mensajes.get(estado ?? "");

  return (
    <Marco titulo="Gestionar puntos de acopio" descripcion="Registra puntos o actualiza su horario y disponibilidad.">
      {mensaje && <p role="status" className="pc2-alert">{mensaje}</p>}
      {editar && !punto && <p role="alert" className="pc2-alert" data-kind="error">El punto de acopio no está disponible para edición.</p>}
      <section className="pc2-panel pc2-form mb-8">
        <h2 className="mb-4 text-xl font-semibold">{punto ? "Editar punto" : "Registrar punto"}</h2>
        <form action={guardarPunto} className="space-y-3">
          <input type="hidden" name="modo" value={punto ? "editar" : "crear"} />
          {punto ? <input type="hidden" name="slug" value={punto.slug} /> : (
            <label className="block">Identificador público
              <input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} required className={campo} placeholder="punto-surco" aria-describedby="slug-ayuda" />
              <small id="slug-ayuda" className="pc2-form-note">Usa minúsculas, números y guiones. Ejemplo: punto-surco.</small>
            </label>
          )}
          <label className="block">Nombre <input name="nombre" defaultValue={punto?.nombre} minLength={2} maxLength={120} required className={campo} /></label>
          <label className="block">Distrito <input name="distrito" defaultValue={punto?.distrito} minLength={2} maxLength={80} required className={campo} /></label>
          <label className="block">Dirección <input name="direccion" defaultValue={punto?.direccion} minLength={5} maxLength={200} required className={campo} /></label>
          <label className="block">Horario <input name="horario" defaultValue={punto?.horario} minLength={3} maxLength={160} required className={campo} /></label>
          <label className="block">Materiales, separados por comas
            <input name="materiales" defaultValue={punto?.materiales.join(", ")} maxLength={1200} required className={campo} />
          </label>
          <div className="pc2-form-actions">
            <button className={boton}>Guardar punto</button>
            {punto && <Link href={ruta} className={enlace}>Cancelar edición</Link>}
          </div>
        </form>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Puntos registrados</h2>
        {puntos.length === 0 && <p className="pc2-empty">Todavía no hay puntos registrados.</p>}
        <ul className="pc2-card-grid">
          {puntos.map((item) => (
            <li key={item.slug} className="pc2-card">
              <h3 className="font-semibold">{item.nombre}</h3>
              <p className="mb-3">{item.distrito} · {item.activo ? "Activo" : "Inactivo"}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href={`${ruta}?editar=${item.slug}`} className={enlace}>Editar</Link>
                <form action={cambiarEstadoPunto}>
                  <input type="hidden" name="slug" value={item.slug} />
                  <input type="hidden" name="activo" value={String(!item.activo)} />
                  <button className={boton}>{item.activo ? "Desactivar" : "Reactivar"}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Marco>
  );
}

