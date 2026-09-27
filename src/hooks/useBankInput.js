import { useEffect, useRef, useState } from 'react';
import { acceptBankInput, bankInputRules, validateBankChanges, validateBankField } from '../utils/bankInput';

export function useBankInput(active = true) {
  const [errors, setErrors] = useState({});
  const rejected = useRef({});
  useEffect(() => { setErrors({}); rejected.current = {}; }, [active]);
  const setError = (field, message) => setErrors((previous) => ({ ...previous, [field]: message }));
  const props = (field, value, update, { unchanged = false, optional = false } = {}) => {
    const change = (raw) => {
      const result = acceptBankInput(field, raw);
      rejected.current[field] = result.error || '';
      setError(field, result.error || '');
      if (!result.error) update(result.value);
    };
    return {
      name: field,
      maxLength: bankInputRules[field].max,
      'aria-label': bankInputRules[field].label,
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': errors[field] ? `bank-${field}-error` : undefined,
      onChange: (event) => change(event.target.value),
      onBlur: () => setError(field, rejected.current[field] || (unchanged || (optional && !value) ? '' : validateBankField(field, value))),
      onPaste: (event) => {
        event.preventDefault();
        const input = event.currentTarget;
        const pasted = event.clipboardData.getData('text');
        change(value.slice(0, input.selectionStart ?? value.length) + pasted + value.slice(input.selectionEnd ?? value.length));
      },
    };
  };
  const validate = (payload) => {
    const next = validateBankChanges(payload, rejected.current);
    setErrors(next);
    const first = Object.keys(bankInputRules).find((field) => next[field]);
    if (first) document.querySelector(`[name="${first}"]`)?.focus();
    return !first;
  };
  return { errors, props, validate };
}
