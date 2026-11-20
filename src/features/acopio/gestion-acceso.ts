import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { createClient } from "@/lib/supabase/server";

export async function esAdminAcopio(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.from("pc2_admins_acopio").select("id").limit(1).maybeSingle();
  if (error) throw new Error("No se pudo consultar el permiso de gestión de acopio.");
  return Boolean(data);
}

export async function exigirAdminAcopio() {
  await obtenerPerfil();
  const supabase = await createClient();
  if (!await esAdminAcopio(supabase)) redirect("/mi-cuenta?estado=acceso-denegado");
  return supabase;
}

