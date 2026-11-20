import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export type Punto = {
  slug: string;
  nombre: string;
  distrito: string;
  direccion: string;
  horario: string;
  materiales: string[];
  es_demostracion: boolean;
};

export const camposPunto = "slug, nombre, distrito, direccion, horario, materiales, es_demostracion";

export function normalizarFiltro(value: string | string[] | undefined) {
  if (typeof value !== "string") return "";
  const limpio = value.trim();
  return limpio.length <= 80 ? limpio : "";
}

export async function listarPuntos(distrito: string, material: string) {
  await connection();
  const supabase = await createClient();
  let resultados = supabase.from("pc2_puntos_acopio").select(camposPunto)
    .eq("activo", true).order("nombre");

  if (distrito) resultados = resultados.eq("distrito", distrito);
  if (material) {
    const elemento = material.replace(/[\\"]/g, "\\$&");
    resultados = resultados.filter("materiales", "cs", '{"' + elemento + '"}');
  }

  const [puntos, opciones] = await Promise.all([
    resultados,
    supabase.from("pc2_puntos_acopio").select("distrito, materiales").eq("activo", true),
  ]);
  if (puntos.error || opciones.error) throw new Error("No se pudo cargar el directorio.");

  const ordenar = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
  return {
    puntos: puntos.data as Punto[],
    distritos: ordenar(opciones.data.map((punto) => punto.distrito)),
    materiales: ordenar(opciones.data.flatMap((punto) => punto.materiales)),
  };
}

export async function buscarPunto(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from("pc2_puntos_acopio").select(camposPunto)
    .eq("slug", slug).eq("activo", true).maybeSingle();
  if (error) throw new Error("No se pudo consultar el punto de acopio.");
  return data as Punto | null;
}

