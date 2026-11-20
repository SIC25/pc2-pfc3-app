import Link from "next/link";
import { Marco, boton, campo, enlace } from "@/components/pc2-marco";
import { registrar } from "@/features/acceso/actions";
import { roles } from "@/features/acceso/modelo";

export const instant = false;

export default async function Registro({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  return (
    <Marco titulo="Crear cuenta" descripcion="Elige el perfil que corresponde a tu actividad." variant="compacta">
      {estado && (
        <p role="alert" className="pc2-alert" data-kind="error">
          {estado === "datos" ? "Revisa el correo, el nombre, la contraseña y el perfil." :
            estado === "limite" ? "Se alcanzó el límite temporal de intentos. Inténtalo más tarde." :
            "No se pudo completar el registro. Revisa los datos e inténtalo de nuevo."}
        </p>
      )}
      <form action={registrar} className="pc2-panel pc2-form pc2-form-narrow space-y-4">
        <label className="block">Nombre <input name="nombre" autoComplete="name" minLength={2} maxLength={100} required className={campo} /></label>
        <label className="block">Correo <input name="email" type="email" autoComplete="email" maxLength={254} required className={campo} /></label>
        <label className="block">Contraseña (8 a 72 caracteres)
          <input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className={campo} />
        </label>
        <label className="block">Tipo de perfil
          <select name="rol" defaultValue="" required className={campo}>
            <option value="" disabled>Selecciona un perfil</option>
            {Object.entries(roles).map(([id, rol]) => <option key={id} value={id}>{rol.nombre}</option>)}
          </select>
        </label>
        <button type="submit" className={`${boton} w-full`}>Registrarme</button>
      </form>
      <p className="mt-5 text-center">¿Ya tienes cuenta? <Link href="/ingresar" className={enlace}>Inicia sesión</Link></p>
    </Marco>
  );
}


