import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { ingresar } from "@/features/acceso/actions";

export const instant = false;

const mensajes = new Map([
  ["credenciales", "El correo o la contraseña no son válidos."],
  ["confirma", "Confirma el correo antes de iniciar sesión."],
  ["limite", "Se alcanzó el límite temporal de intentos. Inténtalo más tarde."],
  ["revisa-correo", "Revisa tu correo para confirmar la cuenta."],
  ["enlace-invalido", "El enlace de confirmación no es válido o ya venció."],
  ["sesion-cerrada", "Sesión cerrada."],
]);

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const mensaje = mensajes.get(estado ?? "");
  return (
    <Marco titulo="Iniciar sesión" descripcion="Ingresa para publicar materiales o coordinar un recojo." variant="compacta">
      {mensaje && <p role="status" className="pc2-alert">{mensaje}</p>}
      <form action={ingresar} className="pc2-panel pc2-form pc2-form-narrow space-y-4">
        <label className="block">Correo <input name="email" type="email" autoComplete="username" maxLength={254} required className={campo} /></label>
        <label className="block">Contraseña <input name="password" type="password" autoComplete="current-password" maxLength={72} required className={campo} /></label>
        <button type="submit" className={`${boton} w-full`}>Ingresar</button>
      </form>
      <p className="mt-5 text-center">¿Todavía no tienes cuenta? <Link href="/registro" className={enlace}>Regístrate</Link></p>
    </Marco>
  );
}


