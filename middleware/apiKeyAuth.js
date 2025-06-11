// This middleware checks for a valid API key in the request headers.
// It's used to protect public but sensitive/expensive endpoints from abuse.

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-KEY');

  // Check if API key is present
  if (!apiKey) {
    return res.status(401).json({ msg: 'Access denied. No API key provided.' });
  }

  // Check if the API key is valid (compare with the one in your .env file)
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ msg: 'Access denied. Invalid API key.' });
  }

  // If the key is valid, proceed to the next middleware or route handler
  next();
};

module.exports = apiKeyAuth;
