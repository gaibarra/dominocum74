# Partidas, Hands y Snapshots (Notas SQL)

Estas migraciones son sugeridas; el código tolera su ausencia y funciona en modo "simple".

## Anécdotas con medios

Para permitir anécdotas con imágenes, audio o video se requieren columnas adicionales en `public.anecdotes`:

```sql
alter table public.anecdotes
  add column if not exists media_type text not null default 'text',
  add column if not exists media_url text;

-- Opcional: validar valores permitidos
create type anecdote_media_type as enum ('text','image','audio','video');
alter table public.anecdotes
  alter column media_type type anecdote_media_type using media_type::anecdote_media_type;
```

El frontend usa `media_type` para determinar cómo mostrar la anécdota y `media_url` para el recurso asociado.

### Almacenamiento de archivos

El backend Fastify ya ofrece `POST /uploads` y `DELETE /uploads` para manejar archivos localmente. Configura `UPLOADS_DIR`, `UPLOADS_BASE_PATH` y `UPLOAD_MAX_BYTES` en el backend para definir dónde se guardan y cómo se exponen los recursos. El flujo recomendado es:

1. El frontend usa `mediaStorage.uploadAnecdoteMedia()` para enviar un `FormData` con `file` y obtiene una URL absoluta (p. ej. `https://api.dominocum74.top/uploads/<filename>`).
2. Dicha URL se persiste en `media_url`. Esto permite que el PDF y la SPA descarguen el mismo archivo sin lógica adicional.
3. Para eliminar archivos huérfanos, el frontend invoca `DELETE /uploads` con el `publicUrl` y el backend borra la copia local.

## 1) Entidad robusta: game_partidas

```sql
create table if not exists public.game_partidas (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  game_table_id uuid not null references public.game_tables(id) on delete cascade,
  index int not null,
  started_at timestamptz not null default now(),
  closed_at timestamptz null,
  winner_pair_index int null check (winner_pair_index in (1,2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, game_table_id, index)
);
create index if not exists idx_partidas_table on public.game_partidas(game_table_id);
```

## 2) Relacionar manos a partida

```sql
alter table public.game_hands
  add column if not exists partida_id uuid null references public.game_partidas(id) on delete set null;
create index if not exists idx_hands_partida on public.game_hands(partida_id);
```

## 3) Snapshots de puntos por partida

```sql
create table if not exists public.game_partida_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  game_table_id uuid not null references public.game_tables(id) on delete cascade,
  partida_index int not null,
  pair_index int not null check (pair_index in (1,2)),
  player1_id uuid null references public.players(id),
  player2_id uuid null references public.players(id),
  points int not null default 0,
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, game_table_id, partida_index, pair_index)
);
create index if not exists idx_gps_game on public.game_partida_snapshots(game_id);
```

## 4) RLS básico (ajústalo a tu modelo de auth)

```sql
alter table public.game_partidas enable row level security;
alter table public.game_partida_snapshots enable row level security;

-- Políticas simples de lectura pública, escritura sólo para usuarios con rol 'service_role' o tu claim
create policy if not exists "partidas_select_all" on public.game_partidas for select using (true);
create policy if not exists "snapshots_select_all" on public.game_partida_snapshots for select using (true);

-- Escribe tus condiciones reales (por ejemplo, usando auth.jwt() claims)
create policy if not exists "partidas_ins_upd" on public.game_partidas for insert with check (true);
create policy if not exists "partidas_upd" on public.game_partidas for update using (true);
create policy if not exists "snapshots_ins_upd" on public.game_partida_snapshots for insert with check (true);
create policy if not exists "snapshots_upd" on public.game_partida_snapshots for update using (true);
```

## 5) Migración: poblar snapshots históricos

Rellena `game_partida_snapshots` para partidas pasadas usando manos existentes agrupadas por mesa y “periodos” separados por reinicio de puntaje.

Estrategia simple: si no tienes marcas de corte, puedes aproximar por conteo de `games_won_pair1/games_won_pair2` y dividir el total de manos en bloques (heurística). Se recomienda hacerlo manualmente por veladas importantes o, si guardaste `newPartida` en logs, usar esos cortes.

Ejemplo de script aproximado (debes adaptar a tu esquema y validar datos):

```sql
-- Pseudocódigo en SQL; ejecuta por cada mesa y noche relevante
-- 1) Obtén manos y jugadores de cada mesa
-- 2) Detecta límites de partida por acumulado de puntos alcanzando points_to_win_partida
-- 3) Inserta dos filas por partida con puntos sumados por pareja y jugadores vigentes en esa mesa
```

Sugerencia: una vez modelada `game_partidas`, será más fiable recrear snapshots con un script que derive cada partida exacta según `closed_at` y `winner_pair_index`.

## 6) Consideraciones
- Código actual intenta crear/usar `game_partidas` al insertar manos; si la tabla no existe, continúa sin fallar.
- Al cerrar partida (cuando una pareja alcanza el límite), cierra la partida abierta y guarda snapshot.
- Stats y PDF ya suman snapshots + partida vigente.
