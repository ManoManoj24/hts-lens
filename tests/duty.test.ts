import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedDuty} from '../lib/duty.ts';
import {formatUnit} from '../lib/hts.ts';

test('keeps an explicit Free rate', () => {
  assert.equal(publishedDuty('Free'), 'Free');
});

test('keeps a published ad valorem or specific rate', () => {
  assert.equal(publishedDuty('10%'), '10%');
  assert.equal(publishedDuty('1¢/kg'), '1¢/kg');
});

test('does not invent Free for a blank official cell', () => {
  assert.equal(publishedDuty(''), 'Not listed');
  assert.equal(publishedDuty('   '), 'Not listed');
  assert.equal(publishedDuty(undefined), 'Not listed');
});

test('formats official unit arrays without raw JSON brackets', () => {
  assert.equal(formatUnit('["No.","kg"]'), 'No., kg');
  assert.equal(formatUnit(''), 'Not specified');
});
