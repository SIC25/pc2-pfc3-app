export const roles = {
  hogar: { nombre: "Hogar", mensaje: "Consulta dónde entregar los reciclables de tu hogar." },
  negocio: { nombre: "Negocio", mensaje: "Encuentra puntos para entregar los reciclables de tu negocio." },
  recolector: { nombre: "Recolector", mensaje: "Consulta el directorio desde tu perfil de recolector." },
} as const;

export type Rol = keyof typeof roles;

export function esRol(value: unknown): value is Rol {
  return typeof value === "string" && Object.hasOwn(roles, value);
}

export function validarRegistro(form: FormData) {
  const nombre = String(form.get("nombre") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rol = form.get("rol");
  if (nombre.length < 2 || nombre.length > 100) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (password.length < 8 || password.length > 72 || !esRol(rol)) return null;
  return { nombre, email, password, rol };
}

