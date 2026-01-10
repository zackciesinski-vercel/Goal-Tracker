-- Add icon column for visual goal cards
ALTER TABLE public.goals
ADD COLUMN icon text DEFAULT '🎯';
