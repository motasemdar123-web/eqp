const { ApiError } = require('../utils/ApiError');

async function verifyUser(req, res) {
  throw new ApiError(410, 'Microsoft authentication is required.');
}

module.exports = { verifyUser };
