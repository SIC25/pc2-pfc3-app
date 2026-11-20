import Link from "next/link";
import { redirect } from "next/navigation";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { MaterialesCampos } from "@/components/pc2-materiales-campos";
import { MaterialesLista } from "@/components/pc2-materiales-lista";
import { obtenerPerfil } from "@/features/acceso/perfil";
import type { MaterialOferta } from "@/features/ofertas/modelo";
import { cancelarPublicacion, editarPublicacion } from "@/features/ofertas/recojos-actions";
import { estadoOferta, fechaLima, idOferta, numeroPagina, type EstadoOferta } from "@/features/ofertas/recojos-modelo";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const ruta = "/mi-cuenta/mis-publicaciones";
const campos = "id, distrito, direccion, material, cantidad, unidad, materiales_adicionales, estado, finalizado_en";
const mensajes = new Map([
  ["editado", "Publicación actualizada."],
  ["cancelado", "Publicación cancelada."],
  ["no-disponible", "Solo puedes modificar publicaciones propias que sigan disponibles."],
  ["datos", "Revisa las cantidades de cada material y evita repetir el mismo material con la misma unidad."],
  ["error", "No se pudo guardar el cambio."],
]);

function materialesDe(oferta: MaterialOferta & { materiales_adicionales: MaterialOferta[] }) {
  return [
    { material: oferta.material, cantidad: oferta.cantidad, unidad: oferta.unidad },
    ...oferta.materiales_adicionales,
  ];
}

export default async function MisPublicaciones({ searchParams }: {
  searchParams: Promise<{ estado?: string; editar?: string; pagina?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "hogar" && perfil?.rol !== "negocio") redirect("/mi-cuenta?estado=acceso-denegado");
  const filtros = await searchParams;
  const editar = idOferta(filtros.editar);
  const pagina = numeroPagina(filtros.pagina);
  const inicio = (pagina - 1) * 20;
  const supabase = await createClient();
  const ofertas = await supabase.from("pc2_ofertas").select(campos)
    .order("creado_en", { ascending: false }).order("id", { ascending: false })
    .range(inicio, inicio + 20);
  if (ofertas.error) throw new Error("No se pudieron cargar tus publicaciones.");

  const edicion = editar
    ? await supabase.from("pc2_ofertas").select(campos).eq("id", editar).eq("estado", "disponible").maybeSingle()
    : null;
  if (edicion?.error) throw new Error("No se pudo consultar la publicación.");
  const punto = edicion?.data;
  const mensaje = mensajes.get(filtros.estado ?? "");

  return (
    <Marco titulo="Mis publicaciones" descripcion="Revisa el avance de tus recojos. Puedes cambiar una publicación mientras esté disponible.">
      <div className="pc2-toolbar">
        <Link href="/mi-cuenta/publicar-material" className={boton}>Nueva publicación</Link>
      </div>
      {mensaje && <p role="status" className="pc2-alert" data-kind={filtros.estado === "editado" || filtros.estado === "cancelado" ? "ok" : "error"}>{mensaje}</p>}
      {filtros.editar && !punto && <p role="alert" className="pc2-alert">Esta publicación no está disponible para edición.</p>}
      {punto && (
        <form action={editarPublicacion} className="pc2-form pc2-panel my-5 space-y-4">
          <h2 className="text-lg font-semibold">Editar publicación</h2>
          <input type="hidden" name="id" value={punto.id} />
          <MaterialesCampos key={punto.id} inicial={materialesDe(punto)} />
          <div className="pc2-form-grid">
            <label>Distrito
              <input className={campo} name="distrito" defaultValue={punto.distrito} minLength={2} maxLength={80} required />
            </label>
            <label>Dirección de recojo
              <input className={campo} name="direccion" defaultValue={punto.direccion} minLength={5} maxLength={200} required />
            </label>
          </div>
          <div className="pc2-form-actions">
            <button className={boton}>Guardar cambios</button>
            <Link href={ruta} className={enlace}>Volver a mis publicaciones</Link>
          </div>
        </form>
      )}
      {ofertas.data.length === 0 && <p className="pc2-empty">No hay publicaciones en esta página.</p>}
      <ul className="pc2-card-grid">
        {ofertas.data.slice(0, 20).map((item) => (
          <li key={item.id} className="pc2-card space-y-2">
            <div className="pc2-card-head">
              <h2 className="text-lg">{item.distrito}</h2>
              <span className="pc2-status" data-estado={item.estado}>{estadoOferta[item.estado as EstadoOferta]}</span>
            </div>
            <p className="pc2-card-meta">{item.direccion}</p>
            <MaterialesLista items={materialesDe(item)} />
            {item.finalizado_en && <p>Completado: {fechaLima.format(new Date(item.finalizado_en))}</p>}
            {item.estado === "disponible" && (
              <>
                <Link href={`${ruta}?editar=${item.id}&pagina=${pagina}`} className={enlace}>Editar publicación</Link>
                <details>
                  <summary className="cursor-pointer">Cancelar publicación</summary>
                  <form action={cancelarPublicacion} className="mt-2">
                    <input type="hidden" name="id" value={item.id} />
                    <p className="mb-2">La oferta dejará de estar disponible para los recolectores.</p>
                    <button name="confirmar" value="si" className={boton}>Confirmar cancelación</button>
                  </form>
                </details>
              </>
            )}
          </li>
        ))}
      </ul>
      {(pagina > 1 || ofertas.data.length > 20) && (
        <nav aria-label="Páginas de publicaciones" className="pc2-pagination">
          {pagina > 1 && <Link href={`${ruta}?pagina=${pagina - 1}`} className={enlace}>Anterior</Link>}
          <span>Página {pagina}</span>
          {ofertas.data.length > 20 && pagina < 100000 && <Link href={`${ruta}?pagina=${pagina + 1}`} className={enlace}>Siguiente</Link>}
        </nav>
      )}
    </Marco>
  );
}

