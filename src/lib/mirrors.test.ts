// Jalankan: node --test src/lib/mirrors.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeMirrors } from './mirrors.ts';

test('embed src menang atas streamUrl yang terpotong, entity di-decode', () => {
  const [m] = normalizeMirrors([
    {
      name: 'Dailymotion',
      streamUrl: 'https://www.dailymotion.com/embed/video/k6buWu',
      embedCode:
        '<iframe src="https://geo.dailymotion.com/player.html?autoplay=0&amp;video=k6buWuR4fzrDEdIVRL0"></iframe>',
    },
  ]);
  assert.equal(m.streamUrl, 'https://www.dailymotion.com/embed/video/k6buWuR4fzrDEdIVRL0');
});

test('partner player xid dikanonikalkan ke /embed/video', () => {
  const [m] = normalizeMirrors([
    { name: 'Dailymotion', streamUrl: 'https://geo.dailymotion.com/player/xid0t.html?video=k5RNIHP1L0RBVjF06Vq' },
  ]);
  assert.equal(m.streamUrl, 'https://www.dailymotion.com/embed/video/k5RNIHP1L0RBVjF06Vq');
});

test('mirror non-Dailymotion tidak disentuh', () => {
  const [d, o] = normalizeMirrors([
    { name: 'Dtube', streamUrl: 'https://play.d.tube/?v=1820f158-34d7-4123-9f10-016506fc29be' },
    { name: 'Okru', streamUrl: 'https://morencius.com/embed/1zdo1hd9outw' },
  ]);
  assert.equal(d.streamUrl, 'https://play.d.tube/?v=1820f158-34d7-4123-9f10-016506fc29be');
  assert.equal(o.streamUrl, 'https://morencius.com/embed/1zdo1hd9outw');
});

// Regresi: referrerPolicy="no-referrer" membuat http_referer kosong, dan gate
// PV5_BLOCK_EMPTY_EMBEDDER di player Dailymotion membalasnya dengan
// PLAYER_ERR_EMPTY_EMBEDDER ("Video ini tidak dapat diputar di situs ini").
test('iframe player tidak memakai no-referrer', () => {
  const src = readFileSync(new URL('../components/WatchModal.tsx', import.meta.url), 'utf8');
  assert.ok(!/referrerPolicy=["']no-referrer["']/.test(src));
});
