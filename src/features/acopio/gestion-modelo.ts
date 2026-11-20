export function esSlugPunto(slug: string) {
  return slug.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function leerPunto(form: FormData) {
  const nombre = String(form.get("nombre") ?? "").trim();
  const distrito = String(form.get("distrito") ?? "").trim();
  const direccion = String(form.get("direccion") ?? "").trim();
  const horario = String(form.get("horario") ?? "").trim();
  const materiales = [...new Set(String(form.get("materiales") ?? "").split(",").map((value) => value.trim()).filter(Boolean))];

  if (nombre.length < 2 || nombre.length > 120 || distrito.length < 2 || distrito.length > 80) return null;
  if (direccion.length < 5 || direccion.length > 200 || horario.length < 3 || horario.length > 160) return null;
  if (materiales.length === 0 || materiales.length > 15 || materiales.some((material) => material.length > 80)) return null;

  return { nombre, distrito, direccion, horario, materiales };
}

