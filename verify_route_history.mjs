import assert from 'node:assert/strict';

const routePath = (route) => `/${route.type}/${encodeURIComponent(route.slug).replaceAll('%2F', '/')}`;
const routeFromPath = (pathname) => {
  const match = pathname.match(/^\/(detail|watch)\/(.+?)\/?$/);
  if (!match) return null;
  try { return { type: match[1], slug: decodeURIComponent(match[2]) }; } catch { return null; }
};

const detail = { type: 'detail', slug: 'donghua/name-with-dash' };
const watch = { type: 'watch', slug: 'episode/title with space' };
assert.deepEqual(routeFromPath(routePath(detail)), detail);
assert.deepEqual(routeFromPath(routePath(watch)), watch);
assert.equal(routeFromPath('/'), null);
assert.equal(routeFromPath('/unknown/foo'), null);
console.log('PASS: route URLs round-trip; home and unknown paths stay un-routed');
