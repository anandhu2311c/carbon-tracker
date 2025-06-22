-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, color, requirement_type, requirement_value, points_reward) VALUES
('First Steps', 'Logged your first activity', 'Leaf', 'green', 'activity_count', 1, 50),
('Week Warrior', '7-day logging streak', 'Star', 'blue', 'streak', 7, 100),
('Carbon Cutter', 'Reduced emissions by 10%', 'TrendingUp', 'purple', 'reduction', 10, 200),
('Eco Explorer', 'Tried all activity categories', 'Award', 'orange', 'category_complete', 4, 150),
('Green Champion', 'Reduce emissions by 25%', 'Crown', 'yellow', 'reduction', 25, 500),
('Streak Master', '30-day logging streak', 'Medal', 'red', 'streak', 30, 750),
('Transport Hero', 'Use sustainable transport 50 times', 'Car', 'blue', 'sustainable_transport', 50, 300),
('Energy Saver', 'Save 100 kWh of energy', 'Zap', 'yellow', 'energy_saved', 100, 400);

-- Insert default rewards
INSERT INTO public.rewards (name, description, cost, icon, color, available) VALUES
('Plant a Tree', 'We''ll plant a real tree in your name', 1000, 'Leaf', 'green', true),
('Carbon Offset', 'Offset 10kg of CO₂ emissions', 500, 'Target', 'blue', true),
('Eco Gift Card', '$25 sustainable products gift card', 2500, 'Gift', 'purple', true),
('Premium Features', 'Unlock advanced analytics for 1 month', 750, 'Star', 'orange', true);

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
CREATE TRIGGER on_activity_created
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_after_activity();
