// Lespal is currently a private two-person app: one student and one teacher.
// Supabase RLS still enforces the actual database relationship; these IDs only
// remove invite-code UI and make the teacher land directly on the student's data.
export const LESPAL_PAIRING = {
    teacherId: '9324f346-6443-44d2-8a4d-07e319c9b1c2',
    studentId: 'a7f4579f-e464-4c11-aadc-2297791de158',
};
