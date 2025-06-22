-- Drop and recreate all functions to fix the achievement system

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_activity_created ON public.activities;
DROP FUNCTION IF EXISTS public.update_user_stats_after_activity();
DROP FUNCTION IF EXISTS public.check_and_award_achievements(UUID);
DROP FUNCTION IF EXISTS public.refresh_user_data(UUID);

-- Create improved function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_stat RECORD;
  achievement RECORD;
  points_awarded INTEGER := 0;
  activity_types_count INTEGER;
  sustainable_transport_count INTEGER;
  energy_saved DECIMAL;
BEGIN
  -- Get user stats
  SELECT * INTO user_stat FROM public.user_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check each achievement
  FOR achievement IN SELECT * FROM public.achievements ORDER BY points_reward ASC LOOP
    -- Skip if user already has this achievement
    IF EXISTS (SELECT 1 FROM public.user_achievements WHERE user_id = p_user_id AND achievement_id = achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check achievement requirements
    CASE achievement.requirement_type
      WHEN 'activity_count' THEN
        IF user_stat.activities_logged >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
        
      WHEN 'streak' THEN
        IF user_stat.current_streak >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
        
      WHEN 'reduction' THEN
        IF user_stat.total_emissions > 0 AND (user_stat.emissions_saved / user_stat.total_emissions) * 100 >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
        
      WHEN 'category_complete' THEN
        -- Check if user has logged activities in all 4 categories
        SELECT COUNT(DISTINCT type) INTO activity_types_count
        FROM public.activities 
        WHERE user_id = p_user_id;
        
        IF activity_types_count >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
        
      WHEN 'sustainable_transport' THEN
        -- Count sustainable transport activities (walking, cycling, public transport)
        SELECT COUNT(*) INTO sustainable_transport_count
        FROM public.activities 
        WHERE user_id = p_user_id 
        AND type = 'transport' 
        AND (activity_name ILIKE '%walk%' OR activity_name ILIKE '%cycle%' OR activity_name ILIKE '%bike%' OR activity_name ILIKE '%bus%' OR activity_name ILIKE '%train%');
        
        IF sustainable_transport_count >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
        
      WHEN 'energy_saved' THEN
        -- Calculate energy saved (this is a simplified calculation)
        SELECT COALESCE(SUM(amount), 0) INTO energy_saved
        FROM public.activities 
        WHERE user_id = p_user_id 
        AND type = 'energy' 
        AND unit = 'kWh';
        
        IF energy_saved >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          points_awarded := points_awarded + achievement.points_reward;
        END IF;
    END CASE;
  END LOOP;
  
  -- Update total points if any achievements were awarded
  IF points_awarded > 0 THEN
    UPDATE public.user_stats 
    SET total_points = total_points + points_awarded,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN points_awarded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update leaderboard rankings
CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, current_streak DESC, activities_logged DESC) as new_rank
    FROM public.user_stats
    WHERE total_points > 0 OR activities_logged > 0
  )
  UPDATE public.user_stats 
  SET rank_position = ranked_users.new_rank,
      updated_at = NOW()
  FROM ranked_users
  WHERE public.user_stats.user_id = ranked_users.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved function to update user stats after activity insert
CREATE OR REPLACE FUNCTION public.update_user_stats_after_activity()
RETURNS TRIGGER AS $$
DECLARE
  current_date_activities INTEGER;
  yesterday_activities INTEGER;
  new_streak INTEGER;
  points_from_achievements INTEGER;
  base_points INTEGER := 10; -- Base points for logging activity
BEGIN
  -- Ensure user_stats record exists
  INSERT INTO public.user_stats (user_id, total_points, current_streak, longest_streak, total_emissions, emissions_saved, activities_logged)
  VALUES (NEW.user_id, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update total emissions and activities count
  UPDATE public.user_stats 
  SET 
    total_emissions = total_emissions + NEW.emissions,
    activities_logged = activities_logged + 1,
    last_activity_date = NEW.date,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Calculate streak
  SELECT COUNT(*) INTO current_date_activities
  FROM public.activities 
  WHERE user_id = NEW.user_id AND date = NEW.date;
  
  SELECT COUNT(*) INTO yesterday_activities
  FROM public.activities 
  WHERE user_id = NEW.user_id AND date = NEW.date - INTERVAL '1 day';
  
  -- Update streak logic (only for first activity of the day)
  IF current_date_activities = 1 THEN
    IF yesterday_activities > 0 THEN
      -- Continue streak
      UPDATE public.user_stats 
      SET current_streak = current_streak + 1
      WHERE user_id = NEW.user_id;
    ELSE
      -- Start new streak
      UPDATE public.user_stats 
      SET current_streak = 1
      WHERE user_id = NEW.user_id;
    END IF;
    
    -- Update longest streak if needed
    SELECT current_streak INTO new_streak
    FROM public.user_stats 
    WHERE user_id = NEW.user_id;
    
    UPDATE public.user_stats 
    SET longest_streak = GREATEST(longest_streak, new_streak)
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Award base points for logging activity
  UPDATE public.user_stats 
  SET total_points = total_points + base_points
  WHERE user_id = NEW.user_id;
  
  -- Check and award achievements
  SELECT public.check_and_award_achievements(NEW.user_id) INTO points_from_achievements;
  
  -- Update leaderboard rankings
  PERFORM public.update_leaderboard_rankings();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activity stats update
CREATE TRIGGER on_activity_created
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_after_activity();

-- Create function to manually refresh user data and check achievements
CREATE OR REPLACE FUNCTION public.refresh_user_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  points_awarded INTEGER;
  total_activities INTEGER;
  total_emissions_calc DECIMAL;
  current_streak_calc INTEGER;
  last_activity DATE;
BEGIN
  -- Recalculate user stats from activities
  SELECT 
    COUNT(*),
    COALESCE(SUM(emissions), 0),
    MAX(date)
  INTO 
    total_activities,
    total_emissions_calc,
    last_activity
  FROM public.activities 
  WHERE user_id = p_user_id;
  
  -- Calculate current streak
  WITH consecutive_days AS (
    SELECT 
      date,
      date - ROW_NUMBER() OVER (ORDER BY date) * INTERVAL '1 day' as grp
    FROM (
      SELECT DISTINCT date 
      FROM public.activities 
      WHERE user_id = p_user_id 
      ORDER BY date DESC
    ) t
  ),
  streak_groups AS (
    SELECT 
      grp,
      COUNT(*) as streak_length,
      MAX(date) as latest_date
    FROM consecutive_days
    GROUP BY grp
    ORDER BY latest_date DESC
    LIMIT 1
  )
  SELECT COALESCE(streak_length, 0) INTO current_streak_calc
  FROM streak_groups
  WHERE latest_date = CURRENT_DATE OR latest_date = CURRENT_DATE - INTERVAL '1 day';
  
  -- If no recent activity, streak is 0
  IF current_streak_calc IS NULL THEN
    current_streak_calc := 0;
  END IF;
  
  -- Update user stats with recalculated values
  UPDATE public.user_stats 
  SET 
    total_emissions = total_emissions_calc,
    activities_logged = total_activities,
    current_streak = current_streak_calc,
    last_activity_date = last_activity,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Check for new achievements
  SELECT public.check_and_award_achievements(p_user_id) INTO points_awarded;
  
  -- Update leaderboard
  PERFORM public.update_leaderboard_rankings();
  
  -- Return updated stats
  SELECT json_build_object(
    'points_awarded', points_awarded,
    'total_points', total_points,
    'activities_logged', activities_logged,
    'current_streak', current_streak,
    'total_emissions', total_emissions
  ) INTO result
  FROM public.user_stats 
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard with proper joins
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  total_points INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_emissions DECIMAL,
  emissions_saved DECIMAL,
  activities_logged INTEGER,
  rank_position INTEGER,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    us.total_points,
    us.current_streak,
    us.longest_streak,
    us.total_emissions,
    us.emissions_saved,
    us.activities_logged,
    us.rank_position,
    COALESCE(p.full_name, p.email) as full_name,
    p.avatar_url,
    us.updated_at
  FROM public.user_stats us
  LEFT JOIN public.profiles p ON us.user_id = p.id
  WHERE us.total_points > 0 OR us.activities_logged > 0
  ORDER BY us.total_points DESC, us.current_streak DESC, us.activities_logged DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
