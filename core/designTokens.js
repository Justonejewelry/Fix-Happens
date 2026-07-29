const tokens = require('../design/tokens.json');

function getToken(path) {
  return path.split('.').reduce((value, key) => (value ? value[key] : undefined), tokens);
}

module.exports = { tokens, getToken };
