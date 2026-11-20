export const materiales = ["Papel", "Cartón", "Plástico", "Vidrio", "Metal", "Aparatos electrónicos"] as const;
export const unidades = ["kg", "unidades"] as const;

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

