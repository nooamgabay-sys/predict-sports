-- ============================================================
-- PredictSports — Seed Data (Sample Matches + Admin User)
-- Run AFTER rls.sql
-- ============================================================

-- NOTE: Replace 'YOUR_USER_ID_HERE' with your actual auth.users UUID
-- to make yourself an admin. Find it in Supabase > Auth > Users.

-- ============================================================
-- SAMPLE MATCHES (realistic Premier League fixtures)
-- ============================================================
INSERT INTO public.matches (home_team, away_team, home_team_logo, away_team_logo, competition, match_date, status)
VALUES
  (
    'Manchester City', 'Arsenal',
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'Premier League',
    NOW() + INTERVAL '2 days',
    'upcoming'
  ),
  (
    'Liverpool', 'Chelsea',
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    'Premier League',
    NOW() + INTERVAL '3 days',
    'upcoming'
  ),
  (
    'Real Madrid', 'Barcelona',
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    'La Liga',
    NOW() + INTERVAL '4 days',
    'upcoming'
  ),
  (
    'Bayern Munich', 'Borussia Dortmund',
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    'Bundesliga',
    NOW() + INTERVAL '5 days',
    'upcoming'
  ),
  (
    'PSG', 'Marseille',
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    'Ligue 1',
    NOW() + INTERVAL '1 day',
    'upcoming'
  ),
  (
    'Juventus', 'AC Milan',
    'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    'Serie A',
    NOW() + INTERVAL '6 days',
    'upcoming'
  ),
  (
    'Tottenham', 'Manchester United',
    'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    'Premier League',
    NOW() - INTERVAL '1 day',
    'finished'
  ),
  (
    'Atletico Madrid', 'Sevilla',
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/8/88/Sevilla_FC_logo.svg',
    'La Liga',
    NOW() - INTERVAL '2 days',
    'finished'
  );

-- Update the finished matches with results
UPDATE public.matches SET home_score = 2, away_score = 1
WHERE home_team = 'Tottenham' AND away_team = 'Manchester United';

UPDATE public.matches SET home_score = 1, away_score = 1
WHERE home_team = 'Atletico Madrid' AND away_team = 'Sevilla';

-- ============================================================
-- MAKE A USER ADMIN
-- Uncomment and replace with your UUID:
-- ============================================================
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID_HERE';
