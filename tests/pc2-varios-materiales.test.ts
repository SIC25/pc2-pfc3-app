import { describe, expect, it } from "vitest";
import { leerPublicacion } from "../src/features/ofertas/modelo";

function publicacion(items: [string, string, string][]) {
  const form = new FormData();
  form.set("distrito", " Villa El Salvador ");
  form.set("direccion", " Dirección de prueba 123 ");
  for (const [material, cantidad, unidad] of items) {
    form.append("material", material);
    form.append("cantidad", cantidad);
    form.append("unidad", unidad);
  }
  return form;
}

describe("Publicaciones con varios materiales", () => {
  it("agrupa cada material y su unidad bajo una sola ubicación", () => {
    expect(leerPublicacion(publicacion([
      ["Papel", "2.50", "kg"], ["Vidrio", "3", "unidades"],
    ]))).toEqual({
      distrito: "Villa El Salvador", direccion: "Dirección de prueba 123",
      materiales: [
        { material: "Papel", cantidad: 2.5, unidad: "kg" },
        { material: "Vidrio", cantidad: 3, unidad: "unidades" },
      ],
    });
  });

  it("conserva la publicación de un solo material", () => {
    expect(leerPublicacion(publicacion([["Metal", "2", "kg"]]))?.materiales).toHaveLength(1);
  });

  it("rechaza la publicación completa si una de sus filas es inválida", () => {
    expect(leerPublicacion(publicacion([
      ["Papel", "2", "kg"], ["Vidrio", "0.5", "unidades"],
    ]))).toBeNull();
  });

  it("rechaza materiales duplicados con la misma unidad", () => {
    expect(leerPublicacion(publicacion([
      ["Papel", "2", "kg"], ["Papel", "3", "kg"],
    ]))).toBeNull();
    expect(leerPublicacion(publicacion([
      ["Papel", "2", "kg"], ["Papel", "3", "unidades"],
    ]))?.materiales).toHaveLength(2);
  });

  it("rechaza filas desalineadas y envíos vacíos", () => {
    const form = publicacion([["Papel", "2", "kg"]]);
    form.delete("unidad");
    expect(leerPublicacion(form)).toBeNull();
    expect(leerPublicacion(publicacion([]))).toBeNull();
  });
});

