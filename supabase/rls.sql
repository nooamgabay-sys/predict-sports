-- ============================================================
-- PredictSports — Row Level Security Policies
-- Run AFTER schema.sql and functions.sql
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES policies
-- ============================================================

-- Anyone can view profiles (global leaderboard needs this)
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- MATCHES policies
-- ============================================================

-- Everyone (including anon) can view matches
CREATE POLICY "matches: public read"
  ON public.matches FOR SELECT
  USING (true);

-- Only admins can create/modify matches
CREATE POLICY "matches: admin insert"
  ON public.matches FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
  );

CREATE POLICY "matches: admin update"
  ON public.matches FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
  );

CREATE POLICY "matches: admin delete"
  ON public.matches FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
  );

-- ============================================================
-- PREDICTIONS policies
-- ============================================================

-- Users can only read their own predictions
CREATE POLICY "predictions: self read"
  ON public.predictions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own predictions only for upcoming matches
CREATE POLICY "predictions: self insert"
  ON public.predictions FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
        AND status = 'upcoming'
        AND match_date > NOW()
    )
  );

-- Users can update their own predictions only before match starts
CREATE POLICY "predictions: self update before kickoff"
  ON public.predictions FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
        AND status = 'upcoming'
        AND match_date > NOW()
    )
  );

-- ============================================================
-- LEAGUES policies
-- ============================================================

-- All authenticated users can view leagues (needed for invite link)
CREATE POLICY "leagues: auth read"
  ON public.leagues FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Any authenticated user can create a league
CREATE POLICY "leagues: auth insert"
  ON public.leagues FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Only owner can update/delete
CREATE POLICY "leagues: owner update"
  ON public.leagues FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "leagues: owner delete"
  ON public.leagues FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);

-- ============================================================
-- LEAGUE_MEMBERS policies
-- ============================================================

-- Members can see other members of their leagues
CREATE POLICY "league_members: read if member"
  ON public.league_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm2
      WHERE lm2.league_id = league_members.league_id
        AND lm2.user_id = (SELECT auth.uid())
    )
  );

-- Any authenticated user can join a league
CREATE POLICY "league_members: auth join"
  ON public.league_members FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can leave (delete their own membership)
CREATE POLICY "league_members: self leave"
  ON public.league_members FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
