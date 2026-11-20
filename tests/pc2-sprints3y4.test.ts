import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aceptarRecojo,
  cancelarPublicacion,
  editarPublicacion,
  finalizarRecojo,
} from "../src/features/ofertas/recojos-actions";
import {
  cantidadLocal,
  esFechaReporte,
  estadoOferta,
  fechaLima,
  idOferta,
  numeroPagina,
} from "../src/features/ofertas/recojos-modelo";

const mocks = vi.hoisted(() => ({
  obtenerPerfil: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/features/acceso/perfil", () => ({ obtenerPerfil: mocks.obtenerPerfil }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));

const id = "123e4567-e89b-12d3-a456-426614174000";

function formulario(campos: Record<string, string> = {}) {
  const form = new FormData();
  form.set("id", id);
  for (const [campo, valor] of Object.entries(campos)) form.set(campo, valor);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.obtenerPerfil.mockResolvedValue({ rol: "recolector" });
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});

describe("Sprint 3 · Coordinación y cierre", () => {
  it("PP-14 · envía el ID de una oferta válida para aceptar el recojo", async () => {
    await expect(aceptarRecojo(formulario())).rejects.toThrow("/mi-cuenta/mis-recojos?estado=aceptado");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("pc2_aceptar_recojo", { p_id: id });
  });

  it("PP-14 · informa si la oferta ya fue tomada", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(aceptarRecojo(formulario())).rejects.toThrow("/mi-cuenta/ofertas?estado=no-disponible");
  });

  it("PP-14 · rechaza un ID inválido antes de consultar la base", async () => {
    expect(idOferta(id)).toBe(id);
    await expect(aceptarRecojo(formulario({ id: "../oferta" }))).rejects.toThrow("/mi-cuenta/ofertas?estado=datos");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("PP-15 · muestra las etiquetas de los cuatro estados de una publicación", () => {
    expect(estadoOferta).toEqual({
      disponible: "Disponible",
      en_coordinacion: "En coordinación",
      recogido: "Recogido",
      cancelado: "Cancelado",
    });
  });

  it("PP-16 · llama a la operación de cierre para un recolector", async () => {
    await expect(finalizarRecojo(formulario())).rejects.toThrow("/mi-cuenta/mis-recojos?estado=finalizado");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("pc2_finalizar_recojo", { p_id: id });
  });

  it("PP-16 · rechaza el cierre desde una cuenta Hogar antes de consultar la base", async () => {
    mocks.obtenerPerfil.mockResolvedValue({ rol: "hogar" });
    await expect(finalizarRecojo(formulario())).rejects.toThrow("/mi-cuenta?estado=acceso-denegado");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("Sprint 4 · Publicaciones y reportes", () => {
  const oferta = {
    distrito: "Villa El Salvador", direccion: "Dirección de prueba 170",
    material: "Vidrio", cantidad: "2.50", unidad: "kg",
  };

  it("PP-12 · prepara los datos de edición con cantidad numérica", async () => {
    mocks.obtenerPerfil.mockResolvedValue({ rol: "negocio" });
    await expect(editarPublicacion(formulario(oferta))).rejects.toThrow("/mi-cuenta/mis-publicaciones?estado=editado");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("pc2_editar_materiales", {
      p_id: id, p_distrito: oferta.distrito, p_direccion: oferta.direccion,
      p_materiales: [{ material: oferta.material, cantidad: 2.5, unidad: oferta.unidad }],
    });
  });

  it("PP-12 · rechaza editar con cantidad cero antes de consultar la base", async () => {
    mocks.obtenerPerfil.mockResolvedValue({ rol: "hogar" });
    await expect(editarPublicacion(formulario({ ...oferta, cantidad: "0" })))
      .rejects.toThrow(`/mi-cuenta/mis-publicaciones?editar=${id}&estado=datos`);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("PP-12 · exige confirmar la cancelación", async () => {
    mocks.obtenerPerfil.mockResolvedValue({ rol: "hogar" });
    await expect(cancelarPublicacion(formulario())).rejects.toThrow("/mi-cuenta/mis-publicaciones?estado=datos");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("PP-12 · cancela con confirmación y responde a una oferta ya aceptada", async () => {
    mocks.obtenerPerfil.mockResolvedValue({ rol: "hogar" });
    await expect(cancelarPublicacion(formulario({ confirmar: "si" })))
      .rejects.toThrow("/mi-cuenta/mis-publicaciones?estado=cancelado");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("pc2_cancelar_oferta", { p_id: id });

    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(cancelarPublicacion(formulario({ confirmar: "si" })))
      .rejects.toThrow("/mi-cuenta/mis-publicaciones?estado=no-disponible");
  });

  it("PP-9 · admite fechas ISO reales y rechaza fechas inexistentes", () => {
    expect(esFechaReporte("2024-02-29")).toBe(true);
    expect(esFechaReporte("2026-02-29")).toBe(false);
    expect(esFechaReporte("30/11/2026")).toBe(false);
  });

  it("PP-9 · usa la fecha de Lima al cruzar medianoche UTC", () => {
    const partes = fechaLima.formatToParts(new Date("2026-11-20T02:00:00Z"));
    expect(partes.find((parte) => parte.type === "day")?.value).toBe("19");
  });

  it("PP-9 · normaliza el número de página", () => {
    expect(numeroPagina("3")).toBe(3);
    expect(numeroPagina("-2")).toBe(1);
    expect(numeroPagina("999999")).toBe(100000);
  });

  it("PP-17 · conserva dos decimales al mostrar una cantidad recuperada", () => {
    const partes = cantidadLocal.formatToParts(2.75);
    expect(partes.find((parte) => parte.type === "fraction")?.value).toBe("75");
  });
});

