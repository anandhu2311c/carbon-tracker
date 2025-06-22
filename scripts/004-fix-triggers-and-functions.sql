-- Drop existing triggers and functions to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_activity_created ON public.activities;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_stats_after_activity();
DROP FUNCTION IF EXISTS public.check_and_award_achievements(UUID);
DROP FUNCTION IF EXISTS public.update_leaderboard_rankings();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Insert initial user stats
  INSERT INTO public.user_stats (user_id, total_points, current_streak, longest_streak, total_emissions, emissions_saved, activities_logged)
  VALUES (NEW.id, 0, 0, 0, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_stat RECORD;
  achievement RECORD;
  points_awarded INTEGER := 0;
  activity_types_count INTEGER;
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
  
  -- Award base points for logging activity (10 points per activity)
  UPDATE public.user_stats 
  SET total_points = total_points + 10
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

-- Create function to manually refresh user achievements and points
CREATE OR REPLACE FUNCTION public.refresh_user_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  points_awarded INTEGER;
BEGIN
  -- Recalculate user stats from activities
  UPDATE public.user_stats 
  SET 
    total_emissions = COALESCE((SELECT SUM(emissions) FROM public.activities WHERE user_id = p_user_id), 0),
    activities_logged = COALESCE((SELECT COUNT(*) FROM public.activities WHERE user_id = p_user_id), 0),
    current_streak = COALESCE((
      SELECT COUNT(DISTINCT date) 
      FROM public.activities 
      WHERE user_id = p_user_id 
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ), 0),
    last_activity_date = (SELECT MAX(date) FROM public.activities WHERE user_id = p_user_id),
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
    'current_streak', current_streak
  ) INTO result
  FROM public.user_stats 
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
