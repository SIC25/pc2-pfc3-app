"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarRegistro } from "./modelo";

export async function registrar(form: FormData) {
  const registro = validarRegistro(form);

  if (!registro) {
    redirect("/registro?estado=datos");
  }

  const { nombre, email, password, rol } = registro;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        pc2_nombre: nombre,
        pc2_rol: rol,
      },
    },
  });

  if (error) {
    console.error("[PC2] Error de registro en Supabase", {
      code: error.code,
      status: error.status,
    });

    if (error.status === 429) {
      redirect("/registro?estado=limite");
    }

    redirect("/registro?estado=error");
  }

  if (data.session) {
    redirect("/mi-cuenta");
  }

  redirect("/ingresar?estado=revisa-correo");
}

export async function ingresar(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email || email.length > 254 || !password || password.length > 72) {
    redirect("/ingresar?estado=credenciales");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      redirect("/ingresar?estado=confirma");
    }

    if (error.status === 429) {
      redirect("/ingresar?estado=limite");
    }

    redirect("/ingresar?estado=credenciales");
  }

  redirect("/mi-cuenta");
}

export async function salir() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error && error.status !== 401 && error.status !== 403) {
    redirect("/mi-cuenta?estado=error-salida");
  }

  redirect("/ingresar?estado=sesion-cerrada");
}