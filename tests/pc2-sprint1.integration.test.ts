import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

function variableDePrueba(nombre: string) {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Configura ${nombre} para ejecutar la prueba de integración.`);
  return valor;
}

const opciones = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

const habilitada = process.env.RUN_SUPABASE_INTEGRATION === "1";

describe.skipIf(!habilitada)("PP-6 y PP-7 · Supabase Auth y perfil del participante", () => {
  let limpiarCuenta: (() => Promise<void>) | undefined;

  afterAll(async () => {
    await limpiarCuenta?.();
  }, 15_000);

  it("registra el usuario, inicia sesión y consulta el perfil creado por el trigger", async () => {
    const url = variableDePrueba("SUPABASE_TEST_URL");
    const publica = variableDePrueba("SUPABASE_TEST_PUBLISHABLE_KEY");
    const secreta = variableDePrueba("SUPABASE_TEST_SECRET_KEY");
    const registro = createClient(url, publica, opciones);
    const login = createClient(url, publica, opciones);
    const admin = createClient(url, secreta, opciones);

    const email = `pc2-sprint1-${randomUUID()}@example.com`;
    const password = `Prueba-A1!${randomUUID()}`;
    const nombre = "Participante de integración";
    const rol = "hogar";

    const alta = await registro.auth.signUp({
      email,
      password,
      options: { data: { pc2_nombre: nombre, pc2_rol: rol } },
    });
    const id = alta.data.user?.id;
    if (id) {
      limpiarCuenta = async () => {
        const { error } = await admin.auth.admin.deleteUser(id);
        expect(error?.message, "No se pudo limpiar la cuenta temporal de Supabase Auth").toBeUndefined();
      };
    }
    expect(alta.error?.message, "Falló el registro en Supabase Auth").toBeUndefined();
    if (!id) throw new Error("Supabase Auth no devolvió el ID de la cuenta.");
    expect(alta.data.session, "Configura Supabase de pruebas con Confirm email desactivado").not.toBeNull();

    const acceso = await login.auth.signInWithPassword({ email, password });
    expect(acceso.error?.message, "Falló el inicio de sesión con la cuenta recién registrada").toBeUndefined();
    expect(acceso.data.user?.id).toBe(id);

    const perfil = await login
      .from("pc2_perfiles")
      .select("id, nombre, rol")
      .eq("id", id)
      .single();
    expect(perfil.error?.message, "No se pudo leer el perfil con la sesión del participante").toBeUndefined();
    expect(perfil.data).toEqual({ id, nombre, rol });
  }, 30_000);
});

