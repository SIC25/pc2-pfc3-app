import Link from "next/link";
import { notFound } from "next/navigation";
import { Marco, enlace } from "@/components/pc2-marco";
import { buscarPunto } from "@/features/acopio/directorio";

export const instant = false;

export default async function Ficha({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const punto = await buscarPunto(slug);
  if (!punto) notFound();

  return (
    <Marco titulo={punto.nombre} descripcion={punto.distrito} variant="compacta">
      <div className="pc2-toolbar"><Link href="/puntos-de-acopio" className={enlace}>Volver al directorio</Link></div>
      {punto.es_demostracion && <p className="pc2-alert">Ficha de demostración. La dirección y el horario son ficticios.</p>}
      <dl className="pc2-panel pc2-form space-y-4">
        <div><dt className="font-bold">Distrito</dt><dd>{punto.distrito}</dd></div>
        <div><dt className="font-bold">Dirección</dt><dd>{punto.direccion}</dd></div>
        <div><dt className="font-bold">Horario</dt><dd>{punto.horario}</dd></div>
        <div><dt className="font-bold">Materiales aceptados</dt><dd>
          <ul className="pc2-tags">{punto.materiales.map((item) => <li key={item}>{item}</li>)}</ul>
        </dd></div>
      </dl>
    </Marco>
  );
}

