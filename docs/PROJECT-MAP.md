# AG Legal — mapa del proyecto

Actualizado: 2026-08-15

## Arquitectura

| Capa | Implementación |
| --- | --- |
| Web y API | Next.js 16 App Router, React 19 y TypeScript |
| Persistencia | PostgreSQL `aglegal_db`, Drizzle ORM y migraciones versionadas |
| Correo | SMTP TLS de HostDime; buzón y remitente `aglegal@restaurar.co` |
| Producción | PM2 `aglegal` en `127.0.0.1:4009`, publicado por Caddy |
| Dominio | `https://aglegal.restaurar.co` |

## Rutas y contratos

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/` | Pública | Landing original y formulario de revisión |
| `POST /api/solicitudes` | Pública, mismo origen | Valida, limita abuso, persiste y notifica una solicitud |
| `/panel/login` | Pública | Inicio de sesión del administrador único |
| `/panel` | Sesión válida en servidor | Tabla paginada con los datos enviados en el formulario |
| `POST /api/auth/login` | Pública, mismo origen | Verifica Argon2id, límites por IP/cuenta y crea sesión opaca |
| `POST /api/auth/logout` | Sesión/mismo origen | Revoca la sesión y elimina la cookie |
| `GET /api/health` | Pública | Comprueba proceso y conexión a PostgreSQL |

## Datos

- `solicitudes`: nombre, celular, ciudad, año del crédito, consentimiento, fecha y estado interno del correo.
- `sesiones_administrador`: solo hashes del token, IP y agente de usuario; nunca almacena el token en claro.
- `limites_peticion`: contadores atómicos de abuso con caducidad.
- `eventos_seguridad`: auditoría mínima de intentos de acceso, sin IP en claro.

Los únicos datos visibles en `/panel` son los recibidos en el formulario y su fecha. Los campos técnicos no se muestran.

## Flujos críticos

1. El navegador valida el formulario y envía JSON al mismo origen.
2. El servidor valida origen, tamaño, esquema, honeypot, tiempo de llenado y límites.
3. PostgreSQL guarda la solicitud antes de intentar el correo; un fallo del proveedor no pierde el registro.
4. El panel valida la cookie `HttpOnly`, el token opaco almacenado como HMAC, la caducidad y el navegador asociado.
5. Un login correcto invalida cualquier sesión administrativa anterior.

## Operación

- `pnpm db:migrate`: aplica migraciones.
- `pnpm typecheck && pnpm lint && pnpm build`: verificación previa.
- `./deploy.sh`: actualización, migración, build, recarga PM2 y healthcheck.
- Secretos: únicamente en `/var/www/aglegal/.env` con permisos `600` y en GitHub Actions.
