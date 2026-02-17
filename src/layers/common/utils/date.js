const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

/**
 * @param {Date|string|number} [d] - Date to format
 * @returns {string} ISO 8601 string
 */
function toISO(d) {
  if (d == null) return null;
  return dayjs(d).utc().toISOString();
}

/**
 * @returns {string} Current ISO 8601 timestamp
 */
function nowISO() {
  return dayjs().utc().toISOString();
}

module.exports = {
  dayjs,
  toISO,
  nowISO,
};
