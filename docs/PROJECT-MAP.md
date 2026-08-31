# AG Legal — mapa del proyecto

Actualizado: 2026-08-31

## Arquitectura

| Capa | Implementación |
| --- | --- |
| Web y API | Next.js 16 App Router, React 19 y TypeScript |
| Diseño | Landing HTML en `src/content/landing.html`, sistema visual en `src/app/landing.css` y recursos oficiales optimizados en `public/images/aglegal/` |
| Persistencia | PostgreSQL `aglegal_db`, Drizzle ORM y migraciones versionadas |
| Correo | SMTP TLS de HostDime; buzón y remitente `aglegal@restaurar.co` |
| Producción | VPS Restaurar (`82.223.109.156`), PM2 `aglegal` en `127.0.0.1:3004`, publicado por Nginx |
| Dominio | `https://ag-legal.com.co` |

## Rutas y contratos

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/` | Pública | Landing institucional y formulario de revisión |
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

## Diseño público

- `docs/DESIGN.md` documenta los tokens, la tipografía, el motivo de marca y los componentes de la landing.
- Los recursos de identidad se sirven como WebP optimizados; el banner familiar prioritario pesa menos de 200 KB.
- El rediseño es exclusivamente visual: las clases e identificadores consumidos por `LandingInteractions` se mantienen estables.

## Operación

- `pnpm db:migrate`: aplica migraciones.
- `pnpm typecheck && pnpm lint && pnpm build`: verificación previa.
- `./deploy.sh`: actualización, migración, build, recarga PM2 y healthcheck.
- PostgreSQL en el VPS Restaurar autoriza cada pareja usuario/base explícitamente por TCP; AG Legal usa el socket local con SCRAM mediante `host=%2Fvar%2Frun%2Fpostgresql` y no modifica esa política global.
- Secretos: únicamente en `/var/www/aglegal/.env` con permisos `600` y en GitHub Actions.
- El CI despliega exclusivamente en el VPS Restaurar mediante una clave SSH restringida al comando de despliegue.
