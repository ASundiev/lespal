-- Lespal has one permanent library and exactly two authenticated members.
-- Run after supabase-setup.sql. This is safe to rerun.

-- Existing rows already use this value, so no data rewrite is required.
-- Shared library: a7f4579f-e464-4c11-aadc-2297791de158
-- Member 1:       a7f4579f-e464-4c11-aadc-2297791de158
-- Member 2:       9324f346-6443-44d2-8a4d-07e319c9b1c2

-- Remove every policy from the former owner/teacher model.
DROP POLICY IF EXISTS "Users can view their own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can insert their own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can delete their own songs" ON public.songs;
DROP POLICY IF EXISTS "Owner or teacher can view songs" ON public.songs;
DROP POLICY IF EXISTS "Teachers can update student songs" ON public.songs;
DROP POLICY IF EXISTS "Teachers can insert student songs" ON public.songs;
DROP POLICY IF EXISTS "Teachers can delete student songs" ON public.songs;

DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can insert their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Owner or teacher can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can update student lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can insert student lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can delete student lessons" ON public.lessons;

DROP POLICY IF EXISTS "Lespal members can view shared songs" ON public.songs;
CREATE POLICY "Lespal members can view shared songs" ON public.songs
  FOR SELECT USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can insert shared songs" ON public.songs;
CREATE POLICY "Lespal members can insert shared songs" ON public.songs
  FOR INSERT WITH CHECK (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can update shared songs" ON public.songs;
CREATE POLICY "Lespal members can update shared songs" ON public.songs
  FOR UPDATE USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  ) WITH CHECK (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can delete shared songs" ON public.songs;
CREATE POLICY "Lespal members can delete shared songs" ON public.songs
  FOR DELETE USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can view shared lessons" ON public.lessons;
CREATE POLICY "Lespal members can view shared lessons" ON public.lessons
  FOR SELECT USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can insert shared lessons" ON public.lessons;
CREATE POLICY "Lespal members can insert shared lessons" ON public.lessons
  FOR INSERT WITH CHECK (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can update shared lessons" ON public.lessons;
CREATE POLICY "Lespal members can update shared lessons" ON public.lessons
  FOR UPDATE USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  ) WITH CHECK (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

DROP POLICY IF EXISTS "Lespal members can delete shared lessons" ON public.lessons;
CREATE POLICY "Lespal members can delete shared lessons" ON public.lessons
  FOR DELETE USING (
    user_id = 'a7f4579f-e464-4c11-aadc-2297791de158'::uuid
    AND auth.uid() IN (
      'a7f4579f-e464-4c11-aadc-2297791de158'::uuid,
      '9324f346-6443-44d2-8a4d-07e319c9b1c2'::uuid
    )
  );

-- No relationship metadata is needed for a permanent two-person workspace.
DROP TABLE IF EXISTS public.teacher_students;
