-- ============================================================
-- PredictSports — PostgreSQL Functions & Triggers
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- FUNCTION: Auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger: fires on every new auth.users row
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Calculate outcome (win/draw/loss) helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_outcome(home INTEGER, away INTEGER)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF home > away THEN RETURN 'home';
  ELSIF home < away THEN RETURN 'away';
  ELSE RETURN 'draw';
  END IF;
END;
$$;

-- ============================================================
-- FUNCTION: Score a single prediction
-- Returns 3 (exact), 1 (correct outcome), or 0 (wrong)
-- ============================================================
CREATE OR REPLACE FUNCTION public.score_prediction(
  p_home_pred INTEGER,
  p_away_pred INTEGER,
  p_home_actual INTEGER,
  p_away_actual INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  -- Exact score match
  IF p_home_pred = p_home_actual AND p_away_pred = p_away_actual THEN
    RETURN 3;
  END IF;
  -- Correct outcome (W/D/L)
  IF public.get_outcome(p_home_pred, p_away_pred) = public.get_outcome(p_home_actual, p_away_actual) THEN
    RETURN 1;
  END IF;
  -- Wrong
  RETURN 0;
END;
$$;

-- ============================================================
-- FUNCTION: Calculate and award points for a match
-- Called when admin sets a match result
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_match_points(p_match_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_home_score INTEGER;
  v_away_score INTEGER;
BEGIN
  -- Get the final scores
  SELECT home_score, away_score
  INTO v_home_score, v_away_score
  FROM public.matches
  WHERE id = p_match_id;

  -- Abort if no result yet
  IF v_home_score IS NULL OR v_away_score IS NULL THEN
    RAISE EXCEPTION 'Match % has no result yet', p_match_id;
  END IF;

  -- Update all predictions for this match
  UPDATE public.predictions
  SET
    points_earned = public.score_prediction(home_score, away_score, v_home_score, v_away_score),
    updated_at    = NOW()
  WHERE match_id = p_match_id
    AND points_earned IS NULL;  -- only score unscored predictions

  -- Refresh all users' total_points who predicted this match
  UPDATE public.profiles p
  SET
    total_points = (
      SELECT COALESCE(SUM(pr.points_earned), 0)
      FROM public.predictions pr
      WHERE pr.user_id = p.id
        AND pr.points_earned IS NOT NULL
    ),
    updated_at = NOW()
  WHERE p.id IN (
    SELECT DISTINCT user_id
    FROM public.predictions
    WHERE match_id = p_match_id
  );

  -- Refresh global rankings using window function
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY total_points DESC, created_at ASC) AS rk
    FROM public.profiles
  )
  UPDATE public.profiles p
  SET global_rank = ranked.rk
  FROM ranked
  WHERE p.id = ranked.id;

END;
$$;

-- ============================================================
-- TRIGGER: Auto-calculate points when match is set to 'finished'
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_match_finished()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only act when status transitions TO 'finished'
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    IF NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
      PERFORM public.calculate_match_points(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_match_finished
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.on_match_finished();

-- ============================================================
-- FUNCTION: Generate a unique 8-char invite code for leagues
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code (uppercase)
    v_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    -- Remove non-alphanumeric characters
    v_code := regexp_replace(v_code, '[^A-Z0-9]', '', 'g');
    -- Pad or trim to exactly 8 chars
    WHILE length(v_code) < 8 LOOP
      v_code := v_code || chr(trunc(random() * 26 + 65)::int);
    END LOOP;
    v_code := substr(v_code, 1, 8);

    SELECT EXISTS(SELECT 1 FROM public.leagues WHERE invite_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- FUNCTION: Updated_at auto-update trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
