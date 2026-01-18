import { supabase } from './supabaseClient';

/**
 * Supabase API functions for songs and lessons.
 * These mirror the existing Google Sheets API but use Supabase.
 */

// ============ SONGS ============

export async function listSongs() {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title');

    if (error) throw error;
    return data || [];
}

export async function createSong(song, targetUserId = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('songs')
        .insert({ ...song, user_id: targetUserId || user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateSong(id, updates) {
    const { data, error } = await supabase
        .from('songs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============ LESSONS ============

export async function listLessons() {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createLesson(lesson, targetUserId = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('lessons')
        .insert({ ...lesson, user_id: targetUserId || user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateLesson(id, updates) {
    const { data, error } = await supabase
        .from('lessons')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteLesson(id) {
    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
// ============ PROFILE & SETTINGS ============

export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId || (await supabase.auth.getUser()).data.user?.id)
        .single();

    if (error && userId) return null; // Not found for specific ID is ok
    if (error) throw error;
    return data;
}

export async function updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getSecrets(userId) {
    const { data, error } = await supabase
        .from('user_secrets')
        .select('*')
        .eq('id', userId || (await supabase.auth.getUser()).data.user?.id)
        .single();

    // It's okay if secrets don't exist yet
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
}

export async function updateSecrets(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // UPSERT secrets
    const { data, error } = await supabase
        .from('user_secrets')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getTeacherOfStudent(studentId) {
    const { data, error } = await supabase
        .from('teacher_students')
        .select('teacher_id')
        .eq('student_id', studentId)
        .single();
    if (error) return null;
    return data.teacher_id;
}
