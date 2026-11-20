-- Datos ficticios para probar la búsqueda y las fichas. Ejecutar después de la migración.
insert into public.pc2_puntos_acopio
  (slug, nombre, distrito, direccion, horario, materiales, activo, es_demostracion)
values
  ('demo-ves-papel', 'Punto demo Villa El Salvador', 'Villa El Salvador',
   'Dirección de ejemplo A', 'Lunes a viernes, 09:00–16:00', array['Papel','Cartón','Plástico'], true, true),
  ('demo-ves-vidrio', 'Punto demo Vidrio y Metal', 'Villa El Salvador',
   'Dirección de ejemplo B', 'Sábado, 09:00–13:00', array['Vidrio','Metal'], true, true),
  ('demo-surco', 'Punto demo Santiago de Surco', 'Santiago de Surco',
   'Dirección de ejemplo C', 'Martes y jueves, 10:00–15:00', array['Papel','Cartón','Aparatos electrónicos'], true, true),
  ('demo-inactivo', 'Punto demo inactivo', 'Villa El Salvador',
   'Dirección de ejemplo D', 'Fuera de servicio', array['Vidrio'], false, true)
on conflict (slug) do nothing;

