import Link from "next/link";
import { redirect } from "next/navigation";
import { Marco, boton, enlace } from "@/components/pc2-marco";
import { MaterialesLista } from "@/components/pc2-materiales-lista";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { finalizarRecojo } from "@/features/ofertas/recojos-actions";
import { estadoOferta, fechaLima, numeroPagina, type EstadoOferta } from "@/features/ofertas/recojos-modelo";
import type { MaterialOferta } from "@/features/ofertas/modelo";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const ruta = "/mi-cuenta/mis-recojos";
const mensajes = new Map([
  ["aceptado", "Recojo asignado. Ya puedes consultar la dirección."],
  ["finalizado", "Recojo marcado como completado."],
  ["no-disponible", "Este recojo ya no se puede finalizar."],
  ["datos", "Selecciona un recojo válido."],
  ["error", "No se pudo actualizar el recojo."],
]);

type Recojo = {
  id: string; distrito: string; direccion: string; materiales: MaterialOferta[];
  estado: EstadoOferta;
  aceptado_en: string | null; finalizado_en: string | null;
};

export default async function MisRecojos({ searchParams }: {
  searchParams: Promise<{ estado?: string; pagina?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "recolector") redirect("/mi-cuenta?estado=acceso-denegado");
  const { estado, pagina: paginaSolicitada } = await searchParams;
  const pagina = numeroPagina(paginaSolicitada);
  const inicio = (pagina - 1) * 20;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pc2_mis_recojos_materiales")
    .order("aceptado_en", { ascending: false }).order("id", { ascending: false })
    .range(inicio, inicio + 20);
  if (error) throw new Error("No se pudieron cargar tus recojos.");
  const resultado = (data ?? []) as Recojo[];
  const mensaje = mensajes.get(estado ?? "");

  return (
    <Marco titulo="Mis recojos" descripcion="Consulta la dirección y registra la entrega cuando hayas recogido los materiales.">
      <div className="pc2-toolbar"><Link href="/mi-cuenta/ofertas" className="pc2-button pc2-button-secondary">Ver ofertas disponibles</Link></div>
      {mensaje && <p role="status" className="pc2-alert">{mensaje}</p>}
      {resultado.length === 0 && <p className="pc2-empty">No hay recojos asignados en esta página.</p>}
      <ul className="pc2-card-grid">
        {resultado.slice(0, 20).map((recojo) => (
          <li key={recojo.id} className="pc2-card space-y-2">
            <div className="pc2-card-head">
              <h2 className="text-lg">{recojo.distrito}</h2>
              <span className="pc2-status" data-estado={recojo.estado}>{estadoOferta[recojo.estado]}</span>
            </div>
            <p className="pc2-card-meta">{recojo.direccion}</p>
            <MaterialesLista items={recojo.materiales} />
            {recojo.aceptado_en && <p>Aceptado: {fechaLima.format(new Date(recojo.aceptado_en))}</p>}
            {recojo.finalizado_en && <p>Completado: {fechaLima.format(new Date(recojo.finalizado_en))}</p>}
            {recojo.estado === "en_coordinacion" && (
              <form action={finalizarRecojo}>
                <input type="hidden" name="id" value={recojo.id} />
                <button className={boton}>Registrar recojo completado</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {(pagina > 1 || resultado.length > 20) && (
        <nav aria-label="Páginas de recojos" className="pc2-pagination">
          {pagina > 1 && <Link href={`${ruta}?pagina=${pagina - 1}`} className={enlace}>Anterior</Link>}
          <span>Página {pagina}</span>
          {resultado.length > 20 && pagina < 100000 && <Link href={`${ruta}?pagina=${pagina + 1}`} className={enlace}>Siguiente</Link>}
        </nav>
      )}
    </Marco>
  );
}

