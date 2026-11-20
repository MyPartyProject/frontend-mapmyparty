import { ESLint } from 'eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
const linter = new ESLint({ overrideConfigFile: true, overrideConfig: [{ files: ['**/*.js', '**/*.jsx'], languageOptions: { globals: globals.browser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } }, plugins: { 'react-hooks': hooks }, rules: { 'no-undef': 'error', 'react-hooks/rules-of-hooks': 'error' } }] });
const results = await linter.lintFiles(['src/components/venues', 'src/pages/VenuePage.jsx', 'src/pages/Venues.jsx', 'src/services/venueService.js', 'src/hooks/useVenuesEnabled.js']);
const formatter = await linter.loadFormatter('stylish');
console.log(formatter.format(results) || 'Venue JavaScript/JSX declaration and hook checks passed.');
if (results.some(result => result.errorCount)) process.exitCode = 1;
