import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GetState, GetCity } from 'react-country-state-city';
import { INDIA_COUNTRY_ID, findLocation, sortLocations } from './indiaLocation.js';

const readData = async (file) => JSON.parse(await readFile(new URL(`../../public/data/india/${file}`, import.meta.url), 'utf8'));

test('library loads India data from the supplied local source and propagates failures', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    requests.push(url);
    assert.ok(url.startsWith('/data/india/'));
    return { json: () => readData(url.split('/').pop()) };
  });
  const states = await GetState(INDIA_COUNTRY_ID, '/data/india');
  const cities = await GetCity(INDIA_COUNTRY_ID, findLocation(states, 'Delhi').id, '/data/india');
  assert.equal(states.length, 36);
  assert.ok(findLocation(cities, 'New Delhi'));
  assert.deepEqual(requests, ['/data/india/statesminified.json', '/data/india/citiesminified.json']);
  globalThis.fetch = async () => { throw new Error('Unavailable'); };
  await assert.rejects(GetState(INDIA_COUNTRY_ID, '/data/india'), /Unavailable/);
});

test('India assets contain matching state/city groups and preserve saved names', async () => {
  const [statesData, citiesData] = await Promise.all([readData('statesminified.json'), readData('citiesminified.json')]);
  assert.equal(statesData.length, 1);
  assert.equal(citiesData.length, 1);
  assert.equal(statesData[0].id, INDIA_COUNTRY_ID);
  assert.equal(citiesData[0].id, INDIA_COUNTRY_ID);
  const states = statesData[0].states;
  assert.equal(states.length, 36);
  assert.deepEqual(new Set(states.map((state) => state.id)), new Set(citiesData[0].states.map((state) => state.id)));
  const original = structuredClone(states);
  const sorted = sortLocations(states);
  assert.deepEqual(states, original);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i - 1].name.localeCompare(sorted[i].name, 'en-IN', { sensitivity: 'base' }) <= 0);
  assert.equal(findLocation(states, ' delHI ').name, 'Delhi');
  assert.equal(findLocation(states, 'Unlisted saved state'), undefined);
  const delhi = citiesData[0].states.find((state) => state.id === findLocation(states, 'Delhi').id).cities;
  const maharashtra = citiesData[0].states.find((state) => state.id === findLocation(states, 'Maharashtra').id).cities;
  assert.equal(findLocation(delhi, 'Delhi').name, 'Delhi');
  assert.equal(findLocation(maharashtra, 'Mumbai').name, 'Mumbai');
  assert.equal(findLocation(delhi, 'Mumbai'), undefined);
  for (const state of citiesData[0].states) {
    const cities = sortLocations(state.cities);
    assert.ok(cities.length > 0);
    for (let i = 1; i < cities.length; i++) assert.ok(cities[i - 1].name.localeCompare(cities[i].name, 'en-IN', { sensitivity: 'base' }) <= 0);
  }
});
