const userRepository = require('../repositories/userRepository');
const { ApiError } = require('../utils/ApiError');
const { requireFields, toPositiveInteger } = require('../utils/validation');
const { createSessionToken } = require('../utils/sessionToken');

async function verifyUser(req, res) {
  requireFields(req.body, ['userNumber']);

  const userNumber = toPositiveInteger(req.body.userNumber, 'userNumber');
  const user = await userRepository.findByUserNumber(userNumber);

  if (!user) {
    throw new ApiError(404, 'Invalid user code');
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      userNumber: user.user_number,
      fullName: user.full_name,
      sessionToken: createSessionToken(user),
    },
  });
}

module.exports = { verifyUser };
