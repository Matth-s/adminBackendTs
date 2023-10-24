const admin = require('firebase-admin');

async function verifyToken(token) {
  const tokenFormat = token.replace('Bearer ', '');
  try {
    const decodedToken = await admin
      .auth()
      .verifyIdToken(tokenFormat);
    const uid = decodedToken.uid;

    if (uid === 'itlUt6nOAHd7FG5NvAn1gpykzf42') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

module.exports = verifyToken;
