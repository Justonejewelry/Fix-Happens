/**
 * Privileged (opt-in) network scan runner.
 *
 * Security model:
 * - Default OFF (caller must pass enabled: true from user preference)
 * - Only fixed plan IDs from the catalog — never arbitrary command strings
 * - spawn(file, args, { shell: false }) only
 * - Strict host / port validation for parameterized plans
 * - Timeouts + output size caps; no sudo
 */

const { spawn } = require('child_process');
const path = require('path');

const MAX_OUTPUT = 64 * 1024; // 64 KiB per stream
const DEFAULT_TIMEOUT_MS = 8000;

/** Host: IPv4 or simple hostname labels */
const HOST_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*)$/;

function isValidHost(h) {
  if (!h || typeof h !== 'string') return false;
  if (h.length > 253) return false;
  if (/[\s;|&$`<>]/.test(h)) return false;
  return HOST_RE.test(h);
}

function isValidPort(p) {
  const n = Number(p);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

const AIRPORT =
  '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';

/**
 * Catalog of allowlisted scan plans.
 * args may be static array or function(params) => string[]
 */
const PLANS = {
  'local-interfaces': {
    id: 'local-interfaces',
    title: 'Local interfaces',
    description: 'List interface addresses (ifconfig)',
    timeoutMs: 4000,
    buildArgs: () => ({ file: 'ifconfig', args: [] })
  },
  'arp-table': {
    id: 'arp-table',
    title: 'ARP table',
    description: 'Show ARP neighbors',
    timeoutMs: 4000,
    buildArgs: () => ({ file: 'arp', args: ['-a'] })
  },
  'route-default': {
    id: 'route-default',
    title: 'Default route',
    description: 'Show default gateway route',
    timeoutMs: 4000,
    buildArgs: () => ({ file: 'route', args: ['-n', 'get', 'default'] })
  },
  'wifi-info': {
    id: 'wifi-info',
    title: 'Wi-Fi info',
    description: 'networksetup Wi-Fi details',
    timeoutMs: 4000,
    buildArgs: () => ({ file: 'networksetup', args: ['-getinfo', 'Wi-Fi'] })
  },
  'airport-scan': {
    id: 'airport-scan',
    title: 'Wi-Fi survey',
    description: 'Scan nearby SSIDs (airport -s)',
    timeoutMs: 12000,
    buildArgs: () => ({ file: AIRPORT, args: ['-s'] })
  },
  'ping-host': {
    id: 'ping-host',
    title: 'Ping host',
    description: 'ICMP echo (3 packets)',
    params: ['host'],
    timeoutMs: 10000,
    buildArgs: (p) => {
      if (!isValidHost(p.host)) throw new Error('invalid host');
      return { file: 'ping', args: ['-c', '3', p.host] };
    }
  },
  'traceroute-host': {
    id: 'traceroute-host',
    title: 'Traceroute',
    description: 'Path to host (max 12 hops)',
    params: ['host'],
    timeoutMs: 20000,
    buildArgs: (p) => {
      if (!isValidHost(p.host)) throw new Error('invalid host');
      return { file: 'traceroute', args: ['-n', '-w', '2', '-m', '12', p.host] };
    }
  },
  'dns-lookup': {
    id: 'dns-lookup',
    title: 'DNS lookup',
    description: 'Resolve host with dscacheutil',
    params: ['host'],
    timeoutMs: 6000,
    buildArgs: (p) => {
      if (!isValidHost(p.host)) throw new Error('invalid host');
      return {
        file: 'dscacheutil',
        args: ['-q', 'host', '-a', 'name', p.host]
      };
    }
  },
  'nc-port': {
    id: 'nc-port',
    title: 'Port check',
    description: 'TCP connect test (nc -vz)',
    params: ['host', 'port'],
    timeoutMs: 6000,
    buildArgs: (p) => {
      if (!isValidHost(p.host)) throw new Error('invalid host');
      if (!isValidPort(p.port)) throw new Error('invalid port');
      return {
        file: 'nc',
        args: ['-vz', '-G', '3', p.host, String(p.port)]
      };
    }
  }
};

function listPlans() {
  return Object.values(PLANS).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    params: p.params || [],
    timeoutMs: p.timeoutMs || DEFAULT_TIMEOUT_MS
  }));
}

function getPlan(planId) {
  return PLANS[planId] || null;
}

/**
 * Execute an allowlisted plan.
 * @param {string} planId
 * @param {object} [params]
 * @param {{ enabled?: boolean }} [options] enabled must be true
 * @returns {Promise<object>}
 */
function runPlan(planId, params = {}, options = {}) {
  return new Promise((resolve) => {
    if (!options.enabled) {
      resolve({
        ok: false,
        planId,
        error: 'Privileged scans are disabled. Enable in settings to run allowlisted diagnostics.'
      });
      return;
    }

    const plan = PLANS[planId];
    if (!plan) {
      resolve({ ok: false, planId, error: `Unknown plan: ${planId}` });
      return;
    }

    let built;
    try {
      built = plan.buildArgs(params || {});
    } catch (e) {
      resolve({ ok: false, planId, error: e.message || String(e) });
      return;
    }

    const file = built.file;
    const args = Array.isArray(built.args) ? built.args.map(String) : [];
    // Refuse path tricks outside known binaries (airport is absolute by design)
    if (file.includes('..') || (file.includes('/') && file !== AIRPORT && !path.isAbsolute(file))) {
      // allow simple names like ping, ifconfig from PATH; block relative paths
      if (file.includes('/')) {
        resolve({ ok: false, planId, error: 'Refusing non-catalog binary path' });
        return;
      }
    }

    const timeoutMs = plan.timeoutMs || DEFAULT_TIMEOUT_MS;
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    let child;
    try {
      child = spawn(file, args, {
        shell: false,
        env: { PATH: process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (e) {
      resolve({
        ok: false,
        planId,
        error: e.message || String(e),
        command: [file, ...args].join(' ')
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
        planId,
        error: err.message || String(err),
        command: [file, ...args].join(' '),
        durationMs: Date.now() - started
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      const command = [file, ...args].join(' ');
      if (killed) {
        resolve({
          ok: false,
          planId,
          error: `Timed out after ${timeoutMs}ms`,
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code: code,
          signal,
          durationMs
        });
        return;
      }
      resolve({
        ok: code === 0 || (planId === 'nc-port' && stderr.length > 0),
        // nc often exits non-zero but still reports open/closed on stderr
        planId,
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
        signal: signal || null,
        durationMs
      });
    });
  });
}

module.exports = {
  listPlans,
  getPlan,
  runPlan,
  isValidHost,
  isValidPort,
  PLANS,
  MAX_OUTPUT,
  DEFAULT_TIMEOUT_MS
};
