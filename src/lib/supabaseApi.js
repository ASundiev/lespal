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

export async function createSong(song) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('songs')
        .insert({ ...song, user_id: user.id })
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

export async function createLesson(lesson) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('lessons')
        .insert({ ...lesson, user_id: user.id })
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
