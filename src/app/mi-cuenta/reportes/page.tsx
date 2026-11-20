import Form from "next/form";
import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { MaterialesLista } from "@/components/pc2-materiales-lista";
import { exigirAdminAcopio } from "@/features/acopio/gestion-acceso";
import { cantidadLocal, esFechaReporte, fechaLima, numeroPagina } from "@/features/ofertas/recojos-modelo";

export const instant = false;
const ruta = "/mi-cuenta/reportes";

type Material = { material: string; cantidad: number; unidad: string };
type Reporte = {
  total: number;
  recojos: { id: string; distrito: string; finalizado_en: string; materiales: Material[] }[];
  recuperado: Material[];
};

export default async function Reportes({ searchParams }: {
  searchParams: Promise<{ desde?: string; hasta?: string; distrito?: string; pagina?: string }>;
}) {
  const supabase = await exigirAdminAcopio();
  const filtros = await searchParams;
  const desde = typeof filtros.desde === "string" ? filtros.desde : "";
  const hasta = typeof filtros.hasta === "string" ? filtros.hasta : "";
  const distrito = typeof filtros.distrito === "string" ? filtros.distrito.trim().slice(0, 80) : "";
  const pagina = numeroPagina(filtros.pagina);
  const fechaInvalida = (desde && !esFechaReporte(desde)) || (hasta && !esFechaReporte(hasta))
    || (desde && hasta && desde > hasta);

  let reporte: Reporte | null = null;
  if (!fechaInvalida) {
    const { data, error } = await supabase.rpc("pc2_reporte_reciclaje", {
      p_desde: desde || null, p_hasta: hasta || null, p_distrito: distrito || null, p_pagina: pagina,
    });
    if (error) throw new Error("No se pudo generar el reporte.");
    reporte = data as Reporte;
  }

  function paginaUrl(n: number) {
    return `${ruta}?${new URLSearchParams({ desde, hasta, distrito, pagina: String(n) })}`;
  }

  return (
    <Marco titulo="Reportes de reciclaje" descripcion="Consulta los recojos completados y la cantidad estimada de material recuperado.">
      <Form action={ruta} className="pc2-panel pc2-filter">
        <label>Desde <input className={campo} type="date" name="desde" defaultValue={desde} /></label>
        <label>Hasta <input className={campo} type="date" name="hasta" defaultValue={hasta} /></label>
        <label>Distrito <input className={campo} name="distrito" defaultValue={distrito} maxLength={80} /></label>
        <div className="pc2-actions">
          <button className={boton}>Consultar</button>
          <Link href={ruta} className="pc2-button pc2-button-secondary">Limpiar filtros</Link>
        </div>
      </Form>
      <p className="pc2-form-note mb-6 text-center">Fechas de cierre en hora de Lima.</p>
      {fechaInvalida && <p role="alert" className="pc2-alert" data-kind="error">Ingresa fechas válidas y un inicio anterior o igual al fin.</p>}
      {reporte && (
        <>
          <section className="pc2-panel mb-5">
            <h2 className="mb-3 text-xl font-semibold">Recojos completados ({reporte.total})</h2>
            {reporte.recojos.length === 0 && <p>No hay recojos completados en esta página.</p>}
            {reporte.recojos.length > 0 && (
              <div className="pc2-table" tabIndex={0} role="region" aria-label="Tabla de recojos completados">
                <table className="w-full text-left">
                  <thead><tr>
                    <th className="p-2">Fecha de cierre</th><th className="p-2">Distrito</th>
                    <th className="p-2">Materiales y cantidades</th>
                  </tr></thead>
                  <tbody>{reporte.recojos.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td data-label="Fecha de cierre">{fechaLima.format(new Date(item.finalizado_en))}</td>
                      <td data-label="Distrito">{item.distrito}</td>
                      <td data-label="Materiales"><MaterialesLista items={item.materiales} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {(pagina > 1 || reporte.total > pagina * 20) && (
              <nav aria-label="Páginas de recojos completados" className="pc2-pagination">
                {pagina > 1 && <Link href={paginaUrl(pagina - 1)} className={enlace}>Anterior</Link>}
                <span>Página {pagina}</span>
                {reporte.total > pagina * 20 && pagina < 100000 && <Link href={paginaUrl(pagina + 1)} className={enlace}>Siguiente</Link>}
              </nav>
            )}
          </section>
          <section className="pc2-panel">
            <h2 className="mb-3 text-xl font-semibold">Cantidad estimada recuperada por material</h2>
            {reporte.recuperado.length === 0 && <p>No hay cantidades recuperadas para los filtros elegidos.</p>}
            <ul className="pc2-card-grid">
              {reporte.recuperado.map((item) => (
                <li key={`${item.material}-${item.unidad}`} className="pc2-card">
                  <h3 className="font-semibold">{item.material}</h3>
                  <p>{cantidadLocal.format(item.cantidad)} {item.unidad}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Marco>
  );
}

