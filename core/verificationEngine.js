function verify(checks = []) {
  return checks.every(Boolean);
}

module.exports = { verify };
