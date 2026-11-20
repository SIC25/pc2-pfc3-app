import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { listarPuntos, normalizarFiltro } from "@/features/acopio/directorio";

export default async function Directorio({
  searchParams,
}: { searchParams: Promise<{ distrito?: string | string[]; material?: string | string[] }> }) {
  const filtros = await searchParams;
  const distrito = normalizarFiltro(filtros.distrito);
  const material = normalizarFiltro(filtros.material);
  const { puntos, distritos, materiales } = await listarPuntos(distrito, material);

  return (
    <Marco titulo="Puntos de acopio">
      <form action="/puntos-de-acopio" method="get" className="mb-8 flex flex-wrap items-end gap-4">
        <label className="block min-w-44">Distrito
          <select name="distrito" defaultValue={distrito} className={campo}>
            <option value="">Todos los distritos</option>
            {distrito && !distritos.includes(distrito) && <option value={distrito}>{distrito}</option>}
            {distritos.map((valor) => <option key={valor}>{valor}</option>)}
          </select>
        </label>
        <label className="block min-w-44">Material
          <select name="material" defaultValue={material} className={campo}>
            <option value="">Todos los materiales</option>
            {material && !materiales.includes(material) && <option value={material}>{material}</option>}
            {materiales.map((valor) => <option key={valor}>{valor}</option>)}
          </select>
        </label>
        <button className={boton}>Buscar</button>
        <Link href="/puntos-de-acopio" className={`${enlace} py-2`}>Limpiar filtros</Link>
      </form>
      {puntos.length === 0 && <p role="status">No se encontraron puntos de acopio con esos filtros.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {puntos.map((punto) => (
          <li key={punto.slug} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-2 text-lg">
              <Link href={`/puntos-de-acopio/${punto.slug}`} className={enlace}>{punto.nombre}</Link>
            </h2>
            {punto.es_demostracion && <p className="text-sm text-slate-600">Datos de demostración</p>}
            <p>{punto.distrito} · {punto.direccion}</p>
            <p className="mt-2">{punto.materiales.join(", ")}</p>
          </li>
        ))}
      </ul>
    </Marco>
  );
}

