const admin = require('firebase-admin');
const logger = require('../utils/logger');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Error verifying Firebase ID token');
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or expired' });
  }
};

module.exports = requireAuth;
