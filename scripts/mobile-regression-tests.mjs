import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  throw new Error(message);
};
const assertIncludes = (file, needle, message) => {
  const content = read(file);
  if (!content.includes(needle)) fail(`${file}: ${message}\nMissing: ${needle}`);
};
const assertNotIncludes = (file, needle, message) => {
  const content = read(file);
  if (content.includes(needle)) fail(`${file}: ${message}\nUnexpected: ${needle}`);
};
const assertMatches = (file, regex, message) => {
  const content = read(file);
  if (!regex.test(content)) fail(`${file}: ${message}\nMissing pattern: ${regex}`);
};
const assertNotExists = (file, message) => {
  if (fs.existsSync(path.join(root, file))) fail(`${file}: ${message}`);
};

// Login/mobile load performance: unauthenticated users should not download the
// whole authenticated app (cards, charts, Gemini SDK) before seeing login.
assertIncludes('src/main.jsx', "./AppShell.jsx", 'main must render a lightweight auth shell');
assertMatches('src/AppShell.jsx', /lazy\(\(\)\s*=>\s*import\(['"]\.\/App\.jsx['"]\)\)/, 'authenticated App must be lazily imported');
assertNotIncludes('src/App.jsx', "@/components/LoginPage", 'authenticated app chunk must not import LoginPage');
assertNotIncludes('src/App.jsx', 'InsightsTab', 'unused AI insights must stay out of the core app bundle');
assertNotIncludes('package.json', '@google/genai', 'unused Gemini SDK must not ship to either user');

// Black-screen regression: auth bootstrap must have bounded waiting and recover
// after mobile Safari/Chrome restores the page from background/bfcache.
assertIncludes('src/context/AuthContext.jsx', 'AUTH_BOOTSTRAP_TIMEOUT_MS', 'auth bootstrap must have an explicit timeout');
assertIncludes('src/context/AuthContext.jsx', 'Promise.race', 'auth bootstrap must not wait forever for Supabase');
assertIncludes('src/context/AuthContext.jsx', "addEventListener('pageshow'", 'auth state should be refreshed after bfcache restore');
assertIncludes('src/context/AuthContext.jsx', "addEventListener('visibilitychange'", 'auth state should be refreshed when returning to the app');

// Mobile responsiveness: tab navigation should be scheduled as non-urgent work,
// and lesson cards need explicit touch-action for horizontal Framer Motion drag.
assertIncludes('src/App.jsx', 'useTransition', 'tab navigation should use React transitions');
assertIncludes('src/App.jsx', 'handleTabChange', 'tab changes should go through the transition helper');
assertIncludes('src/components/LessonStack.jsx', 'touchAction', 'mobile swipe target must set touch-action for x-drag');
assertIncludes('src/components/LessonStack.jsx', 'dragDirectionLock', 'mobile swipe should lock to horizontal drag');
assertIncludes('src/components/LessonStack.jsx', 'x.set(0)', 'swipe motion value should reset after card changes');
assertIncludes('src/components/MobileLessonCard.jsx', 'onEdit', 'mobile lesson cards must expose the core edit action');
assertIncludes('src/components/AddLessonModal.jsx', '100dvh', 'lesson editor must fit the mobile visual viewport');

// Cross-device consistency: writes stay visible while Realtime propagates them
// to the other participant.
assertIncludes('src/lib/supabaseApi.js', 'subscribeToLibrary', 'library must subscribe to Supabase changes');
assertIncludes('src/App.jsx', 'applyDatabaseChange', 'database events and successful writes must update local state');
assertIncludes('src/components/AddLessonModal.jsx', 'await onSubmit', 'editor must not close before Supabase confirms the save');
assertIncludes('src/components/AddLessonModal.jsx', 'expected_updated_at', 'lesson edits must detect cross-device conflicts');
assertIncludes('src/lib/supabaseApi.js', ".eq('user_id', LESPAL_WORKSPACE_ID)", 'all reads must target the shared library');
assertIncludes('src/App.jsx', "realtimeStatus === 'SUBSCRIBED'", 'failed Realtime connections need polling fallback');
assertIncludes('src/App.jsx', "await onSubmit", 'song editor must wait for confirmed saves');

// Lespal is a fixed two-person workspace. There are no roles, invites, or
// relationship records to drift out of sync.
assertNotExists('src/lib/sharingApi.js', 'obsolete sharing API must stay removed');
assertNotExists('src/lib/privatePairing.js', 'role-based pairing config must stay removed');
assertNotIncludes('src/App.jsx', 'isTeacher', 'the shared app must not branch by role');
assertNotIncludes('src/context/AuthContext.jsx', 'isTeacher', 'authentication must not infer roles');
assertNotIncludes('supabase-shared-workspace.sql', 'CREATE TABLE IF NOT EXISTS teacher_students', 'the fixed workspace needs no relationship table');
assertIncludes('supabase-shared-workspace.sql', 'DROP TABLE IF EXISTS public.teacher_students', 'the relationship table must be removed');
assertIncludes('supabase-shared-workspace.sql', 'Lespal members can update shared lessons', 'both members need explicit shared lesson access');

console.log('mobile regression checks passed');
