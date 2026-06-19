/**
 * Migration Script: Google Sheets CSV → Supabase
 * 
 * This script reads the exported CSV files and imports them into Supabase,
 * deduplicating songs by title+artist (keeping the most recent one).
 * 
 * Usage:
 *   1. Create the Supabase tables and apply supabase-shared-workspace.sql
 *   2. Export SUPABASE_SERVICE_ROLE_KEY and LESPAL_USER_ID in your shell
 *   3. Run: node scripts/migrate-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

// ===========================================
// CONFIGURATION - UPDATE THESE VALUES
// ===========================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://odhkokbxpaolreqylvsf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.LESPAL_USER_ID;

// CSV file paths
const SONGS_CSV = './data-songs.csv';
const LESSONS_CSV = './data-lessons.csv';

// ===========================================
// INITIALIZATION
// ===========================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Status mapping from old format to new format
const STATUS_MAP = {
    'want-to-learn': 'want',
    'want': 'want',
    'rehearsing': 'rehearsing',
    'studied': 'studied',
    'recorded': 'recorded'
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================
function parseCSV(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true
    });
}

function normalizeTitle(title) {
    return (title || '').toLowerCase().trim();
}

function normalizeArtist(artist) {
    return (artist || '').toLowerCase().trim();
}

// ===========================================
// SONG MIGRATION
// ===========================================
async function migrateSongs() {
    console.log('\n📀 Migrating Songs...\n');

    const songs = parseCSV(SONGS_CSV);
    console.log(`  Found ${songs.length} songs in CSV`);

    // Deduplicate by title+artist, keeping the most recently updated one
    const seen = new Map();

    for (const song of songs) {
        const key = `${normalizeTitle(song.title)}|${normalizeArtist(song.artist)}`;
        const existing = seen.get(key);

        if (!existing) {
            seen.set(key, song);
        } else {
            // Keep the one with more recent updated_at
            const existingDate = new Date(existing.updated_at || existing.created_at || 0);
            const currentDate = new Date(song.updated_at || song.created_at || 0);

            if (currentDate > existingDate) {
                console.log(`  ⚠️  Replacing duplicate: "${song.title}" by ${song.artist}`);
                console.log(`      Old status: ${existing.status} → New status: ${song.status}`);
                seen.set(key, song);
            } else {
                console.log(`  ⚠️  Skipping duplicate: "${song.title}" by ${song.artist}`);
            }
        }
    }

    const uniqueSongs = Array.from(seen.values());
    console.log(`\n  Unique songs after dedup: ${uniqueSongs.length}`);
    console.log(`  Duplicates removed: ${songs.length - uniqueSongs.length}`);

    // Create ID mapping for ALL songs (including duplicates that point to their kept version)
    const idMap = new Map();

    // First, map each unique song to preserve its original ID
    for (const song of uniqueSongs) {
        // Check if it's a valid UUID (36 chars with dashes)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(song.id);
        const newId = isValidUUID ? song.id : crypto.randomUUID();
        idMap.set(song.id, newId);
        song._newId = newId; // Store for insert
    }

    // Now map all duplicate songs to their kept version's new ID
    for (const song of songs) {
        const key = `${normalizeTitle(song.title)}|${normalizeArtist(song.artist)}`;
        const keptSong = seen.get(key);
        if (keptSong && song.id !== keptSong.id) {
            // This is a duplicate - map its ID to the kept song's new ID
            idMap.set(song.id, keptSong._newId);
            console.log(`  📎 Mapping duplicate ID ${song.id.slice(0, 8)}... → ${keptSong._newId.slice(0, 8)}...`);
        }
    }

    // Prepare for insert
    const toInsert = uniqueSongs.map(song => {
        return {
            id: song._newId,
            user_id: USER_ID,
            title: song.title || '',
            artist: song.artist || '',
            status: STATUS_MAP[song.status] || 'want',
            tabs_link: song.tabs_link || null,
            video_link: song.video_link || null,
            recording_link: song.recording_link || null,
            artwork_url: song.artwork_url || null,
            notes: song.notes || null,
            created_at: song.created_at || new Date().toISOString(),
            updated_at: song.updated_at || new Date().toISOString()
        };
    });

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('songs').insert(batch);

        if (error) {
            console.error(`  ❌ Error inserting batch: ${error.message}`);
        } else {
            inserted += batch.length;
            console.log(`  ✅ Inserted ${inserted}/${toInsert.length} songs`);
        }
    }

    console.log(`\n  ✅ Songs migration complete: ${inserted} songs imported`);
    return idMap;
}

// ===========================================
// LESSON MIGRATION
// ===========================================
async function migrateLessons(songIdMap) {
    console.log('\n📚 Migrating Lessons...\n');

    const lessons = parseCSV(LESSONS_CSV);
    console.log(`  Found ${lessons.length} lessons in CSV`);

    // Deduplicate lessons by date (some appear to be duplicated)
    const seen = new Map();

    for (const lesson of lessons) {
        const key = lesson.date;
        const existing = seen.get(key);

        if (!existing) {
            seen.set(key, lesson);
        } else {
            // Keep the one with more content (longer notes)
            if ((lesson.notes || '').length > (existing.notes || '').length) {
                console.log(`  ⚠️  Replacing duplicate lesson for date: ${lesson.date}`);
                seen.set(key, lesson);
            } else {
                console.log(`  ⚠️  Skipping duplicate lesson for date: ${lesson.date}`);
            }
        }
    }

    const uniqueLessons = Array.from(seen.values());
    console.log(`\n  Unique lessons after dedup: ${uniqueLessons.length}`);
    console.log(`  Duplicates removed: ${lessons.length - uniqueLessons.length}`);

    // Prepare for insert
    const toInsert = uniqueLessons.map(lesson => {
        // Map old song IDs to new song IDs in topics
        let topics = lesson.topics || '';
        if (topics) {
            const oldIds = topics.split(',').map(id => id.trim());
            const newIds = oldIds.map(oldId => songIdMap.get(oldId) || oldId);
            topics = newIds.join(',');
        }

        return {
            id: crypto.randomUUID(),
            user_id: USER_ID,
            date: lesson.date || null,
            notes: lesson.notes || null,
            topics: topics || null,
            link: lesson.link || null,
            audio_url: lesson.audio_url || null,
            remaining_lessons: parseInt(lesson.remaining_lessons) || 0,
            created_at: lesson.created_at || new Date().toISOString(),
            updated_at: lesson.updated_at || new Date().toISOString()
        };
    });

    // Insert in batches
    const BATCH_SIZE = 50;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('lessons').insert(batch);

        if (error) {
            console.error(`  ❌ Error inserting batch: ${error.message}`);
        } else {
            inserted += batch.length;
            console.log(`  ✅ Inserted ${inserted}/${toInsert.length} lessons`);
        }
    }

    console.log(`\n  ✅ Lessons migration complete: ${inserted} lessons imported`);
}

// ===========================================
// MAIN
// ===========================================
async function main() {
    console.log('='.repeat(50));
    console.log('🚀 Lespal Data Migration');
    console.log('='.repeat(50));

    if (!USER_ID) {
        console.error('\n❌ ERROR: Set LESPAL_USER_ID before running this migration');
        process.exit(1);
    }

    if (!SUPABASE_SERVICE_KEY) {
        console.error('\n❌ ERROR: Set SUPABASE_SERVICE_ROLE_KEY before running this migration');
        process.exit(1);
    }

    try {
        // First migrate songs and get ID mapping
        const songIdMap = await migrateSongs();

        // Then migrate lessons with updated topic IDs
        await migrateLessons(songIdMap);

        console.log('\n' + '='.repeat(50));
        console.log('✅ Migration Complete!');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

main();
