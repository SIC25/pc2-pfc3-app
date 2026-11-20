"use client";

import { useEffect, useRef, useState } from "react";
import { materiales, maxMateriales, unidades, type MaterialOferta } from "@/features/ofertas/modelo";

type Fila = { id: number; valor?: MaterialOferta };

export function MaterialesCampos({ inicial = [] }: { inicial?: MaterialOferta[] }) {
  const siguiente = useRef(Math.max(1, inicial.length));
  const agregarBoton = useRef<HTMLButtonElement>(null);
  const selects = useRef(new Map<number, HTMLSelectElement>());
  const enfocar = useRef<number | null>(null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    inicial.length ? inicial.map((valor, id) => ({ id, valor })) : [{ id: 0 }],
  );

  useEffect(() => {
    if (enfocar.current === null) return;
    selects.current.get(enfocar.current)?.focus();
    enfocar.current = null;
  }, [filas]);

  function agregar() {
    if (filas.length >= maxMateriales) return;
    const id = siguiente.current++;
    enfocar.current = id;
    setFilas((actuales) => [...actuales, { id }]);
  }

  function quitar(id: number) {
    setFilas((actuales) => actuales.filter((fila) => fila.id !== id));
    agregarBoton.current?.focus();
  }

  return (
    <section className="pc2-material-fields" aria-label="Materiales de la publicación">
      <div className="pc2-section-heading">
        <h2>Materiales</h2>
        <p>Añade cada tipo con su cantidad y unidad.</p>
      </div>
      <div className="pc2-material-rows">
        {filas.map(({ id, valor }, index) => (
          <fieldset className="pc2-material-row" key={id}>
            <legend>Material {index + 1}</legend>
            <div className="pc2-material-grid">
              <label>Tipo de material
                <select className="pc2-field" name="material" defaultValue={valor?.material ?? ""} required
                  ref={(elemento) => {
                    if (elemento) selects.current.set(id, elemento);
                    else selects.current.delete(id);
                  }}>
                  <option value="" disabled>Selecciona un tipo</option>
                  {materiales.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Cantidad
                <input className="pc2-field" name="cantidad" type="number" min="0.01" max="9999999.99"
                  step="0.01" placeholder="0.00" defaultValue={valor?.cantidad} required />
              </label>
              <label>Unidad
                <select className="pc2-field" name="unidad" defaultValue={valor?.unidad ?? "kg"}>
                  {unidades.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            {filas.length > 1 && (
              <button type="button" className="pc2-remove" aria-label={`Quitar material ${index + 1}`}
                onClick={() => quitar(id)}>
                Quitar
              </button>
            )}
          </fieldset>
        ))}
      </div>
      <button ref={agregarBoton} type="button" className="pc2-button pc2-button-secondary"
        onClick={agregar} disabled={filas.length >= maxMateriales}>
        <span aria-hidden="true">＋</span> Agregar otro material
      </button>
    </section>
  );
}

