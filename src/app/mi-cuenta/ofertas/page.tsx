import Link from "next/link";
import { redirect } from "next/navigation";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { esMaterial, materiales } from "@/features/ofertas/modelo";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const ruta = "/mi-cuenta/ofertas";
const cantidadLocal = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

type Oferta = { id: string; distrito: string; material: string; cantidad: number; unidad: string };

export default async function Ofertas({
  searchParams,
}: {
  searchParams: Promise<{ distrito?: string; material?: string; pagina?: string }>;
}) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "recolector") redirect("/mi-cuenta?estado=acceso-denegado");
  const filtros = await searchParams;
  const distrito = typeof filtros.distrito === "string" ? filtros.distrito.trim().slice(0, 80) : "";
  const material = typeof filtros.material === "string" && esMaterial(filtros.material) ? filtros.material : "";
  const numero = Number(filtros.pagina);
  const pagina = Number.isInteger(numero) && numero > 0 ? Math.min(numero, 100000) : 1;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pc2_buscar_ofertas", {
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
    <Marco titulo="Ofertas disponibles para recojo">
      <form action={ruta} method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <label className="block min-w-44">Distrito
          <input name="distrito" defaultValue={distrito} maxLength={80} placeholder="Ej. Villa El Salvador" className={campo} />
        </label>
        <label className="block min-w-44">Material
          <select name="material" defaultValue={material} className={campo}>
            <option value="">Todos los materiales</option>
            {materiales.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className={boton}>Buscar</button>
        <Link href={ruta} className={`${enlace} py-2`}>Limpiar filtros</Link>
      </form>
      {ofertas.length === 0 && <p role="status">No se encontraron ofertas disponibles con esos filtros.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {ofertas.map((oferta) => (
          <li key={oferta.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">{oferta.material}</h2>
            <p>{oferta.distrito}</p>
            <p>Cantidad aproximada: {cantidadLocal.format(oferta.cantidad)} {oferta.unidad}</p>
          </li>
        ))}
      </ul>
      {(pagina > 1 || resultados.length > 20) && (
        <nav aria-label="Páginas de resultados" className="mt-6 flex gap-4">
          {pagina > 1 && <Link href={paginaUrl(pagina - 1)} className={enlace}>Anterior</Link>}
          <span>Página {pagina}</span>
          {resultados.length > 20 && pagina < 100000 && <Link href={paginaUrl(pagina + 1)} className={enlace}>Siguiente</Link>}
        </nav>
      )}
    </Marco>
  );
}

