import assert from 'node:assert/strict';
import { formatLessonDate, parseDateOnly, todayDateInput } from '../src/lib/dateUtils.js';

const parsed = parseDateOnly('2026-06-14');
assert.equal(parsed.getFullYear(), 2026);
assert.equal(parsed.getMonth(), 5);
assert.equal(parsed.getDate(), 14);
assert.equal(formatLessonDate('2026-06-14'), '14 Jun 2026');
assert.equal(todayDateInput(new Date(2026, 5, 9, 23, 30)), '2026-06-09');

console.log('date utility checks passed');
