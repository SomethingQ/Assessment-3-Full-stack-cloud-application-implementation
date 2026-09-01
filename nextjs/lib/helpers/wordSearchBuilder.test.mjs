import test from 'node:test';
import assert from 'node:assert/strict';

import { generateWordSearchHTML } from './wordSearchBuilder.ts';

test('generated word search cells are semantic and keyboard-accessible', () => {
  const html = generateWordSearchHTML({
    words: [{ phonemes: ['a', 'b'] }],
    rows: 2,
    cols: 2,
    showHints: true,
  });

  assert.match(html, /document\.createElement\('button'\)/i);
  assert.match(html, /cell\.setAttribute\('role', 'gridcell'\)/i);
  assert.match(html, /\.grid-cell:focus-visible\s*\{|\.grid-cell:focus\s*\.tooltip|\.grid-cell:focus-visible\s*\.tooltip/i);
  assert.match(html, /role="grid"/i);
});
