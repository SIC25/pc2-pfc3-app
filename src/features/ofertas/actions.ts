"use server";

import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { createClient } from "@/lib/supabase/server";
import { leerOferta } from "./modelo";

const ruta = "/mi-cuenta/publicar-material";

export async function publicarMaterial(form: FormData) {
  const perfil = await obtenerPerfil();
  if (!perfil || (perfil.rol !== "hogar" && perfil.rol !== "negocio")) {
    redirect("/mi-cuenta?estado=acceso-denegado");
  }
  const oferta = leerOferta(form);
  if (!oferta) redirect(`${ruta}?estado=datos`);
  const supabase = await createClient();
  const { error } = await supabase.from("pc2_ofertas").insert(oferta);
  if (error) redirect(`${ruta}?estado=error`);
  redirect(`${ruta}?estado=publicado`);
}

