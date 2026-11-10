import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { cva } from 'class-variance-authority';
import postcss from 'postcss';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/components/ui/button.jsx');
const declaration = source.slice(source.indexOf('const buttonVariants ='), source.indexOf('const Button ='));
const buttonVariants = new Function('cva', `${declaration}; return buttonVariants;`)(cva);
const css = postcss.parse(read('src/index.css'));
const selector = 'html .cta-primary:not(.cta-preserve):not(.bg-destructive)';
const rules = [];
css.walkRules(rule => { if (rule.selector.includes('.cta-primary')) rules.push(rule); });
const declarationOf = (rule, prop) => rule.nodes.find(node => node.prop === prop);

test('filled variants receive pink styling; neutral and destructive variants do not', () => {
  for (const variant of ['default', 'primaryCTA', 'accent']) {
    const classes = buttonVariants({ variant });
    assert.ok(classes.split(' ').includes('cta-primary'), variant);
    assert.ok(classes.includes('disabled:pointer-events-none'));
    assert.ok(classes.includes('focus-visible:ring-2'));
  }
  for (const variant of ['destructive', 'outline', 'secondary', 'ghost', 'link', 'hero']) {
    assert.ok(!buttonVariants({ variant }).split(' ').includes('cta-primary'), variant);
  }
});

test('CTA overrides are theme-independent and do not recolor brand tokens or destructive actions', () => {
  const base = rules.find(rule => rule.selector === selector);
  assert.equal(declarationOf(base, 'background-color').value, '#EC4899');
  assert.equal(declarationOf(base, 'background-image').value, 'none');
  assert.equal(declarationOf(base, 'color').value, '#FFFFFF');
  assert.ok(declarationOf(base, 'background-color').important, 'wins over page-specific backgrounds');
  for (const rule of rules) {
    assert.ok(rule.selector.includes(':not(.cta-preserve)'));
    assert.ok(rule.selector.includes(':not(.bg-destructive)'));
    assert.ok(!rule.nodes.some(node => node.prop?.startsWith('--primary')));
  }
});

test('lift is limited to enabled hover-capable controls and reduced motion takes precedence', () => {
  const hover = rules.find(rule => rule.parent.params === '(hover: hover) and (pointer: fine)');
  assert.ok(hover.selector.includes(':not(:disabled):not([aria-disabled="true"]):hover'));
  assert.equal(declarationOf(hover, 'translate').value, '0 -2px');
  const pressed = rules.find(rule => rule.selector === `${selector}:not(:disabled):not([aria-disabled="true"]):active`);
  assert.equal(declarationOf(pressed, 'translate').value, '0 0');
  const reduced = rules.find(rule => rule.parent.params === '(prefers-reduced-motion: reduce)');
  assert.equal(declarationOf(reduced, 'translate').value, 'none');
  assert.ok(declarationOf(reduced, 'translate').important, 'overrides the more specific enabled hover selector');
});

test('landing hero reuses the shared CTA treatment', () => {
  const landing = read('src/landing/LandingPage.jsx');
  assert.ok(landing.includes('className="cta-primary h-auto rounded-xl'));
  assert.ok(!landing.includes('.landing-hero-cta'));
});
