/**
 * Validate plugin manifest.json shape.
 * Production-safe: returns { ok, errors, manifest } without throwing by default.
 */

const REQUIRED = ['id', 'name', 'version', 'entryPoint'];

function validateManifest(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['manifest must be an object'], manifest: null };
  }

  for (const key of REQUIRED) {
    if (!raw[key] || typeof raw[key] !== 'string') {
      errors.push(`missing or invalid string field: ${key}`);
    }
  }

  if (raw.id && !/^[a-z0-9][a-z0-9._-]*$/i.test(raw.id)) {
    errors.push('id must be alphanumeric with . _ -');
  }

  if (raw.supportedPlatforms != null && !Array.isArray(raw.supportedPlatforms)) {
    errors.push('supportedPlatforms must be an array');
  }

  if (raw.permissions != null && !Array.isArray(raw.permissions)) {
    errors.push('permissions must be an array');
  }

  return {
    ok: errors.length === 0,
    errors,
    manifest: errors.length === 0
      ? {
          id: raw.id,
          name: raw.name,
          version: raw.version,
          entryPoint: raw.entryPoint,
          description: raw.description || '',
          supportedPlatforms: raw.supportedPlatforms || ['macos', 'android'],
          permissions: raw.permissions || [],
          capabilities: raw.capabilities || ['suggest']
        }
      : null
  };
}

module.exports = { validateManifest };
