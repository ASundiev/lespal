-- Run once in the Supabase SQL editor.
-- Realtime lets the teacher and student see each other's lesson changes
-- without refreshing. RLS still controls which events each client receives.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lessons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'songs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
  END IF;
END $$;

-- Include the owner column in old rows so the client can scope deletes too.
ALTER TABLE public.lessons REPLICA IDENTITY FULL;
ALTER TABLE public.songs REPLICA IDENTITY FULL;
