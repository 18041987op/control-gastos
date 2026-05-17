# Dúplex Yoro · Setup en Supabase

Pasos de una sola vez para que la página del dúplex use Supabase
en lugar de `localStorage`.

## 1. Crear tablas y bucket (1 minuto)

1. Abre el SQL Editor de tu Supabase de gastos:
   https://supabase.com/dashboard/project/ozfmydiutupboupttkmz/sql/new
2. Copia **todo** el contenido de [`schema.sql`](./schema.sql)
3. Pega y dale **Run**

Eso crea:

- Tablas `duplex_groups`, `duplex_items`, `duplex_payments`,
  `duplex_progress_log`, `duplex_progress_images`, `duplex_meta`
- Bucket de Storage `duplex-progress` (público) con políticas
- Suscripción Realtime para que dueño y contratista vean cambios al instante

## 2. PINs

- **1987** → dueño (acceso total: editar presupuesto, registrar pagos, ajustar avance)
- **2026** → contratista (solo puede registrar avance + subir fotos)

Para cambiar el PIN del contratista, edita la línea
`const CONTRACTOR_PIN` arriba del `<script>` principal en `duplex/index.html`.

## 2.1. Migración 002 — base como 3 hitos

Si ya corriste `schema.sql` antes del cambio a "3 hitos", también corre
[`migration_002_base_milestones.sql`](./migration_002_base_milestones.sql)
en el mismo SQL Editor.

Esa migración borra las 22 partidas inventadas del PDF base y las
reemplaza por las 3 partidas reales del contrato:

- Entrada (50%) — L 196,250
- Evaluación de avance (30%) — L 117,750
- Finalización (20%) — L 78,500

Total: L 392,500. Las adiciones (B y C) no se tocan.

Si **nunca** corriste el `schema.sql` viejo, salta este paso —
el `schema.sql` actual ya siembra las 3 hitos correctas.

## 3. Primera carga

Al abrir la página por primera vez después del setup, el frontend
detecta que las tablas están vacías y **siembra automáticamente** las
22 partidas del PDF base + las 9 partidas de adiciones (mensajes 1 y 2).
No tienes que hacer nada manual.

## 4. Limpiar los datos viejos del navegador (opcional)

Si antes usabas la página con `localStorage`, ese estado ya no se usa.
Lo puedes borrar en DevTools → Application → Local Storage →
borra la clave `remodelacion_duplex_yoro_v1`. (No es obligatorio, no estorba.)
