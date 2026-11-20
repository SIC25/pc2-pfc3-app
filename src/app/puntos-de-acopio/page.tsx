import Form from "next/form";
import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { listarPuntos, normalizarFiltro } from "@/features/acopio/directorio";

export const instant = false;

export default async function Directorio({
  searchParams,
}: { searchParams: Promise<{ distrito?: string | string[]; material?: string | string[] }> }) {
  const filtros = await searchParams;
  const distrito = normalizarFiltro(filtros.distrito);
  const material = normalizarFiltro(filtros.material);
  const { puntos, distritos, materiales } = await listarPuntos(distrito, material);

  return (
    <Marco titulo="Puntos de acopio" descripcion="Busca por distrito y material para saber dónde entregar tus reciclables.">
      <Form action="/puntos-de-acopio" className="pc2-panel pc2-filter">
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
        <div className="pc2-actions">
          <button className={boton}>Buscar</button>
          <Link href="/puntos-de-acopio" className="pc2-button pc2-button-secondary">Limpiar filtros</Link>
        </div>
      </Form>
      {puntos.length === 0 && <p role="status" className="pc2-empty">No se encontraron puntos de acopio con esos filtros.</p>}
      <ul className="pc2-card-grid">
        {puntos.map((punto) => (
          <li key={punto.slug} className="pc2-card">
            <p className="pc2-card-meta">{punto.distrito}</p>
            <h2 className="mb-2 text-lg">
              <Link href={`/puntos-de-acopio/${punto.slug}`} className={enlace}>{punto.nombre}</Link>
            </h2>
            {punto.es_demostracion && <p className="text-sm text-slate-600">Datos de demostración</p>}
            <p>{punto.direccion}</p>
            <ul className="pc2-tags" aria-label="Materiales aceptados">
              {punto.materiales.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </Marco>
  );
}

