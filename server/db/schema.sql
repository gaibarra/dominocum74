-- Dominó CUM 74 schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  photo TEXT,
  player_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  summary TEXT,
  location_name TEXT,
  location_details TEXT,
  status TEXT NOT NULL DEFAULT 'En curso',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  points_to_win_partida INTEGER DEFAULT 100,
  games_won_pair1 INTEGER NOT NULL DEFAULT 0,
  games_won_pair2 INTEGER NOT NULL DEFAULT 0,
  partida_finished BOOLEAN NOT NULL DEFAULT FALSE,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, table_number)
);

CREATE TABLE IF NOT EXISTS game_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_pair_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_pair_id UUID NOT NULL REFERENCES game_pairs(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_pair_id, player_id)
);

CREATE TABLE IF NOT EXISTS game_partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  partida_index INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  winner_pair_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_table_id, partida_index)
);

CREATE TABLE IF NOT EXISTS game_hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  partida_id UUID REFERENCES game_partidas(id) ON DELETE SET NULL,
  hand_number INTEGER NOT NULL,
  pair_1_score INTEGER NOT NULL DEFAULT 0,
  pair_2_score INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_table_id, hand_number)
);

CREATE TABLE IF NOT EXISTS anecdotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_edited TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS game_partida_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  partida_index INTEGER NOT NULL,
  pair_index INTEGER NOT NULL,
  player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 0,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, game_table_id, partida_index, pair_index)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['players','games','game_tables','game_pairs','game_hands','game_partidas','anecdotes','game_attendance','game_partida_snapshots'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I;', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', tbl, tbl);
  END LOOP;
END$$;
