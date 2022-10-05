const {
  createDecipheriv,
  createCipheriv,
  createHash
} = require('crypto');

const config = require("config");

const AES256Key = config.get('AES256Key'); // 64 hex
const SHA256Salt = config.get('SHA256Salt');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(AES256Key, 'hex');
const iv = Buffer.from('00000000000000000000000000000000', 'hex'); // 32 hex

const aes256Encrypt = (text, input_encoding = 'utf8', output_encoding = 'hex') => {
  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, input_encoding, output_encoding);
  encrypted += cipher.final(output_encoding);
  return encrypted;
};

const aes256Decrypt = (encrypted, input_encoding = 'hex', output_encoding = 'utf8') => {
  const decipher = createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encrypted, input_encoding, output_encoding);
  decrypted += decipher.final(output_encoding);
  return decrypted;
};

const sha256 = text => {
  const hash = createHash('sha256');
  hash.update(text + SHA256Salt);
  return hash.digest('hex');
};

const flattenObj = (ob) => {
  let result = {};
  for (const i in ob) {
    if ((typeof ob[i]) === 'object') {
      const temp = flattenObj(ob[i]);
      for (const j in temp) {
        result[i + '.' + j] = temp[j];
      }
    }
    else {
      result[i] = ob[i];
    }
  }
  return result;
};

const sha256SignObject = rawObject => {
  const obj = flattenObj(rawObject);
  const keys = Object.keys(obj).filter(key => key !== 'signature');
  keys.sort();
  let concatValue = '';
  for (let key of keys) concatValue += obj[key];
  return sha256(concatValue)
};

module.exports = { aes256Encrypt, aes256Decrypt, sha256, sha256SignObject };
