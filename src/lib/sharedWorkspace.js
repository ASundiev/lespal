// Lespal has one permanent library shared by its two authenticated members.
// This identifier matches the existing rows, so simplifying access does not
// require moving or rewriting lesson and song data.
export const LESPAL_WORKSPACE_ID = 'a7f4579f-e464-4c11-aadc-2297791de158';

export const LESPAL_MEMBER_EMAILS = [
    'inbox@asundiev.com',
    'andreymolodov@mail.ru',
];

export function isLespalMember(user) {
    const email = user?.email?.trim().toLowerCase();
    return Boolean(email && LESPAL_MEMBER_EMAILS.includes(email));
}
