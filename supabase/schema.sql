-- ============================================================
-- PredictSports Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished');

-- ============================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        UNIQUE NOT NULL,
  avatar_url    TEXT,
  total_points  INTEGER     NOT NULL DEFAULT 0,
  global_rank   INTEGER,
  is_admin      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team       TEXT          NOT NULL,
  away_team       TEXT          NOT NULL,
  home_team_logo  TEXT          DEFAULT '',
  away_team_logo  TEXT          DEFAULT '',
  competition     TEXT          NOT NULL DEFAULT 'Premier League',
  stage           TEXT,
  match_date      TIMESTAMPTZ   NOT NULL,
  status          match_status  NOT NULL DEFAULT 'upcoming',
  home_score      INTEGER,
  away_score      INTEGER,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_scores CHECK (
    (home_score IS NULL AND away_score IS NULL) OR
    (home_score >= 0 AND away_score >= 0)
  )
);

-- Index for upcoming matches sorted by date
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_matches_status ON public.matches(status);

-- ============================================================
-- PREDICTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id        UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_score      INTEGER     NOT NULL CHECK (home_score >= 0),
  away_score      INTEGER     NOT NULL CHECK (away_score >= 0),
  points_earned   INTEGER     CHECK (points_earned IN (0, 1, 3)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX idx_predictions_user ON public.predictions(user_id);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);

-- ============================================================
-- LEAGUES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT        DEFAULT '',
  invite_code   TEXT        UNIQUE NOT NULL,
  owner_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leagues_invite_code ON public.leagues(invite_code);
CREATE INDEX idx_leagues_owner ON public.leagues(owner_id);

-- ============================================================
-- LEAGUE_MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   UUID        NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

CREATE INDEX idx_league_members_league ON public.league_members(league_id);
CREATE INDEX idx_league_members_user ON public.league_members(user_id);

-- ============================================================
-- ENABLE REALTIME
-- (Run these after creating tables)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.league_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
