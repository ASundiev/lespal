export function parseDateOnly(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(value);
}

export function formatLessonDate(value, options = {}) {
    return parseDateOnly(value).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', ...options
    });
}

export function todayDateInput(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
