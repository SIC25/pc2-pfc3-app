import { describe, expect, it } from "vitest";
import { esRol, validarRegistro } from "../src/features/acceso/modelo";

describe("PP-6 · Registro de participante", () => {
  function registro(rol: string, email = "demo@ejemplo.com", password = "Ejemplo-123") {
    const form = new FormData();
    form.set("nombre", " Ana Vega ");
    form.set("email", email);
    form.set("password", password);
    form.set("rol", rol);
    return validarRegistro(form);
  }

  it.each(["hogar", "negocio", "recolector"])("admite el perfil %s", (rol) => {
    expect(registro(rol)).toMatchObject({ nombre: "Ana Vega", rol });
  });

  it("rechaza roles ajenos al catálogo", () => {
    expect(registro("admin")).toBeNull();
    expect(esRol("constructor")).toBe(false);
  });

  it("rechaza correo inválido y contraseña breve", () => {
    expect(registro("hogar", "sin-arroba")).toBeNull();
    expect(registro("hogar", "demo@ejemplo.com", "123")).toBeNull();
  });
});

