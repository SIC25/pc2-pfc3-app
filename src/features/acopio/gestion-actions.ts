"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdminAcopio } from "./gestion-acceso";
import { esSlugPunto, leerPunto } from "./gestion-modelo";

const gestion = "/mi-cuenta/gestion-acopio";

export async function guardarPunto(form: FormData) {
  const supabase = await exigirAdminAcopio();
  const slug = String(form.get("slug") ?? "").trim();
  const editando = form.get("modo") === "editar";
  const punto = leerPunto(form);
  const destino = editando && esSlugPunto(slug) ? `${gestion}?editar=${slug}&` : `${gestion}?`;
  if (!punto || !esSlugPunto(slug)) redirect(`${destino}estado=datos`);

  const resultado = editando
    ? await supabase.from("pc2_puntos_acopio").update(punto).eq("slug", slug).select("slug").maybeSingle()
    : await supabase.from("pc2_puntos_acopio").insert({ slug, ...punto }).select("slug").single();
  if (resultado.error?.code === "23505") redirect(`${destino}estado=duplicado`);
  if (resultado.error || !resultado.data) redirect(`${destino}estado=error`);

  revalidatePath("/puntos-de-acopio");
  revalidatePath(`/puntos-de-acopio/${slug}`);
  redirect(`${gestion}?estado=guardado`);
}

export async function cambiarEstadoPunto(form: FormData) {
  const supabase = await exigirAdminAcopio();
  const slug = String(form.get("slug") ?? "");
  const estado = form.get("activo");
  if (!esSlugPunto(slug) || (estado !== "true" && estado !== "false")) redirect(`${gestion}?estado=datos`);

  const { data, error } = await supabase.from("pc2_puntos_acopio")
    .update({ activo: estado === "true" }).eq("slug", slug).select("slug").maybeSingle();

  if (error || !data) redirect(`${gestion}?estado=error`);
  revalidatePath("/puntos-de-acopio");
  revalidatePath(`/puntos-de-acopio/${slug}`);
  redirect(`${gestion}?estado=actualizado`);
}

