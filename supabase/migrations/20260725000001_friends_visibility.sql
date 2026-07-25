-- Add friends visibility preference
ALTER TABLE public.user_profiles 
ADD COLUMN friends_visible boolean DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_friends_visible 
ON public.user_profiles(friends_visible);

-- Set existing profiles to visible by default (change if you want private)
UPDATE public.user_profiles SET friends_visible = true WHERE role = 'owner';
