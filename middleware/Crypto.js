const crypto = require('crypto-js');
const dotenv = require('dotenv');
dotenv.config();

exports.encryptData = (data) => {
  const encryptedData = crypto.AES.encrypt(
    data,
    process.env.SECRET_KEY_CRYPTO_JS
  ).toString();
  return encryptedData;
};

exports.decryptData = (encryptedData) => {
  try {
    const bytes = crypto.AES.decrypt(
      encryptedData,
      process.env.SECRET_KEY_CRYPTO_JS
    );
    const decryptedData = bytes.toString(crypto.enc.Utf8);
    return decryptedData;
  } catch (error) {
    return null;
  }
};
