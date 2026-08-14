# AG Legal

Landing y panel privado para solicitudes de revisión de créditos UVR.

## Desarrollo

1. Copiar `.env.example` a `.env` y completar los valores privados.
2. Ejecutar `pnpm install` y `pnpm db:migrate`.
3. Iniciar con `pnpm dev`.

Verificación: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.

La arquitectura y los flujos críticos están documentados en `docs/PROJECT-MAP.md`; los controles de acceso están descritos en `docs/SECURITY.md`.
