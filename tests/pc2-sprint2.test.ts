import { describe, expect, it } from "vitest";
import { esSlugPunto, leerPunto } from "../src/features/acopio/gestion-modelo";
import { leerOferta } from "../src/features/ofertas/modelo";

function datos(entradas: Record<string, string>) {
  const form = new FormData();
  for (const [nombre, valor] of Object.entries(entradas)) form.set(nombre, valor);
  return form;
}

describe("PP-10 · Datos de acopio", () => {
  it("acepta un punto válido y elimina materiales duplicados", () => {
    expect(leerPunto(datos({
      nombre: "Acopio Surco", distrito: "Surco", direccion: "Av. de prueba 200",
      horario: "Lunes 9:00", materiales: "Papel, Vidrio, Papel",
    }))?.materiales).toEqual(["Papel", "Vidrio"]);
  });

  it("rechaza identificadores con rutas y puntos incompletos", () => {
    expect(esSlugPunto("../punto")).toBe(false);
    expect(leerPunto(datos({ nombre: "Acopio" }))).toBeNull();
  });
});

describe("PP-11 · Publicación de material", () => {
  const base = { distrito: "Villa El Salvador", direccion: "Av. de prueba 123", material: "Vidrio", unidad: "kg" };

  it("acepta una cantidad aproximada en kilogramos", () => {
    expect(leerOferta(datos({ ...base, cantidad: "2.50" }))?.cantidad).toBe(2.5);
  });

  it.each(["0", "-2", "1e2", "2.001", ""])("rechaza la cantidad %s", (cantidad) => {
    expect(leerOferta(datos({ ...base, cantidad }))).toBeNull();
  });

  it("rechaza unidades fraccionarias y materiales fuera del catálogo", () => {
    expect(leerOferta(datos({ ...base, unidad: "unidades", cantidad: "1.5" }))).toBeNull();
    expect(leerOferta(datos({ ...base, material: "Otro", cantidad: "2" }))).toBeNull();
  });
});

