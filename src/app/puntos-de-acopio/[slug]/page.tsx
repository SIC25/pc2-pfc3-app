import Link from "next/link";
import { notFound } from "next/navigation";
import { Marco, enlace } from "@/components/pc2-marco";
import { buscarPunto } from "@/features/acopio/directorio";

export default async function Ficha({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const punto = await buscarPunto(slug);
  if (!punto) notFound();

  return (
    <Marco titulo={punto.nombre}>
      <Link href="/puntos-de-acopio" className={enlace}>Volver al directorio</Link>
      {punto.es_demostracion && <p className="mt-4">Ficha de demostración. La dirección y el horario son ficticios.</p>}
      <dl className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div><dt className="font-bold">Distrito</dt><dd>{punto.distrito}</dd></div>
        <div><dt className="font-bold">Dirección</dt><dd>{punto.direccion}</dd></div>
        <div><dt className="font-bold">Horario</dt><dd>{punto.horario}</dd></div>
        <div><dt className="font-bold">Materiales aceptados</dt><dd>{punto.materiales.join(", ")}</dd></div>
      </dl>
    </Marco>
  );
}

