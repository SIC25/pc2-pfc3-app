import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { MaterialesLista } from "@/components/pc2-materiales-lista";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { esMaterial, materiales, type MaterialOferta } from "@/features/ofertas/modelo";
import { aceptarRecojo } from "@/features/ofertas/recojos-actions";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const ruta = "/mi-cuenta/ofertas";
type Oferta = { id: string; distrito: string; materiales: MaterialOferta[] };

export default async function Ofertas({
  searchParams,
}: {
  searchParams: Promise<{ distrito?: string; material?: string; pagina?: string; estado?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "recolector") redirect("/mi-cuenta?estado=acceso-denegado");
  const filtros = await searchParams;
  const distrito = typeof filtros.distrito === "string" ? filtros.distrito.trim().slice(0, 80) : "";
  const material = typeof filtros.material === "string" && esMaterial(filtros.material) ? filtros.material : "";
  const numero = Number(filtros.pagina);
  const pagina = Number.isInteger(numero) && numero > 0 ? Math.min(numero, 100000) : 1;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pc2_buscar_ofertas_materiales", {
    p_distrito: distrito || null,
    p_material: material || null,
    p_pagina: pagina,
  });
  if (error) throw new Error("No se pudieron consultar las ofertas disponibles.");
  const resultados = (data ?? []) as Oferta[];
  const ofertas = resultados.slice(0, 20);

  function paginaUrl(numeroPagina: number) {
    return `${ruta}?${new URLSearchParams({ distrito, material, pagina: String(numeroPagina) })}`;
  }

  return (
    <Marco titulo="Ofertas disponibles" descripcion="Encuentra materiales por distrito y revisa qué incluye cada recojo.">
      <div className="pc2-toolbar"><Link href="/mi-cuenta/mis-recojos" className="pc2-button pc2-button-secondary">Ver mis recojos</Link></div>
      {filtros.estado === "no-disponible" && (
        <p role="status" className="pc2-alert">Esta oferta ya no está disponible. Consulta el listado actualizado.</p>
      )}
      {(filtros.estado === "error" || filtros.estado === "datos") && (
        <p role="alert" className="pc2-alert" data-kind="error">No se pudo aceptar el recojo. Selecciona una oferta disponible.</p>
      )}
      <Form action={ruta} className="pc2-panel pc2-filter">
        <label className="block min-w-44">Distrito
          <input name="distrito" defaultValue={distrito} maxLength={80} placeholder="Ej. Villa El Salvador" className={campo} />
        </label>
        <label className="block min-w-44">Material
          <select name="material" defaultValue={material} className={campo}>
            <option value="">Todos los materiales</option>
            {materiales.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="pc2-actions">
          <button className={boton}>Buscar</button>
          <Link href={ruta} className="pc2-button pc2-button-secondary">Limpiar filtros</Link>
        </div>
      </Form>
      {ofertas.length === 0 && <p role="status" className="pc2-empty">No se encontraron ofertas disponibles con esos filtros.</p>}
      <ul className="pc2-card-grid">
        {ofertas.map((oferta) => (
          <li key={oferta.id} className="pc2-card">
            <div className="pc2-card-head">
              <h2 className="text-lg">{oferta.distrito}</h2>
              <span className="pc2-status" data-estado="disponible">Disponible</span>
            </div>
            <MaterialesLista items={oferta.materiales} />
            <p className="pc2-card-meta">La dirección se muestra al aceptar el recojo.</p>
            <form action={aceptarRecojo} className="mt-3">
              <input type="hidden" name="id" value={oferta.id} />
              <button className={boton}>Aceptar recojo</button>
            </form>
          </li>
        ))}
      </ul>
      {(pagina > 1 || resultados.length > 20) && (
        <nav aria-label="Páginas de resultados" className="pc2-pagination">
          {pagina > 1 && <Link href={paginaUrl(pagina - 1)} className={enlace}>Anterior</Link>}
          <span>Página {pagina}</span>
          {resultados.length > 20 && pagina < 100000 && <Link href={paginaUrl(pagina + 1)} className={enlace}>Siguiente</Link>}
        </nav>
      )}
    </Marco>
  );
}

