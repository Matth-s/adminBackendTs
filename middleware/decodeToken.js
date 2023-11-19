const admin = require('firebase-admin');

/**
 * @param {string} token
 * @returns {boolean}
 */

async function verifyToken(token) {
  const cleanedToken = token.replace('Bearer ', '');
  try {
    const decodedToken = await admin
      .auth()
      .verifyIdToken(cleanedToken);
    return decodedToken.uid === 'itlUt6nOAHd7FG5NvAn1gpykzf42';
  } catch (error) {
    return error;
  }
}

module.exports = verifyToken;
