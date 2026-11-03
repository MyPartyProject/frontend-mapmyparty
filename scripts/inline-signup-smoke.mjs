import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isStrongPassword, PASSWORD_REQUIREMENTS_TEXT } from '../src/utils/passwordRules.js';
import { normalizeTenDigitPhoneNumber } from '../src/utils/phone.js';

const source = await readFile(new URL('../src/pages/EventDetailNew.jsx', import.meta.url), 'utf8');
const handlers = source.slice(source.indexOf('  const handleInlineSignup ='), source.indexOf('  const handleGoogleLogin ='));
function setup({ sendFails = false, authenticated = true } = {}) {
  const state = { signupForm: { name: ' Test User ', email: ' test@example.com ', phone: '9876543210', password: 'Test@12345' }, signupOtpEmail: '', authModalOpen: true, billingModalOpen: false, loginForm: {}, authMode: 'signup' };
  const requests = [];
  const context = { ...state, isStrongPassword, PASSWORD_REQUIREMENTS_TEXT, normalizeTenDigitPhoneNumber,
    toast: { error() {}, success() {} }, resetSessionCache() {},
    fetchSession: async () => ({ isAuthenticated: authenticated, user: { id: 'user' } }),
    syncAuthSession: async () => {},
    apiFetch: async (endpoint, options) => { requests.push({ endpoint, body: JSON.parse(options.body) }); if (sendFails) throw Error('Send failed'); },
  };
  for (const key of ['signupForm','signupOtpEmail','authModalOpen','billingModalOpen','loginForm','authMode','authLoading','isSessionAuthed','sessionUser']) {
    context['set' + key[0].toUpperCase() + key.slice(1)] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; context[key] = state[key]; };
  }
  vm.createContext(context);
  vm.runInContext(handlers + '\nthis.submit = handleInlineSignup; this.close = handleSignupOtpClose; this.success = handleSignupOtpSuccess;', context);
  return { state, requests, context };
}
for (const authenticated of [true, false]) {
  const { state, requests, context } = setup({ authenticated });
  await context.submit({ preventDefault() {} });
  assert.equal(requests[0].endpoint, 'auth/send-signup-otp');
  assert.equal(requests[0].body.email, 'test@example.com');
  assert.equal(requests[0].body.role, 'USER');
  assert.equal(state.billingModalOpen, false);
  assert.equal(state.signupOtpEmail, 'test@example.com');
  await context.success();
  assert.equal(state.billingModalOpen, authenticated);
  assert.equal(state.signupForm.password, '');
  if (!authenticated) { assert.equal(state.authMode, 'login'); assert.equal(state.authModalOpen, true); }
}
const failed = setup({ sendFails: true });
await failed.context.submit({ preventDefault() {} });
assert.equal(failed.state.signupOtpEmail, '');
assert.equal(failed.state.authModalOpen, true);
const cancelled = setup();
await cancelled.context.submit({ preventDefault() {} });
cancelled.context.close();
assert.equal(cancelled.state.authMode, 'signup');
assert.equal(cancelled.state.billingModalOpen, false);
for (const patch of [{ password: 'weak' }, { phone: '123' }, { name: ' ' }]) {
  const check = setup(); Object.assign(check.state.signupForm, patch);
  await check.context.submit({ preventDefault() {} }); assert.equal(check.requests.length, 0);
}
console.log('PASS inline signup OTP request, validation, cancellation, verified continuation and session recovery');
