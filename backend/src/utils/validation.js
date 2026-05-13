const { ApiError } = require('./ApiError');

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');

  if (missing.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }
}

function toPositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }

  return number;
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an array`);
  }
}

function assertDateStrings(values, fieldName) {
  assertArray(values, fieldName);

  values.forEach((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(value).getTime())) {
      throw new ApiError(400, `${fieldName} contains an invalid date`);
    }
  });
}

module.exports = {
  requireFields,
  toPositiveInteger,
  assertArray,
  assertDateStrings,
};
