# Dominó CUM 74 – Migración a PostgreSQL autogestionado

## Objetivos
- Consolidar todos los datos en el PostgreSQL del VPS (`185.211.4.129:5432`, BD `dominocum74`).
- Mantener la funcionalidad actual (gestión de jugadores, veladas, mesas, manos, anécdotas, asistencia) con baja latencia para dispositivos móviles.
- Ejecutar un backend propio (Node + Fastify) empaquetado en Docker y supervisado por systemd/Compose.
- Asegurar que los registros históricos (jugadores, estadísticas, anécdotas) residan únicamente en PostgreSQL y cuenten con respaldos periódicos.

## Arquitectura destino
1. **Base de datos PostgreSQL** (ver `server/db/schema.sql`).
   - Tablas principales: `players`, `games`, `game_tables`, `game_pairs`, `game_pair_players`.
   - Dominio de partidas: `game_partidas`, `game_hands`, `game_partida_snapshots`.
   - Contexto adicional: `anecdotes`, `game_attendance` (check-in/out por jugador).
   - Trigger `set_updated_at()` mantiene `updated_at` sincronizado en cada tabla.

2. **Backend Fastify** (`server/`).
   - Rutas en `src/routes/*.js` cubren jugadores, juegos, mesas, manos, anécdotas, asistencia y snapshots.
   - Servicios (`gamesService`, `gameMutationsService`, `attendanceService`, `playersService`) encapsulan la lógica de negocio.
   - Autenticación por encabezado `x-api-key`.

3. **Contenedores & systemd**.
   - `server/Dockerfile`, `docker-compose.api.yml` y `deploy/domino74-api.service` levantan `domino74-api` apuntando al PostgreSQL externo.

4. **Frontend**.
   - `src/lib/apiClient.js` centraliza las llamadas autenticadas con `x-api-key`.
   - `mediaStorage` y `pdfGenerator` consumen los endpoints `/uploads` del backend para almacenar y recuperar archivos locales.
   - Hooks y helpers (`src/lib/gameActions.js`, `src/lib/players.js`, vistas en `pages/*`) interactúan exclusivamente con la API Fastify.

## Plan de trabajo
1. **Esquema PostgreSQL** ✅
   - `schema.sql` listo. Ejecutar con `psql "$DATABASE_URL" -f server/db/schema.sql` cuando sea necesario.

2. **Backend** ✅
   - Fastify + Zod + pool `pg` configurados.
   - Endpoints para jugadores, juegos, mesas, manos, anécdotas, asistencia y snapshots entregados.

3. **Docker/systemd** ✅
   - Imagen Docker funcional y unidad `domino74-api.service` documentada.

4. **Migración de datos** ✅
   - Los datos definitivos (jugadores, juegos y anécdotas) ya residen en PostgreSQL; el script `server/scripts/migratePlayers.js` se eliminó tras completar la importación final.
   - Si se requiere una nueva carga desde respaldos legados, importar el dump SQL directamente en PostgreSQL en lugar de reactivar conectores externos.

5. **Frontend** ✅
   - `apiClient` orquesta headers, manejo de errores y reintentos.
   - `src/lib/gameActions.js`, `src/lib/gameMutations/*`, `lib/players.js` y helpers se conectan al backend.
   - `.env` ahora requiere `VITE_API_BASE_URL` y `VITE_API_KEY`.

6. **Despliegue** (en curso)
   - `scripts/deploy.sh` publica la SPA en Nginx.
   - Falta documentar/automatizar la publicación del backend vía Docker + systemd (ver sección Deploy).

## API REST expuesta

Todas las rutas requieren el encabezado `x-api-key: <API_KEY>`.

- `GET /health`.
- **Jugadores**: `GET/POST /players`, `GET/PUT/DELETE /players/:id`.
- **Juegos**: `GET /games`, `GET /games/active`, `GET /games/:id`, `POST /games`, `PUT /games/:id`, `DELETE /games/:id`, `PATCH /games/:id/status`.
- **Mesas y parejas**: `POST /games/:id/tables`, `PATCH /tables/:id/pairs`, `DELETE /tables/:id`.
- **Manos**: `POST /tables/:id/hands`, `PATCH /hands/:id`.
- **Partidas**: `POST /tables/:id/finalize` (cierra partida y suma juegos ganados).
- **Anécdotas**: `POST /games/:id/anecdotes`, `PATCH /anecdotes/:id`, `DELETE /anecdotes/:id`.
- **Asistencia**: `GET /games/:id/attendance`, `POST /games/:id/attendance/check-in`, `POST /games/:id/attendance/check-out`, `POST /games/:id/attendance/backfill`.
- **Snapshots**: `POST /games/:id/snapshots`, `GET /games/:id/snapshots`.
- **Uploads**: `POST /uploads` (multipart/form-data con campo `file`), `DELETE /uploads` (body con `publicUrl`).

## Variables de entorno

### Backend (`server/.env`)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL completa. |
| `API_KEY` | Clave compartida para validar `x-api-key`. |
| `DEFAULT_TZ` | Zona horaria usada en `src/utils/dates.js` (`America/Merida` por defecto). |
| `PORT` / `HOST` | Puerto y host donde escuchará Fastify (`4000` / `0.0.0.0` por defecto). |
| `ENABLE_CORS` | Cualquier valor distinto de `0` habilita CORS (útil para desarrollo local). |
| `PGSSL` | Configura `ssl` en el pool cuando vale `1`. |
| `PG_POOL_MAX` | Número máximo de conexiones simultáneas del pool (`10` por defecto). |

### Frontend (`.env`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL absoluta del backend (por ejemplo `https://api.dominocum74.top`). |
| `VITE_API_KEY` | Misma clave configurada en el backend; se envía en cada petición. |

## Pendientes inmediatos
- [ ] Respaldar y monitorear la carpeta `uploads/` del backend (mismo ciclo de backups que la base de datos).
- [ ] Automatizar despliegue del backend (`docker compose up -d` + systemd) junto al frontend estático.
- [ ] Documentar rollback y monitoreo de `domino74-api.service`.

### Notas de migración recientes
- **2025-12-04**: Se añadieron los campos opcionales `location_name` y `location_details` a `games` para almacenar lugar/preparativos de la velada. Ejecuta:
   ```sql
   ALTER TABLE games ADD COLUMN IF NOT EXISTS location_name TEXT;
   ALTER TABLE games ADD COLUMN IF NOT EXISTS location_details TEXT;
   ```
   antes de desplegar el backend actualizado.

```
