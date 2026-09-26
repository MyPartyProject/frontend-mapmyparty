export const INDIA_COUNTRY_ID = 101;

const normalizeName = (value = "") => value.trim().toLocaleLowerCase("en-IN");

export const findLocation = (options, value) =>
  options.find((option) => normalizeName(option.name) === normalizeName(value));

export const sortLocations = (options) =>
  [...options].sort((a, b) => a.name.localeCompare(b.name, "en-IN", { sensitivity: "base" }));
