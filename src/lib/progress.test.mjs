import test from 'node:test';
import assert from 'node:assert/strict';
import { progressPercent, nonNegativeNumber } from './progress.js';
test('progress preserves fractions and numeric strings without inventing a minimum percentage',()=>{assert.equal(progressPercent('1',1000),0.1);assert.equal(progressPercent(0,10),0);assert.equal(progressPercent(5,10),50);});
test('progress safely clamps invalid values and overflow',()=>{for(const n of [NaN,Infinity,undefined,-10])assert.equal(progressPercent(n),0);assert.equal(progressPercent(200),100);assert.equal(progressPercent(10,0),0);assert.equal(nonNegativeNumber('4'),4);});
test('revenue and bookings use separate scales',()=>{assert.equal(progressPercent(5,10),50);assert.equal(progressPercent(5000,10000),50);});
