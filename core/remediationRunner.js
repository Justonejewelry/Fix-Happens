/**
 * Privileged (opt-in) remediation / fix runner.
 *
 * Security model (mirrors scanRunner):
 * - Default OFF (caller must pass enabled: true)
 * - Only fixed plan IDs from the catalog — never arbitrary command strings
 * - spawn(file, args, { shell: false }) only
 * - No sudo; plans that need elevation report clear errors
 * - Timeouts + output size caps
 * - Optional multi-step sequences (e.g. Wi-Fi power cycle)
 */

const { spawn } = require('child_process');

const MAX_OUTPUT = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 12000;

/** Allowlisted network service names for networksetup */
const SERVICE_ALLOW = new Set([
  'Wi-Fi',
  'Ethernet',
  'Thunderbolt Bridge',
  'USB 10/100/1000 LAN',
  'iPhone USB'
]);

/** Allowlisted interface names for ipconfig */
const IFACE_ALLOW = new Set(['en0', 'en1', 'en2', 'en3', 'en4', 'en5', 'en6']);

function isValidService(s) {
  return typeof s === 'string' && SERVICE_ALLOW.has(s);
}

function isValidIface(s) {
  return typeof s === 'string' && IFACE_ALLOW.has(s);
}

/**
 * Catalog of allowlisted remediation plans.
 * Each plan is one step { file, args } or a sequence via steps[].
 */
const PLANS = {
  'flush-dns-cache': {
    id: 'flush-dns-cache',
    title: 'Flush DNS cache',
    description: 'dscacheutil -flushcache (may require admin on some macOS versions)',
    category: 'network',
    timeoutMs: 8000,
    risk: 'low',
    buildSteps: () => [{
      file: 'dscacheutil',
      args: ['-flushcache']
    }]
  },
  'renew-dhcp': {
    id: 'renew-dhcp',
    title: 'Renew DHCP lease',
    description: 'ipconfig set <iface> DHCP',
    category: 'network',
    params: ['iface'],
    timeoutMs: 15000,
    risk: 'medium',
    buildSteps: (p) => {
      const iface = p.iface || 'en0';
      if (!isValidIface(iface)) throw new Error('invalid interface (allowlisted en0–en6 only)');
      return [{ file: 'ipconfig', args: ['set', iface, 'DHCP'] }];
    }
  },
  'set-dns-cloudflare': {
    id: 'set-dns-cloudflare',
    title: 'Set DNS → Cloudflare',
    description: 'networksetup -setdnsservers <service> 1.1.1.1 1.0.0.1',
    category: 'network',
    params: ['service'],
    timeoutMs: 8000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-setdnsservers', service, '1.1.1.1', '1.0.0.1']
      }];
    }
  },
  'set-dns-google': {
    id: 'set-dns-google',
    title: 'Set DNS → Google',
    description: 'networksetup -setdnsservers <service> 8.8.8.8 8.8.4.4',
    category: 'network',
    params: ['service'],
    timeoutMs: 8000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-setdnsservers', service, '8.8.8.8', '8.8.4.4']
      }];
    }
  },
  'set-dns-dhcp': {
    id: 'set-dns-dhcp',
    title: 'Restore DNS → DHCP',
    description: 'networksetup -setdnsservers <service> Empty',
    category: 'network',
    params: ['service'],
    timeoutMs: 8000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-setdnsservers', service, 'Empty']
      }];
    }
  },
  'wifi-power-cycle': {
    id: 'wifi-power-cycle',
    title: 'Wi-Fi power cycle',
    description: 'Toggle airport power off then on for <service>',
    category: 'network',
    params: ['service'],
    timeoutMs: 20000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [
        { file: 'networksetup', args: ['-setairportpower', service, 'off'] },
        { file: 'networksetup', args: ['-setairportpower', service, 'on'] }
      ];
    }
  },
  'disable-web-proxy': {
    id: 'disable-web-proxy',
    title: 'Disable HTTP proxy',
    description: 'networksetup -setwebproxystate <service> off',
    category: 'network',
    params: ['service'],
    timeoutMs: 8000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-setwebproxystate', service, 'off']
      }];
    }
  },
  'disable-secure-proxy': {
    id: 'disable-secure-proxy',
    title: 'Disable HTTPS proxy',
    description: 'networksetup -setsecurewebproxystate <service> off',
    category: 'network',
    params: ['service'],
    timeoutMs: 8000,
    risk: 'medium',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-setsecurewebproxystate', service, 'off']
      }];
    }
  },
  'cancel-all-print-jobs': {
    id: 'cancel-all-print-jobs',
    title: 'Cancel all print jobs',
    description: 'cancel -a (clear local CUPS queues)',
    category: 'print',
    timeoutMs: 10000,
    risk: 'medium',
    buildSteps: () => [{ file: 'cancel', args: ['-a'] }]
  },
  'network-quality': {
    id: 'network-quality',
    title: 'Network quality test',
    description: 'Run networkQuality (read-only throughput/latency sample)',
    category: 'network',
    timeoutMs: 25000,
    risk: 'low',
    buildSteps: () => [{ file: 'networkQuality', args: ['-s'] }]
  },
  'show-dns': {
    id: 'show-dns',
    title: 'Show DNS servers',
    description: 'networksetup -getdnsservers <service>',
    category: 'network',
    params: ['service'],
    timeoutMs: 6000,
    risk: 'low',
    buildSteps: (p) => {
      const service = p.service || 'Wi-Fi';
      if (!isValidService(service)) throw new Error('invalid network service');
      return [{
        file: 'networksetup',
        args: ['-getdnsservers', service]
      }];
    }
  },
  'purge-user-caches-hint': {
    id: 'purge-user-caches-hint',
    title: 'List large user caches (read-only)',
    description: 'du -sh ~/Library/Caches (read-only size check)',
    category: 'system',
    timeoutMs: 20000,
    risk: 'low',
    buildSteps: () => [{
      file: 'du',
      args: ['-sh', process.env.HOME ? process.env.HOME + '/Library/Caches' : '/tmp']
    }]
  }
};

function listPlans() {
  return Object.values(PLANS).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category || 'general',
    params: p.params || [],
    risk: p.risk || 'medium',
    timeoutMs: p.timeoutMs || DEFAULT_TIMEOUT_MS
  }));
}

function getPlan(planId) {
  return PLANS[planId] || null;
}

function spawnOnce(file, args, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;
    let child;
    try {
      child = spawn(file, args, {
        shell: false,
        env: {
          PATH: process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin',
          HOME: process.env.HOME || ''
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (e) {
      resolve({
        ok: false,
        error: e.message || String(e),
        command: [file, ...args].join(' '),
        stdout: '',
        stderr: '',
        durationMs: Date.now() - started
      });
      return;
    }

    const timer = setTimeout(() => {
      killed = true;
      try {
        child.kill('SIGKILL');
      } catch (_) {}
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT) {
        stdout += chunk.toString('utf8');
        if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(0, MAX_OUTPUT) + '\n…[truncated]';
      }
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT) {
        stderr += chunk.toString('utf8');
        if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(0, MAX_OUTPUT) + '\n…[truncated]';
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: err.message || String(err),
        command: [file, ...args].join(' '),
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        durationMs: Date.now() - started
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        ok: !killed && code === 0,
        error: killed
          ? `Timed out after ${timeoutMs}ms`
          : code !== 0
            ? `Exit code ${code}`
            : null,
        command: [file, ...args].join(' '),
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
        signal: signal || null,
        durationMs: Date.now() - started
      });
    });
  });
}

/**
 * Execute an allowlisted remediation plan (possibly multi-step).
 * @param {string} planId
 * @param {object} [params]
 * @param {{ enabled?: boolean }} [options]
 */
async function runPlan(planId, params = {}, options = {}) {
  if (!options.enabled) {
    return {
      ok: false,
      planId,
      error:
        'Remediation is disabled. Enable privileged fixes in settings to run allowlisted repairs.'
    };
  }

  const plan = PLANS[planId];
  if (!plan) {
    return { ok: false, planId, error: `Unknown fix plan: ${planId}` };
  }

  let steps;
  try {
    steps = plan.buildSteps(params || {});
  } catch (e) {
    return { ok: false, planId, error: e.message || String(e) };
  }

  if (!Array.isArray(steps) || !steps.length) {
    return { ok: false, planId, error: 'Plan produced no steps' };
  }

  const timeoutMs = plan.timeoutMs || DEFAULT_TIMEOUT_MS;
  const stepTimeout = Math.max(3000, Math.floor(timeoutMs / steps.length));
  const started = Date.now();
  const stepResults = [];
  let allOk = true;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const file = step.file;
    const args = Array.isArray(step.args) ? step.args.map(String) : [];
    if (!file || typeof file !== 'string' || file.includes('/') || file.includes('..')) {
      return {
        ok: false,
        planId,
        error: 'Refusing non-catalog binary path',
        steps: stepResults
      };
    }
    // Brief pause between Wi-Fi off/on
    if (i > 0 && planId === 'wifi-power-cycle') {
      await new Promise((r) => setTimeout(r, 1500));
    }
    const result = await spawnOnce(file, args, stepTimeout);
    stepResults.push(result);
    if (!result.ok) allOk = false;
  }

  const stdout = stepResults.map((s) => s.stdout).filter(Boolean).join('\n---\n');
  const stderr = stepResults.map((s) => s.stderr).filter(Boolean).join('\n---\n');
  const commands = stepResults.map((s) => s.command).filter(Boolean);
  const errors = stepResults.map((s) => s.error).filter(Boolean);

  return {
    ok: allOk,
    planId,
    title: plan.title,
    command: commands.join(' && '),
    commands,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    error: allOk ? null : errors.join('; ') || 'One or more steps failed',
    steps: stepResults,
    durationMs: Date.now() - started,
    risk: plan.risk || 'medium'
  };
}

/**
 * Map common diagnostic causes → preferred fix plan IDs (suggestions only).
 */
function suggestFixesForCause(cause) {
  const c = String(cause || '').toLowerCase();
  const out = [];
  if (/dhcp|no ip|no ipv4|lease/.test(c)) {
    out.push({ planId: 'renew-dhcp', params: { iface: 'en0' }, label: 'Renew DHCP (en0)' });
    out.push({ planId: 'wifi-power-cycle', params: { service: 'Wi-Fi' }, label: 'Wi-Fi power cycle' });
  }
  if (/dns|resolve|nxdomain|name resolution|stale cache/.test(c)) {
    out.push({ planId: 'flush-dns-cache', label: 'Flush DNS cache' });
    out.push({ planId: 'set-dns-cloudflare', params: { service: 'Wi-Fi' }, label: 'DNS → Cloudflare' });
    out.push({ planId: 'show-dns', params: { service: 'Wi-Fi' }, label: 'Show DNS servers' });
  }
  if (/vpn|route corruption|tunnel|proxy/.test(c)) {
    out.push({ planId: 'disable-web-proxy', params: { service: 'Wi-Fi' }, label: 'Disable HTTP proxy' });
    out.push({ planId: 'disable-secure-proxy', params: { service: 'Wi-Fi' }, label: 'Disable HTTPS proxy' });
    out.push({ planId: 'set-dns-dhcp', params: { service: 'Wi-Fi' }, label: 'Restore DNS → DHCP' });
  }
  if (/interface down|wifi|wireless|airport/.test(c)) {
    out.push({ planId: 'wifi-power-cycle', params: { service: 'Wi-Fi' }, label: 'Wi-Fi power cycle' });
  }
  if (/printer|cups|queue|spool/.test(c)) {
    out.push({ planId: 'cancel-all-print-jobs', label: 'Cancel all print jobs' });
  }
  if (/slow|latency|boost|performance|quality/.test(c)) {
    out.push({ planId: 'network-quality', label: 'Network quality test' });
    out.push({ planId: 'flush-dns-cache', label: 'Flush DNS cache' });
    out.push({ planId: 'set-dns-cloudflare', params: { service: 'Wi-Fi' }, label: 'DNS → Cloudflare' });
  }
  return out;
}

module.exports = {
  listPlans,
  getPlan,
  runPlan,
  suggestFixesForCause,
  isValidService,
  isValidIface,
  PLANS,
  SERVICE_ALLOW,
  IFACE_ALLOW,
  MAX_OUTPUT,
  DEFAULT_TIMEOUT_MS
};
