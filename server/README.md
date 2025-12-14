# Dominó CUM 74 API

Backend Fastify + PostgreSQL autogestionado para el sistema de torneos.

## Desarrollo local

```bash
cd server
cp .env.example .env   # ajusta credenciales
npm install
npm run dev
```

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL. |
| `API_KEY` | Clave compartida validada en `x-api-key`. |
| `DEFAULT_TZ` | Zona horaria para normalizar fechas (`America/Merida`). |
| `PORT` / `HOST` | Puerto y host expuestos (defaults `4000` / `0.0.0.0`). |
| `ENABLE_CORS` | Usa `0` para desactivar CORS en producción si hay proxy. |
| `PGSSL` | Define si el pool usa TLS (`1` lo habilita). |
| `PG_POOL_MAX` | Conexiones máximas del pool (`10`). |
| `UPLOADS_DIR` | Ruta (absoluta o relativa) donde se guardan los archivos subidos (`uploads`). |
| `UPLOADS_BASE_PATH` | Prefijo público que expondrá Fastify para servir archivos (`/uploads`). |
| `UPLOADS_PUBLIC_BASE_URL` | Dominio/base absoluto para exponer uploads (ej. `https://api.dominocum74.top`). |
| `UPLOAD_MAX_BYTES` | Límite por archivo en bytes (por defecto `52428800`, es decir 50 MB). |

El servicio expone (todas requieren `x-api-key`):
- `GET /health`
- **Jugadores**: `GET/POST /players`, `GET/PUT/DELETE /players/:id`
- **Juegos**: `GET /games`, `GET /games/active`, `GET /games/:id`, `POST /games`, `PUT /games/:id`, `DELETE /games/:id`, `PATCH /games/:id/status`
- **Mesas y parejas**: `POST /games/:id/tables`, `PATCH /tables/:id/pairs`, `DELETE /tables/:id`
- **Manos**: `POST /tables/:id/hands`, `PATCH /hands/:id`
- **Partidas**: `POST /tables/:id/finalize`
- **Anécdotas**: `POST /games/:id/anecdotes`, `PATCH /anecdotes/:id`, `DELETE /anecdotes/:id`
- **Asistencia**: `GET /games/:id/attendance`, `POST /games/:id/attendance/check-in`, `POST /games/:id/attendance/check-out`, `POST /games/:id/attendance/backfill`
- **Snapshots**: `POST /games/:id/snapshots`, `GET /games/:id/snapshots`
- **Uploads**: `POST /uploads` (multipart con campo `file`), `DELETE /uploads` (body JSON con `publicUrl`)
- **Realtime**: `GET /games/:id/events` (WebSocket). Envía `?apiKey=` en la URL y recibirás eventos como `HAND_ADDED`, `TABLE_FINALIZED`, etc.

Todas las solicitudes deben incluir `x-api-key` con el valor configurado en `API_KEY`.

## Aplicar esquema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## Docker

```bash
docker build -t domino74-api .
docker run -p 4000:4000 \
  -e DATABASE_URL=postgresql://gaibarra:***@185.211.4.129:5432/dominocum74 \
  -e API_KEY=super-secret-key domino74-api
```

En producción utiliza `docker compose -f ../docker-compose.api.yml up -d --build` desde la raíz y controla el servicio con `deploy/domino74-api.service`.

````
