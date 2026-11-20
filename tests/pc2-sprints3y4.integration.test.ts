import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function env(nombre: string) {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Configura ${nombre}.`);
  return valor;
}

function sinError(error: { message: string } | null, operacion: string) {
  if (error) throw new Error(`${operacion}: ${error.message}`);
}

const opciones = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== "1")(
  "Sprints 3 y 4 · integración con Supabase",
  () => {
    const marca = randomUUID();
    const distrito = `PC2 prueba ${marca}`;
    const direccion = "Dirección privada de prueba 170";
    const usuarios: string[] = [];
    let admin: SupabaseClient;
    let hogar: SupabaseClient;
    let negocio: SupabaseClient;
    let recolector1: SupabaseClient;
    let recolector2: SupabaseClient;

    beforeAll(async () => {
      const url = env("SUPABASE_TEST_URL");
      const publica = env("SUPABASE_TEST_PUBLISHABLE_KEY");
      admin = createClient(url, env("SUPABASE_TEST_SECRET_KEY"), opciones);

      async function crear(rol: string, numero: number) {
        const email = `pc234-${numero}-${marca}@example.com`;
        const password = `Prueba-A1!${randomUUID()}`;
        const alta = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { pc2_rol: rol, pc2_nombre: `Prueba ${rol}` },
        });
        if (alta.data.user) usuarios.push(alta.data.user.id);
        sinError(alta.error, "Crear usuario temporal");
        if (!alta.data.user) throw new Error("Auth no devolvió el usuario.");
        const cliente = createClient(url, publica, opciones);
        const login = await cliente.auth.signInWithPassword({ email, password });
        sinError(login.error, "Iniciar sesión de prueba");
        return { cliente, id: alta.data.user.id };
      }

      hogar = (await crear("hogar", 1)).cliente;
      const autorizado = await crear("negocio", 2);
      negocio = autorizado.cliente;
      const permiso = await admin.from("pc2_admins_acopio").insert({ id: autorizado.id });
      sinError(permiso.error, "Asignar permiso temporal para reportes");
      recolector1 = (await crear("recolector", 3)).cliente;
      recolector2 = (await crear("recolector", 4)).cliente;
    }, 40_000);

    afterAll(async () => {
      const errores: Error[] = [];
      // Las ofertas del generador se eliminan antes que las cuentas asignadas.
      for (const id of usuarios) {
        try {
          const { error } = await admin.auth.admin.deleteUser(id);
          sinError(error, "Eliminar usuario temporal");
        } catch (error) {
          errores.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
      if (errores.length) throw new AggregateError(errores, "Falló la limpieza de los perfiles de prueba.");
    }, 30_000);

    async function publicar(otroDistrito = distrito, cantidad = 2.5, unidad = "kg") {
      const { data, error } = await hogar.from("pc2_ofertas")
        .insert({ distrito: otroDistrito, direccion, material: "Vidrio", cantidad, unidad }).select("id").single();
      sinError(error, "Publicar oferta temporal");
      if (!data) throw new Error("No se recibió el ID de la oferta.");
      return data.id as string;
    }

    async function cambiar(cliente: SupabaseClient, rpc: string, id: string) {
      const { data, error } = await cliente.rpc(rpc, { p_id: id });
      sinError(error, rpc);
      return data;
    }

    async function estado(id: string) {
      const { data, error } = await hogar.from("pc2_ofertas").select("estado, finalizado_en").eq("id", id).single();
      sinError(error, "Consultar el estado");
      if (!data) throw new Error("No se pudo consultar la oferta del generador.");
      return data;
    }

    async function cerrar(id: string) {
      expect(await cambiar(recolector1, "pc2_aceptar_recojo", id)).toBe(true);
      expect(await cambiar(recolector1, "pc2_finalizar_recojo", id)).toBe(true);
    }

    it("PP-14 · solo un recolector puede aceptar y ver la dirección", async () => {
      const id = await publicar();
      const resultados = await Promise.all([
        cambiar(recolector1, "pc2_aceptar_recojo", id),
        cambiar(recolector2, "pc2_aceptar_recojo", id),
      ]);
      expect(resultados.filter((resultado) => resultado === true)).toHaveLength(1);
      for (const [indice, cliente] of [recolector1, recolector2].entries()) {
        const { data, error } = await cliente.rpc("pc2_mis_recojos");
        sinError(error, "Consultar recojos asignados");
        const recojo = data.find((item: { id: string }) => item.id === id);
        if (resultados[indice]) expect(recojo?.direccion).toBe(direccion);
        else expect(recojo).toBeUndefined();
      }
      expect((await estado(id)).estado).toBe("en_coordinacion");
    });

    it("PP-15 · el generador consulta el estado propio y otro generador no obtiene la fila", async () => {
      const id = await publicar();
      expect((await estado(id)).estado).toBe("disponible");
      await cerrar(id);
      expect((await estado(id)).estado).toBe("recogido");
      const consulta = await negocio.from("pc2_ofertas").select("estado").eq("id", id).maybeSingle();
      sinError(consulta.error, "Comprobar aislamiento de las publicaciones");
      expect(consulta.data).toBeNull();
    });

    it("PP-16 · finaliza el asignado y los reintentos conservan la fecha", async () => {
      const id = await publicar();
      expect(await cambiar(recolector1, "pc2_aceptar_recojo", id)).toBe(true);
      expect(await cambiar(recolector2, "pc2_finalizar_recojo", id)).toBe(false);
      expect((await estado(id)).finalizado_en).toBeNull();
      expect(await cambiar(recolector1, "pc2_finalizar_recojo", id)).toBe(true);
      const cierre = await estado(id);
      expect(cierre.estado).toBe("recogido");
      expect(cierre.finalizado_en).toEqual(expect.any(String));
      expect(await cambiar(recolector1, "pc2_finalizar_recojo", id)).toBe(false);
      expect(await estado(id)).toEqual(cierre);
    });

    it("PP-12 · permite editar y cancelar ofertas propias solo mientras estén disponibles", async () => {
      const id = await publicar();
      const args = { p_id: id, p_distrito: distrito, p_direccion: direccion, p_material: "Papel", p_cantidad: 3, p_unidad: "kg" };
      const intentoAjeno = await negocio.rpc("pc2_editar_oferta", args);
      sinError(intentoAjeno.error, "Comprobar que no se modifica una oferta ajena");
      expect(intentoAjeno.data).toBe(false);
      const editada = await hogar.rpc("pc2_editar_oferta", args);
      sinError(editada.error, "Editar la publicación propia");
      expect(editada.data).toBe(true);
      const consulta = await hogar.from("pc2_ofertas").select("material, cantidad, estado").eq("id", id).single();
      sinError(consulta.error, "Consultar la edición");
      expect(consulta.data).toEqual({ material: "Papel", cantidad: 3, estado: "disponible" });
      expect(await cambiar(hogar, "pc2_cancelar_oferta", id)).toBe(true);
      expect((await estado(id)).estado).toBe("cancelado");
      expect(await cambiar(recolector1, "pc2_aceptar_recojo", id)).toBe(false);

      const tomado = await publicar();
      expect(await cambiar(recolector1, "pc2_aceptar_recojo", tomado)).toBe(true);
      const intentoOcupado = await hogar.rpc("pc2_editar_oferta", { ...args, p_id: tomado });
      sinError(intentoOcupado.error, "Comprobar que una oferta aceptada no se edita");
      expect(intentoOcupado.data).toBe(false);
      expect(await cambiar(hogar, "pc2_cancelar_oferta", tomado)).toBe(false);
      expect((await estado(tomado)).estado).toBe("en_coordinacion");
    });

    it("PP-9 · el reporte filtra por fecha de cierre y distrito", async () => {
      const zona = `${distrito} reportes`;
      const id = await publicar(zona);
      await publicar(zona);
      await cerrar(id);
      const cierre = await estado(id);
      const formato = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima", dateStyle: "short" });
      const fecha = formato.format(new Date(cierre.finalizado_en));
      const args = { p_desde: fecha, p_hasta: fecha, p_distrito: zona, p_pagina: 1 };
      const ajeno = await hogar.rpc("pc2_reporte_reciclaje", args);
      expect(ajeno.error?.code).toBe("42501");
      const consulta = await negocio.rpc("pc2_reporte_reciclaje", args);
      sinError(consulta.error, "Consultar recojos completados");
      expect(consulta.data.total).toBe(1);
      expect(consulta.data.recojos).toEqual([expect.objectContaining({ id })]);
      expect(consulta.data.recojos[0]).not.toHaveProperty("direccion");
      const otroDia = await negocio.rpc("pc2_reporte_reciclaje", { ...args, p_desde: "2000-01-01", p_hasta: "2000-01-01" });
      sinError(otroDia.error, "Consultar un periodo sin cierres");
      expect(otroDia.data.total).toBe(0);
    });

    it("PP-17 · suma cantidades recuperadas por material y unidad", async () => {
      const zona = `${distrito} totales`;
      await cerrar(await publicar(zona, 2, "kg"));
      await cerrar(await publicar(zona, 3.5, "kg"));
      await cerrar(await publicar(zona, 4, "unidades"));
      await publicar(zona, 100, "kg");
      const consulta = await negocio.rpc("pc2_reporte_reciclaje", { p_distrito: zona });
      sinError(consulta.error, "Consultar los totales recuperados");
      expect(consulta.data.total).toBe(3);
      expect(consulta.data.recuperado).toEqual([
        { material: "Vidrio", unidad: "kg", cantidad: 5.5 },
        { material: "Vidrio", unidad: "unidades", cantidad: 4 },
      ]);
    });
  },
);

