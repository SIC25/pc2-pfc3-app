export type EstadoOferta = "disponible" | "en_coordinacion" | "recogido" | "cancelado";

export const estadoOferta: Record<EstadoOferta, string> = {
  disponible: "Disponible",
  en_coordinacion: "En coordinación",
  recogido: "Recogido",
  cancelado: "Cancelado",
};

export function idOferta(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : null;
}

export function numeroPagina(valor: unknown) {
  if (typeof valor !== "string" || !/^\d{1,6}$/.test(valor)) return 1;
  return Math.max(1, Math.min(Number(valor), 100000));
}

export function esFechaReporte(valor: string) {
  if (!/^[2-9]\d{3}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(valor + "T00:00:00Z");
  return Number.isFinite(fecha.valueOf()) && fecha.toISOString().slice(0, 10) === valor;
}

export const fechaLima = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Lima",
});
export const cantidadLocal = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

