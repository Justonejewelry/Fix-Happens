function validatePluginManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'] };
  }

  if (!manifest.id) errors.push('Missing id');
  if (!manifest.name) errors.push('Missing name');
  if (!manifest.version) errors.push('Missing version');
  if (!manifest.entryPoint) errors.push('Missing entryPoint');

  if (manifest.permissions && !Array.isArray(manifest.permissions)) {
    errors.push('permissions must be an array if provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validatePluginManifest };
