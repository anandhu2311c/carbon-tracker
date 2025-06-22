-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user stats after activity insert
CREATE OR REPLACE FUNCTION public.update_user_stats_after_activity()
RETURNS TRIGGER AS $$
DECLARE
  current_date_activities INTEGER;
  yesterday_activities INTEGER;
  new_streak INTEGER;
BEGIN
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
  
  -- Update streak logic (simplified)
  IF current_date_activities = 1 THEN -- First activity of the day
    IF yesterday_activities > 0 THEN
      UPDATE public.user_stats 
      SET current_streak = current_streak + 1
      WHERE user_id = NEW.user_id;
    ELSE
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activity stats update
DROP TRIGGER IF EXISTS on_activity_created ON public.activities;
CREATE TRIGGER on_activity_created
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_after_activity();

-- Create function to update leaderboard rankings
CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, current_streak DESC) as new_rank
    FROM public.user_stats
  )
  UPDATE public.user_stats 
  SET rank_position = ranked_users.new_rank
  FROM ranked_users
  WHERE public.user_stats.user_id = ranked_users.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  user_stat RECORD;
  achievement RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO user_stat FROM public.user_stats WHERE user_id = p_user_id;
  
  -- Check each achievement
  FOR achievement IN SELECT * FROM public.achievements LOOP
    -- Skip if user already has this achievement
    IF EXISTS (SELECT 1 FROM public.user_achievements WHERE user_id = p_user_id AND achievement_id = achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check achievement requirements
    CASE achievement.requirement_type
      WHEN 'activity_count' THEN
        IF user_stat.activities_logged >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE public.user_stats SET total_points = total_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'streak' THEN
        IF user_stat.current_streak >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE public.user_stats SET total_points = total_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'reduction' THEN
        IF user_stat.emissions_saved > 0 AND (user_stat.emissions_saved / GREATEST(user_stat.total_emissions, 1)) * 100 >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE public.user_stats SET total_points = total_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
    END CASE;
  END LOOP;
  
  -- Update leaderboard rankings
  PERFORM public.update_leaderboard_rankings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
