# Revision del compose existente y brechas

Fecha: 2026-04-25
Responsable: Natalia

## Resumen corto
Se reviso el compose existente y se comparo con los criterios de la historia. Se encontraron brechas relacionadas con ubicacion del compose, servicios requeridos y env.example en la raiz. Se propuso/ejecuto un compose en raiz con backend, frontend y db para cerrar esas brechas.

## Archivos revisados
- backend/infra/docker/docker-compose.yml
- backend/.env.example
- frontend/.env.example

## Brechas identificadas (antes del ajuste)
- No existia docker-compose.yml en la raiz del repo.
- No habia servicio frontend ni un servicio llamado backend en el compose.
- El volumen nombrado era dbdata y no db-data.
- No existia .env.example en la raiz con variables del stack completo.

## Cambios minimos para cerrar brechas
- Se agrego compose en raiz con servicios backend, frontend y db.
- Se uso volumen nombrado db-data para persistencia.
- Se agrego .env.example en la raiz.

## Evidencia de validacion
- No se ejecuto docker compose up en esta revision.

## Riesgos / follow-ups
- Validar arranque desde cero con docker compose up y registrar logs.
- Confirmar que el frontend use la URL de integracion esperada.
