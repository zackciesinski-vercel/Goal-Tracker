-- Add parent_goal_id to support goal hierarchy
-- Company objectives have no parent
-- Team/Individual goals must link to a company objective

ALTER TABLE public.goals
ADD COLUMN parent_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX goals_parent_goal_id_idx ON public.goals(parent_goal_id);

-- Update goal_type to use 'company' instead of 'org' for clarity
-- (optional: run this if you want to rename existing 'org' goals)
UPDATE public.goals SET goal_type = 'company' WHERE goal_type = 'org';

-- Update the check constraint to include 'company'
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check
  CHECK (goal_type IN ('company', 'team', 'individual'));
