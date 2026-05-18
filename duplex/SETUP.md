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

## 2.2. Migración 003 — renombre de hitos

Si ya corriste `migration_002` cuando los nombres decían
"a mitad de obra", corre también
[`migration_003_milestone_names.sql`](./migration_003_milestone_names.sql)
para actualizar los nombres a la lógica correcta:

- Hito 1 (50%) → al iniciar la obra (compra de materiales)
- Hito 2 (30%) → **cuando la obra esté al 80%** (antes decía "a mitad")
- Hito 3 (20%) → al entregar la obra al 100%

Por qué: pagar el 30% a mitad de obra acumularía 80% pagado
por solo 50% de trabajo terminado. Mejor liberar el 30% al
80% de avance real.

Esta migración solo cambia los nombres. No toca progreso ni
historial. Idempotente.

## 2.3. Migración 004 — tareas bajo hitos

Si ya tienes la base sembrada, corre
[`migration_004_tasks.sql`](./migration_004_tasks.sql)
para agregar la tabla `duplex_tasks` con las 30 tareas del contrato
distribuidas bajo los 3 hitos:

- Hito 1 (Entrada 50%) → 11 tareas grueso/materiales
- Hito 2 (Avance intermedio 30%) → 15 tareas instalaciones/acabados
- Hito 3 (Finalización 20%) → 4 tareas de cierre

Ahora cada tarea tiene 3 estados (Pendiente / En progreso / Terminado).
El avance del hito = promedio de sus tareas. El "pago ganado" del hito
= costo del hito × ese avance derivado.

Idempotente. La distribución de tareas se puede editar después
modificando el SQL o directamente en Supabase.

## 2.4. Migración 005 — tareas con weight + base unificado

Si ya corriste `migration_004` con las 30 tareas bajo 3 hitos, corre
también [`migration_005_weighted_tasks.sql`](./migration_005_weighted_tasks.sql).

Cambio importante:

- Las 30 tareas dejan de estar bajo 3 hitos. Ahora cuelgan de UNA
  sola partida "Contrato base completo" (L 392,500).
- Cada tarea tiene un **weight** (precio estimado del contratista)
  usado solo para calcular el % de avance ponderado.
- El esquema 50/30/20 ya no son items billables — queda solo como
  descripción del grupo.
- Cada tarea tiene slider 0-100% (en lugar de 3 botones), para
  marcar exactamente el avance de cada trabajo.

Pesos suman ~L 428,000 (estimados aproximados), pero el "pago ganado"
del base se calcula como `L 392,500 × avance_ponderado / 100`. El
contrato real sigue siendo L 392,500.

Idempotente. Resetea el progreso de las tareas (cambio estructural).
Las adiciones (B/C) no se tocan.

## 3. Primera carga

Al abrir la página por primera vez después del setup, el frontend
detecta que las tablas están vacías y **siembra automáticamente** las
22 partidas del PDF base + las 9 partidas de adiciones (mensajes 1 y 2).
No tienes que hacer nada manual.

## 4. Limpiar los datos viejos del navegador (opcional)

Si antes usabas la página con `localStorage`, ese estado ya no se usa.
Lo puedes borrar en DevTools → Application → Local Storage →
borra la clave `remodelacion_duplex_yoro_v1`. (No es obligatorio, no estorba.)
