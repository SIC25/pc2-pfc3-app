import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const opciones = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

function variable(nombre: string) {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Configura ${nombre} para ejecutar la integración.`);
  return valor;
}

function sinError(error: { message: string; code?: string } | null, paso: string) {
  if (error) throw new Error(`${paso}: ${error.code ?? "sin código"} — ${error.message}`);
}

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== "1")(
  "Sprint 2 · integración con Supabase Auth y PostgreSQL",
  () => {
    const marca = randomUUID();
    const slug = `pc2-prueba-${marca}`;
    const distrito = `PC2 distrito de prueba ${marca}`;
    const distritoAlterno = `PC2 otro distrito ${marca}`;
    const direccion = "Dirección reservada de prueba 123";
    const oferta = { distrito, direccion, material: "Vidrio", cantidad: 2.5, unidad: "kg" };
    const usuarios: string[] = [];
    let eliminarPunto = false;
    let admin: SupabaseClient;
    let visitante: SupabaseClient;
    let hogar: SupabaseClient;
    let recolector: SupabaseClient;
    let idHogar: string;

    beforeAll(async () => {
      const url = variable("SUPABASE_TEST_URL");
      const publicada = variable("SUPABASE_TEST_PUBLISHABLE_KEY");
      admin = createClient(url, variable("SUPABASE_TEST_SECRET_KEY"), opciones);
      visitante = createClient(url, publicada, opciones);

      async function crearSesion(rol: "hogar" | "recolector") {
        const email = `pc2-sprint2-${rol}-${marca}@example.com`;
        const password = `Prueba-2-A1!${randomUUID()}`;
        // Crea una cuenta de prueba confirmada sin activar el envío de correo.
        const alta = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { pc2_nombre: `Prueba Sprint 2 ${rol}`, pc2_rol: rol },
        });
        const id = alta.data.user?.id;
        if (id) usuarios.push(id);
        sinError(alta.error, `Crear cuenta temporal ${rol}`);
        if (!id) throw new Error(`Auth no devolvió el ID de ${rol}.`);

        const cliente = createClient(url, publicada, opciones);
        const inicio = await cliente.auth.signInWithPassword({ email, password });
        sinError(inicio.error, `Iniciar sesión como ${rol}`);
        expect(inicio.data.user?.id).toBe(id);
        return { cliente, id };
      }

      const generador = await crearSesion("hogar");
      hogar = generador.cliente;
      idHogar = generador.id;
      recolector = (await crearSesion("recolector")).cliente;

      const permiso = await admin.from("pc2_admins_acopio").insert({ id: idHogar });
      sinError(permiso.error, "Asignar permiso temporal de gestión de acopio");
    }, 30_000);

    afterAll(async () => {
      if (!admin) return;
      const operaciones = usuarios.map(async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        sinError(error, "Eliminar usuario temporal y sus datos vinculados");
      });
      if (eliminarPunto) {
        operaciones.push((async () => {
          const { error } = await admin.from("pc2_puntos_acopio").delete().eq("slug", slug);
          sinError(error, "Eliminar punto de acopio temporal");
        })());
      }
      const resultados = await Promise.allSettled(operaciones);
      const fallos = resultados.flatMap((item) => item.status === "rejected" ? [item.reason] : []);
      if (fallos.length) throw new AggregateError(fallos, "Falló la limpieza de los datos de prueba.");
    }, 30_000);

    it("PP-10 · aplica permisos y oculta el punto desactivado del directorio público", async () => {
      const punto = {
        slug,
        nombre: "Punto temporal Sprint 2",
        distrito,
        direccion: "Dirección de prueba 456",
        horario: "Lunes, 09:00–12:00",
        materiales: ["Vidrio"],
      };

      const intentoSinPermiso = await recolector.from("pc2_puntos_acopio").insert(punto);
      expect(intentoSinPermiso.error?.code).toBe("42501");

      eliminarPunto = true;
      const alta = await hogar.from("pc2_puntos_acopio").insert(punto).select("slug, activo").single();
      sinError(alta.error, "Registrar punto como administrador");
      expect(alta.data).toEqual({ slug, activo: true });

      const nuevoHorario = "Martes, 10:00–13:00";
      const edicion = await hogar.from("pc2_puntos_acopio")
        .update({ horario: nuevoHorario }).eq("slug", slug).select("horario").single();
      sinError(edicion.error, "Editar punto como administrador");
      expect(edicion.data?.horario).toBe(nuevoHorario);

      async function consultaPublica() {
        const { data, error } = await visitante.from("pc2_puntos_acopio")
          .select("slug, horario").eq("slug", slug).maybeSingle();
        sinError(error, "Consultar punto sin sesión");
        return data;
      }
      expect(await consultaPublica()).toEqual({ slug, horario: nuevoHorario });

      for (const activo of [false, true]) {
        const cambio = await hogar.from("pc2_puntos_acopio")
          .update({ activo }).eq("slug", slug).select("activo").single();
        sinError(cambio.error, "Cambiar estado del punto como administrador");
        expect(cambio.data?.activo).toBe(activo);
        expect(await consultaPublica()).toEqual(activo ? { slug, horario: nuevoHorario } : null);
      }
    }, 30_000);

    it("PP-11 · un hogar publica material como disponible y un recolector recibe acceso denegado", async () => {
      const alta = await hogar.from("pc2_ofertas").insert(oferta)
        .select("generador_id, estado, direccion, cantidad").single();
      sinError(alta.error, "Publicar material como hogar");
      expect(alta.data).toEqual({
        generador_id: idHogar, estado: "disponible", direccion, cantidad: 2.5,
      });

      const rechazo = await recolector.from("pc2_ofertas").insert(oferta);
      expect(rechazo.error?.code).toBe("42501");
    }, 30_000);

    it("PP-13 · filtra por distrito y material y protege la dirección exacta", async () => {
      const alta = await hogar.from("pc2_ofertas").insert([
        { ...oferta, distrito: distritoAlterno },
        { ...oferta, distrito: distritoAlterno, material: "Papel" },
        { ...oferta, distrito: `${distritoAlterno} B` },
      ]).select("id, distrito, material");
      sinError(alta.error, "Preparar ofertas para validar ambos filtros");
      const objetivo = alta.data?.find((item) => item.distrito === distritoAlterno && item.material === "Vidrio");
      if (!objetivo) throw new Error("No se encontró la oferta temporal esperada.");

      const filtros = { p_distrito: distritoAlterno, p_material: "Vidrio", p_pagina: 1 };
      const buscadas = await recolector.rpc("pc2_buscar_ofertas", filtros);
      sinError(buscadas.error, "Buscar ofertas como recolector");
      expect(buscadas.data).toEqual([{
        id: objetivo.id, distrito: distritoAlterno, material: "Vidrio", cantidad: 2.5, unidad: "kg",
        creado_en: expect.any(String),
      }]);

      const sinAccesoDirecto = await recolector.from("pc2_ofertas")
        .select("direccion").eq("id", objetivo.id).maybeSingle();
      sinError(sinAccesoDirecto.error, "Comprobar aislamiento de la tabla de ofertas");
      expect(sinAccesoDirecto.data).toBeNull();

      const sinRolRecolector = await hogar.rpc("pc2_buscar_ofertas", filtros);
      expect(sinRolRecolector.error?.code).toBe("42501");
      const sinSesion = await visitante.rpc("pc2_buscar_ofertas", filtros);
      expect(sinSesion.error).not.toBeNull();
    }, 30_000);
  },
);

