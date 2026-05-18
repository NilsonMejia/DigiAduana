const crypto = require('crypto');

const TOKEN_TTL_HOURS = 24;

function createVerificationCode() {
  const code = String(crypto.randomInt(100000, 1000000));
  return {
    code,
    codeHash: hashVerificationToken(code),
    expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)
  };
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)
  };
}

function hashVerificationToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function publicBaseUrl(req) {
  const configuredUrl = process.env.PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
}

function buildVerificationUrl(req, tokenOrEmail = '') {
  const baseUrl = publicBaseUrl(req);
  if (String(tokenOrEmail).includes('@')) {
    return `${baseUrl}/verify?email=${encodeURIComponent(tokenOrEmail)}`;
  }
  return `${baseUrl}/verify?token=${encodeURIComponent(tokenOrEmail)}`;
}

module.exports = {
  TOKEN_TTL_HOURS,
  buildVerificationUrl,
  createVerificationCode,
  createVerificationToken,
  hashVerificationToken
};
