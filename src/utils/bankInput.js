export const bankInputRules = {
  accountHolder: { max: 100, label: 'Account holder name', characters: /^[\p{L}\p{M}0-9 .\u0027\u2019&/()\-]*$/u },
  accountNumber: { max: 25, label: 'Account number', characters: /^[A-Za-z0-9]*$/ },
  ifscCode: { max: 11, label: 'IFSC code', characters: /^[A-Z0-9]*$/ },
};

export function acceptBankInput(field, raw) {
  const rule = bankInputRules[field];
  const value = field === 'ifscCode' ? raw.toUpperCase() : raw;
  if (value.length > rule.max) return { error: `${rule.label} must not exceed ${rule.max} characters` };
  if (!rule.characters.test(value)) return { error: field === 'accountHolder' ? 'Use letters, digits, spaces and common name punctuation only' : `${rule.label} accepts letters and digits only` };
  if (field === 'ifscCode' && [...value].some((char, index) => index < 4 ? !/[A-Z]/.test(char) : index === 4 && char !== '0')) {
    return { error: 'IFSC must start with four letters followed by 0' };
  }
  return { value };
}

export function validateBankField(field, raw) {
  const value = raw.trim();
  const accepted = acceptBankInput(field, value);
  if (accepted.error) return accepted.error;
  if (field === 'accountHolder' && (value.length < 2 || !/\p{L}/u.test(value))) return 'Enter a name of 2–100 characters containing at least one letter';
  if (field === 'accountNumber' && !/^[A-Za-z0-9]{6,25}$/.test(value)) return 'Account number must be 6–25 letters or digits';
  if (field === 'ifscCode' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accepted.value)) return 'Enter an 11-character IFSC, for example HDFC0001234';
  return '';
}

// Edit payloads omit unchanged values, including a blank replacement account.
export function validateBankChanges(payload, rejected = {}) {
  const errors = { ...rejected };
  for (const field of Object.keys(bankInputRules)) {
    if (Object.hasOwn(payload, field)) errors[field] = rejected[field] || validateBankField(field, payload[field]);
  }
  return errors;
}
