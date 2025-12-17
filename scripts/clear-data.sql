-- Clear existing migrated data (run before re-migration)
DELETE FROM lessons WHERE user_id = 'a7f4579f-e464-4c11-aadc-2297791de158';
DELETE FROM songs WHERE user_id = 'a7f4579f-e464-4c11-aadc-2297791de158';
