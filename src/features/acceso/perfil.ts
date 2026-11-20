import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esRol } from "./modelo";

export async function obtenerPerfil() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (error || !userId) {
    redirect("/ingresar");
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from("pc2_perfiles")
    .select("nombre, rol")
    .eq("id", userId)
    .maybeSingle();

  if (errorPerfil) {
    throw new Error("No se pudo consultar el perfil.");
  }

  if (!perfil || !esRol(perfil.rol)) {
    return null;
  }

  return { nombre: String(perfil.nombre), rol: perfil.rol };
}