import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { transformWithEsbuild } from 'vite';

const source = await readFile(new URL('../src/pages/CreateEvent.jsx', import.meta.url), 'utf8');
const previous = execFileSync('git', ['show', ':src/pages/CreateEvent.jsx'], { encoding: 'utf8' });
const now = new Date('2030-09-15T12:00:00').getTime();
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
const defaults = { startDate: '2030-09-15', startTime: '13:00', endDate: '2030-09-15', endTime: '14:00', isEditMode: false };
function setup(code, values = {}) {
  const state = { ...defaults, ...values };
  const notices = [];
  const context = {
    ...state, Date: FixedDate,
    eventCacheRef: { current: values.saved || null },
    toast: { info: message => notices.push(message), error: message => notices.push(message) },
  };
  for (const key of ['startTime', 'endTime']) {
    context[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => { state[key] = value; context[key] = value; };
  }
  vm.createContext(context);
  const helpers = code.slice(code.indexOf('  const hourOptions ='), code.indexOf('  const TimePicker ='));
  vm.runInContext(`${helpers}\nthis.api = { validateEventDateTime, buildTime, parseTime, handleStartTimeChange, handleEndTimeChange ${code.includes('const validateTimeSelection =') ? ', validateTimeSelection' : ''} };`, context);
  return { state, notices, context, api: context.api };
}

const saved = { startDate: '2030-09-15T10:00:00', endDate: '2030-09-15T16:00:00', eventStatus: 'UPCOMING' };
const scenarios = [
  {}, { startDate: '' }, { startTime: '' }, { endDate: '' }, { endTime: '' },
  { startDate: '2030-02-30' }, { startTime: '25:00' }, { endTime: '14:60' },
  { startTime: '11:00' }, { startTime: '12:00' }, { endTime: '13:00' }, { endTime: '12:30' },
  { endDate: '2030-09-16', endTime: '00:00' },
  { isEditMode: true, saved, startTime: '10:00' },
  { isEditMode: true, saved, startTime: '10:00', endTime: '12:00' },
  { isEditMode: true, saved: { ...saved, eventStatus: 'CANCELLED' }, startTime: '10:00' },
];
for (const scenario of scenarios) {
  assert.equal(JSON.stringify(setup(source, scenario).api.validateEventDateTime()), JSON.stringify(setup(previous, scenario).api.validateEventDateTime()), `Existing full-schedule result changed: ${JSON.stringify(scenario)}`);
}
const start = setup(source, { endDate: '', endTime: '' });
assert.equal(start.api.validateTimeSelection('start', '13:00'), null);
assert.match(start.api.validateTimeSelection('start', '11:00'), /must be in the future/);
assert.equal(start.api.validateTimeSelection('start', ''), 'Starting time is required');
assert.equal(setup(source, { startDate: '' }).api.validateTimeSelection('start', '13:00'), 'Starting date is required');
const end = setup(source);
assert.match(end.api.validateTimeSelection('end', '13:00'), /must be after/);
assert.match(end.api.validateTimeSelection('end', '12:30'), /must be after/);
assert.equal(end.api.validateTimeSelection('end', '14:00'), null);
assert.equal(setup(source, { endDate: '' }).api.validateTimeSelection('end', '14:00'), 'Ending date is required');
assert.equal(end.api.validateTimeSelection('end', ''), 'Ending time is required');
assert.equal(setup(source, { isEditMode: true, saved, startTime: '10:00' }).api.validateTimeSelection('start', '10:00'), null);
assert.match(setup(source, { isEditMode: true, saved, startTime: '10:00' }).api.validateTimeSelection('end', '11:00'), /must be in the future/);
end.api.handleStartTimeChange('15:00');
assert.equal(end.state.endTime, '');
assert.match(end.notices[0], /Ending time cleared/);
assert.equal(end.api.buildTime('12', '00', 'AM'), '00:00');
assert.equal(end.api.buildTime('12', '00', 'PM'), '12:00');

// Exercise the real picker JSX and handlers with a small hook harness.
const pickerSource = source.slice(source.indexOf('  const TimePicker ='), source.indexOf('  const editId ='));
const { code } = await transformWithEsbuild(`${pickerSource}\nthis.Picker = TimePicker;`, 'time-picker.jsx', { jsx: 'transform', jsxFactory: 'createElement' });
function pickerHarness(props, values = {}) {
  const instance = setup(source, values);
  let hooks = [], cursor = 0, tree;
  Object.assign(instance.context, {
    useState: initial => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], value => { hooks[index] = value; }];
    },
    useEffect() {}, Button: 'Button',
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat() } }),
  });
  vm.runInContext(code, instance.context);
  const render = () => { cursor = 0; tree = instance.context.Picker(props); };
  const find = (node, text) => {
    if (!node || typeof node !== 'object') return null;
    if (['button', 'Button'].includes(node.type) && node.props.children.includes(text)) return node;
    for (const child of node.props.children || []) { const match = find(child, text); if (match) return match; }
    return null;
  };
  render();
  return { instance, click(text, column) { const button = find(column === undefined ? tree : tree.props.children[column], text); assert.ok(button, `Button ${text} exists`); button.props.onClick(); render(); } };
}
let committed = '', closed = 0;
const validation = setup(source);
const props = { value: '', defaultAmpm: 'PM', validateValue: value => validation.api.validateTimeSelection('start', value), onChange: value => { committed = value; }, onClose: () => { closed++; } };
const picker = pickerHarness(props);
picker.click('OK');
assert.equal(closed, 0);
assert.equal(committed, '');
picker.click('01', 0); picker.click('05', 1); picker.click('AM');
assert.equal(closed, 0);
assert.equal(committed, '', 'Selecting parts must not commit');
picker.click('OK');
assert.equal(closed, 0, 'Invalid OK keeps the picker open');
assert.equal(committed, '');
picker.click('PM'); picker.click('OK');
assert.equal(committed, '13:05');
assert.equal(closed, 1);
const dismissed = pickerHarness({ ...props, value: committed });
dismissed.click('02');
assert.equal(committed, '13:05');
pickerHarness({ ...props, value: committed }).click('OK');
assert.equal(committed, '13:05', 'Reopening after dismissal uses the committed value');

let confirmedEnd = '', endClosed = 0;
const endPicker = pickerHarness({
  value: '', defaultAmpm: 'PM',
  validateValue: value => validation.api.validateTimeSelection('end', value),
  onChange: value => { confirmedEnd = value; }, onClose: () => { endClosed++; },
});
endPicker.click('01', 0); endPicker.click('OK');
assert.equal(endClosed, 0, 'End equal to start stays open');
assert.equal(confirmedEnd, '');
endPicker.click('02', 0); endPicker.click('OK');
assert.equal(confirmedEnd, '14:00');
assert.equal(endClosed, 1);

console.log(`PASS ${scenarios.length} unchanged schedule scenarios, selected-time validation, ongoing edits, time conversion, draft selection, invalid/valid OK, and dismissal recovery`);
