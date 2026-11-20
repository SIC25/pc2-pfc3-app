export const materiales = ["Papel", "Cartón", "Plástico", "Vidrio", "Metal", "Aparatos electrónicos"] as const;
export const unidades = ["kg", "unidades"] as const;
export const maxMateriales = materiales.length * unidades.length;

export type MaterialOferta = { material: string; cantidad: number; unidad: string };

export function esMaterial(valor: string) {
  return materiales.some((material) => material === valor);
}

export function leerOferta(form: FormData) {
  const distrito = String(form.get("distrito") ?? "").trim();
  const direccion = String(form.get("direccion") ?? "").trim();
  const material = String(form.get("material") ?? "");
  const unidad = String(form.get("unidad") ?? "");
  const cantidadTexto = String(form.get("cantidad") ?? "").trim();
  const cantidad = Number(cantidadTexto);

  if (distrito.length < 2 || distrito.length > 80 || direccion.length < 5 || direccion.length > 200) return null;
  if (!esMaterial(material) || !unidades.some((item) => item === unidad)) return null;
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(cantidadTexto) || cantidad <= 0) return null;
  if (unidad === "unidades" && !Number.isInteger(cantidad)) return null;

  return { distrito, direccion, material, cantidad, unidad };
}

export function leerPublicacion(form: FormData) {
  const nombres = form.getAll("material");
  const cantidades = form.getAll("cantidad");
  const unidadesFila = form.getAll("unidad");
  if (!nombres.length || nombres.length > maxMateriales ||
      cantidades.length !== nombres.length || unidadesFila.length !== nombres.length) return null;

  const distrito = String(form.get("distrito") ?? "").trim();
  const direccion = String(form.get("direccion") ?? "").trim();
  const items: MaterialOferta[] = [];
  const claves = new Set<string>();
  for (let i = 0; i < nombres.length; i++) {
    const fila = new FormData();
    fila.set("distrito", distrito);
    fila.set("direccion", direccion);
    fila.set("material", nombres[i]);
    fila.set("cantidad", cantidades[i]);
    fila.set("unidad", unidadesFila[i]);
    const item = leerOferta(fila);
    if (!item) return null;
    const clave = `${item.material}:${item.unidad}`;
    if (claves.has(clave)) return null;
    claves.add(clave);
    items.push({ material: item.material, cantidad: item.cantidad, unidad: item.unidad });
  }
  return { distrito, direccion, materiales: items };
}

