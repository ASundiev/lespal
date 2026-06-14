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

// Login/mobile load performance: unauthenticated users should not download the
// whole authenticated app (cards, charts, Gemini SDK) before seeing login.
assertIncludes('src/main.jsx', "./AppShell.jsx", 'main must render a lightweight auth shell');
assertMatches('src/AppShell.jsx', /lazy\(\(\)\s*=>\s*import\(['"]\.\/App\.jsx['"]\)\)/, 'authenticated App must be lazily imported');
assertNotIncludes('src/App.jsx', "@/components/LoginPage", 'authenticated app chunk must not import LoginPage');
assertMatches('src/App.jsx', /lazy\(\(\)\s*=>[\s\S]*import\(['"]@\/components\/InsightsTab['"]\)/, 'Insights/Gemini code must be lazily imported until the Insights tab is opened');

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

console.log('mobile regression checks passed');
