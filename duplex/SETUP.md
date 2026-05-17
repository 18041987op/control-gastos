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

## 3. Primera carga

Al abrir la página por primera vez después del setup, el frontend
detecta que las tablas están vacías y **siembra automáticamente** las
22 partidas del PDF base + las 9 partidas de adiciones (mensajes 1 y 2).
No tienes que hacer nada manual.

## 4. Limpiar los datos viejos del navegador (opcional)

Si antes usabas la página con `localStorage`, ese estado ya no se usa.
Lo puedes borrar en DevTools → Application → Local Storage →
borra la clave `remodelacion_duplex_yoro_v1`. (No es obligatorio, no estorba.)
