import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptBankInput, validateBankChanges, validateBankField } from './bankInput.js';

test('account input keeps zeros and case, rejects invalid pastes and enforces boundaries', () => {
  assert.equal(acceptBankInput('accountNumber', '00aB123').value, '00aB123');
  for (const value of ['12 3456', '123-456', '1'.repeat(26)]) assert.ok(acceptBankInput('accountNumber', value).error);
  for (const size of [6, 25]) assert.equal(validateBankField('accountNumber', '0'.repeat(size)), '');
  for (const size of [0, 5, 26]) assert.ok(validateBankField('accountNumber', '0'.repeat(size)));
});
test('IFSC supports partial typing, uppercase normalization, and exact structure', () => {
  assert.equal(acceptBankInput('ifscCode', 'hdfc0').value, 'HDFC0');
  assert.equal(validateBankField('ifscCode', 'hdfc0001234'), '');
  for (const value of ['1DFC0001234', 'HDFC1001234', 'HDFC000123', 'HDFC00012345', 'HDFC00!1234']) assert.ok(validateBankField('ifscCode', value));
});
test('holder names support businesses and Unicode without emoji or markup', () => {
  for (const value of ["O’Neil & Sons (India) / Unit-2", 'कुमार', 'A'.repeat(100)]) assert.equal(validateBankField('accountHolder', value), '');
  for (const value of ['', 'A', '12345', 'A'.repeat(101), 'Name😀', '<Name>', 'A\nB', 'A\tB']) assert.ok(validateBankField('accountHolder', value));
});

test('partial edits preserve omitted account and legacy fields; rejected paste blocks saving', () => {
  assert.deepEqual(validateBankChanges({}), {});
  assert.deepEqual(validateBankChanges({ ifscCode: 'HDFC0001234' }), { ifscCode: '' });
  assert.ok(validateBankChanges({ accountNumber: '' }).accountNumber);
  const rejected = { accountNumber: 'Account number must not exceed 25 characters' };
  assert.equal(validateBankChanges({}, rejected).accountNumber, rejected.accountNumber);
});
