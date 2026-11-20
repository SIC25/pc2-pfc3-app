"use server";

import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/features/acceso/perfil";
import { createClient } from "@/lib/supabase/server";
import { leerPublicacion } from "./modelo";
import { idOferta } from "./recojos-modelo";

const recojos = "/mi-cuenta/mis-recojos";
const publicaciones = "/mi-cuenta/mis-publicaciones";

async function cambiarRecojo(form: FormData, operacion: "aceptar" | "finalizar") {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "recolector") redirect("/mi-cuenta?estado=acceso-denegado");
  const ruta = operacion === "aceptar" ? "/mi-cuenta/ofertas" : recojos;
  const id = idOferta(form.get("id"));
  if (!id) redirect(`${ruta}?estado=datos`);

  const supabase = await createClient();
  const funcion = operacion === "aceptar" ? "pc2_aceptar_recojo" : "pc2_finalizar_recojo";
  const { data, error } = await supabase.rpc(funcion, { p_id: id });
  if (error) redirect(`${ruta}?estado=error`);
  if (data !== true) redirect(`${ruta}?estado=no-disponible`);

  const estado = operacion === "aceptar" ? "aceptado" : "finalizado";
  redirect(`${recojos}?estado=${estado}`);
}

export async function aceptarRecojo(form: FormData) {
  await cambiarRecojo(form, "aceptar");
}

export async function finalizarRecojo(form: FormData) {
  await cambiarRecojo(form, "finalizar");
}

export async function editarPublicacion(form: FormData) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "hogar" && perfil?.rol !== "negocio") redirect("/mi-cuenta?estado=acceso-denegado");
  const id = idOferta(form.get("id"));
  const oferta = leerPublicacion(form);
  if (!id) redirect(`${publicaciones}?estado=datos`);
  if (!oferta) redirect(`${publicaciones}?editar=${id}&estado=datos`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pc2_editar_materiales", {
    p_id: id, p_distrito: oferta.distrito, p_direccion: oferta.direccion,
    p_materiales: oferta.materiales,
  });
  if (error) redirect(`${publicaciones}?editar=${id}&estado=error`);
  redirect(`${publicaciones}?estado=${data === true ? "editado" : "no-disponible"}`);
}

export async function cancelarPublicacion(form: FormData) {
  const perfil = await obtenerPerfil();
  if (perfil?.rol !== "hogar" && perfil?.rol !== "negocio") redirect("/mi-cuenta?estado=acceso-denegado");
  const id = idOferta(form.get("id"));
  if (!id || form.get("confirmar") !== "si") redirect(`${publicaciones}?estado=datos`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pc2_cancelar_oferta", { p_id: id });
  if (error) redirect(`${publicaciones}?estado=error`);
  redirect(`${publicaciones}?estado=${data === true ? "cancelado" : "no-disponible"}`);
}

