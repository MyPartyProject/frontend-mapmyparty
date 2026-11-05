import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('shared consumers retain transport and room acknowledgements time out', async () => {
  let disconnects = 0;
  const socket = { connected: true, on() {}, disconnect() { disconnects++; }, timeout(ms) {
    assert.equal(ms, 10000);
    return { emit(name, data, callback) { callback(new Error('timeout')); } };
  } };
  globalThis.__analyticsTestSocket = socket;
  const source = (await readFile(new URL('./socketService.js', import.meta.url), 'utf8'))
    .replace('import { io } from "socket.io-client";', 'const io = () => globalThis.__analyticsTestSocket;')
    .replace('import { API_BASE_URL, apiFetch } from "@/config/api";', 'const API_BASE_URL = "http://localhost/api"; const apiFetch = async () => ({});');
  const service = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  service.connectTicketAnalytics('test');
  service.connectTicketAnalytics('test');
  service.disconnectTicketAnalytics();
  assert.equal(disconnects, 0);
  assert.match((await service.joinEventRoom('event')).error, /timed out/);
  service.disconnectTicketAnalytics();
  assert.equal(disconnects, 1);
  delete globalThis.__analyticsTestSocket;
});
