const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  // Support both custom header and standard Authorization bearer token
  let token = req.header('x-auth-token');

  // If not provided, try standard Authorization header: "Bearer <token>"
  if (!token) {
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim(); // Remove 'Bearer '
    }
  }

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
