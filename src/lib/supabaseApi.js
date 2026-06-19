import { supabase } from './supabaseClient';
import { LESPAL_WORKSPACE_ID } from './sharedWorkspace';

/**
 * Supabase API functions for Lespal's single shared library.
 */

// ============ SONGS ============

export async function listSongs() {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', LESPAL_WORKSPACE_ID)
        .order('title');

    if (error) throw error;
    return data || [];
}

export async function createSong(song) {
    const { data, error } = await supabase
        .from('songs')
        .insert({ ...song, user_id: LESPAL_WORKSPACE_ID })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateSong(id, updates) {
    const { id: _id, user_id: _userId, created_at: _createdAt, expected_updated_at, ...changes } = updates;
    let query = supabase
        .from('songs')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (expected_updated_at) query = query.eq('updated_at', expected_updated_at);
    const { data, error } = await query.select().maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('This song changed on another device. Reopen it and try again.');
    return data;
}

// ============ LESSONS ============

export async function listLessons() {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', LESPAL_WORKSPACE_ID)
        .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createLesson(lesson) {
    const { data, error } = await supabase
        .from('lessons')
        .insert({ ...lesson, user_id: LESPAL_WORKSPACE_ID })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateLesson(id, updates) {
    const { id: _id, user_id: _userId, created_at: _createdAt, songs: _songs, expected_updated_at, ...changes } = updates;
    let query = supabase
        .from('lessons')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (expected_updated_at) query = query.eq('updated_at', expected_updated_at);
    const { data, error } = await query.select().maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('This lesson changed on another device. Reopen it and try again.');
    return data;
}

export async function deleteLesson(id) {
    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Keep both open apps in sync while ignoring unrelated database rows.
export function subscribeToLibrary(onChange, onStatus = () => {}) {
    const emitIfSharedLibrary = table => payload => {
        const changedOwnerId = payload.new?.user_id || payload.old?.user_id;
        if (changedOwnerId && changedOwnerId !== LESPAL_WORKSPACE_ID) return;
        onChange(table, payload);
    };

    const channel = supabase
        .channel(`library:${LESPAL_WORKSPACE_ID}`)
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'lessons'
        }, emitIfSharedLibrary('lessons'))
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'songs'
        }, emitIfSharedLibrary('songs'))
        .subscribe(onStatus);

    return () => { supabase.removeChannel(channel); };
}
