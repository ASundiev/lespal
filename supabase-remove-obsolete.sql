-- Run once in the Supabase SQL editor after deploying the simplified app.
-- Auth users and lesson/song data are preserved.

DROP TABLE IF EXISTS public.invite_codes;
DROP TABLE IF EXISTS public.user_secrets;
DROP TABLE IF EXISTS public.user_profiles;
