import type { MaterialOferta } from "@/features/ofertas/modelo";
import { cantidadLocal } from "@/features/ofertas/recojos-modelo";

export function MaterialesLista({ items }: { items: MaterialOferta[] }) {
  return (
    <ul className="pc2-material-list" aria-label="Materiales y cantidades">
      {items.map((item) => (
        <li key={`${item.material}-${item.unidad}`}>
          <span>{item.material}</span>
          <strong>{cantidadLocal.format(item.cantidad)} {item.unidad}</strong>
        </li>
      ))}
    </ul>
  );
}

