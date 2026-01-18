import { supabase } from './supabaseClient';

/**
 * Teacher-Student sharing API functions
 */

// ============ INVITE CODES ============

// Generate a unique invite code for a teacher
export async function createInviteCode() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate a simple 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
        .from('invite_codes')
        .insert({
            code,
            teacher_id: user.id,
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get teacher's active invite codes
export async function getMyInviteCodes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// Redeem an invite code (student calls this)
export async function redeemInviteCode(code) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Find the invite code
    const { data: inviteCode, error: findError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .is('used_by', null)
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .single();

    if (findError || !inviteCode) {
        throw new Error('Invalid or expired invite code');
    }

    // Create the teacher-student relationship
    const { error: linkError } = await supabase
        .from('teacher_students')
        .insert({
            teacher_id: inviteCode.teacher_id,
            student_id: user.id
        });

    if (linkError) {
        if (linkError.code === '23505') {
            throw new Error('You are already linked to this teacher');
        }
        throw linkError;
    }

    // Mark the code as used
    await supabase
        .from('invite_codes')
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', inviteCode.id);

    return { success: true, teacherId: inviteCode.teacher_id };
}

// ============ TEACHER-STUDENT RELATIONSHIPS ============

// Get students linked to the current teacher
export async function getMyStudents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('teacher_students')
        .select(`
      id,
      student_id,
      created_at
    `)
        .eq('teacher_id', user.id);

    if (error) throw error;

    // Get student emails from auth.users (via a function or just return IDs for now)
    return data || [];
}

// Get teachers linked to the current student
export async function getMyTeachers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('teacher_students')
        .select(`
      id,
      teacher_id,
      created_at
    `)
        .eq('student_id', user.id);

    if (error) throw error;
    return data || [];
}

// Unlink from a teacher
export async function unlinkTeacher(teacherId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('teacher_students')
        .delete()
        .eq('student_id', user.id)
        .eq('teacher_id', teacherId);

    if (error) throw error;
    return { success: true };
}

// ============ DATA ACCESS FOR TEACHERS ============

// List songs for a specific student (teacher view)
export async function listStudentSongs(studentId) {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', studentId)
        .order('title');

    if (error) throw error;
    return data || [];
}

// List lessons for a specific student (teacher view)
export async function listStudentLessons(studentId) {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', studentId)
        .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
}
