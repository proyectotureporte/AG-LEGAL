# Seguridad de AG Legal

## Controles aplicados

- Contraseña almacenada exclusivamente como hash Argon2id de coste alto.
- Sesiones opacas aleatorias; en la base solo existe su HMAC SHA-256.
- Cookie `HttpOnly`, `Secure`, `SameSite=Strict`, prefijo `__Host-` y ocho horas de vida.
- Una sola sesión administrativa activa, ligada al agente de usuario y validada en servidor en cada carga.
- Panel sin endpoint público de lectura y con respuestas `no-store`/`noindex`.
- Mutaciones JSON restringidas al mismo origen, con comprobación de `Origin` y `Sec-Fetch-Site`.
- Rate limiting persistente y atómico para login y formulario.
- Validación Zod, límites de tamaño, honeypot y control de tiempo mínimo de llenado.
- Consultas parametrizadas mediante Drizzle/pg y salida escapada por React.
- CSP con nonce, bloqueo de iframes, HSTS, `nosniff`, política de referentes y permisos mínimos.
- Rechazo temprano de `Next-Action`: la app no usa Server Actions y no expone su decodificador.
- Secretos fuera de Git y aplicación enlazada solo a `127.0.0.1`; Caddy es la única entrada pública.

## Límites conscientes

Ningún sistema puede prometer invulnerabilidad absoluta. La seguridad depende también de mantener actualizado Node/Next.js, rotar la contraseña temporal, proteger la cuenta de GitHub/DNS/VPS con MFA y revisar periódicamente logs y dependencias.

## Rotación del acceso

Generar un hash Argon2id fuera del repositorio, reemplazar `ADMIN_PASSWORD_HASH` en el `.env` privado y recargar el proceso. Nunca guardar la contraseña en scripts, commits o documentación.
