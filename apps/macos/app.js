/* Fix Happens Case Workspace — app logic + storage wiring */
(function () {
  const S = window.FixHappensStorage;
  if (!S) {
    console.warn('FixHappensStorage missing — load storage.js first');
  }

  const BASE_CAUSES = {
    'DHCP Failure': { base: 40, keywords: ['no ip', 'no ipv4', 'dhcp', 'no address', 'lease', 'en0', 'no route to host'], nextTest: 'ipconfig getifaddr en0' },
    'DNS Failure': { base: 25, keywords: ['dns', 'resolve', 'nxdomain', 'cannot resolve', 'name resolution'], nextTest: 'nslookup apple.com' },
    'VPN Route Corruption': { base: 15, keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'], nextTest: 'route -n get default' },
    'Network Preference Corruption': { base: 30, keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'], nextTest: 'networksetup -getinfo Wi-Fi' },
    'Interface Down': { base: 20, keywords: ['interface down', 'en0 down', 'link down', 'media: none'], nextTest: 'ifconfig en0' },
    'Firewall Block': { base: 10, keywords: ['firewall', 'pf', 'blocked', 'deny'], nextTest: 'sudo pfctl -s rules' }
  };

  const cases = {
    '1042': {
      symptom: 'Wi-Fi connected but no internet',
      meta: 'Opened 14 min ago · Asset: MacBook Pro 16\" · Platform: macOS',
      device: 'MacBook Pro',
      status: 'Diagnosing',
      pills: ['No route to host', 'No IP assigned', 'VPN inactive']
    },
    '1038': {
      symptom: 'Printer offline after sleep',
      meta: 'Opened 2 hr ago · Asset: Office LaserJet · Platform: macOS',
      device: 'LaserJet',
      status: 'Investigating',
      pills: ['USB sleep', 'Driver timeout']
    },
    '1031': {
      symptom: 'VPN drops every 10 min',
      meta: 'Opened yesterday · Asset: MacBook Air · Platform: macOS',
      device: 'MacBook Air',
      status: 'Testing',
      pills: ['IKEv2', 'Keepalive']
    }
  };

  let evidenceTexts = S ? S.loadEvidence() : [
    'Wi-Fi shows connected, no internet access',
    'no route to host',
    'VPN was used earlier today'
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function score(evidence) {
    const text = evidence.join('\n').toLowerCase();
    return Object.entries(BASE_CAUSES).map(([cause, def]) => {
      let confidence = def.base;
      for (const kw of def.keywords) if (text.includes(kw)) confidence += 18;
      if (text.includes('no route to host') && cause === 'DHCP Failure') confidence += 20;
      if (text.includes('vpn') && cause === 'VPN Route Corruption') confidence += 25;
      if ((text.includes('no ip') || text.includes('no ipv4')) && cause === 'DHCP Failure') confidence += 25;
      confidence = Math.max(0, Math.min(100, confidence));
      return { cause, confidence, nextTest: def.nextTest };
    }).filter(r => r.confidence > 5).sort((a, b) => b.confidence - a.confidence);
  }

  function renderEvidence() {
    const list = document.getElementById('evidenceList');
    if (!list) return;
    if (!evidenceTexts.length) {
      list.innerHTML = '<div class="empty-state">No evidence yet — add a note</div>';
      return;
    }
    list.innerHTML = evidenceTexts.map((t, i) => {
      const type = i < 3 && !S ? ['Observation', 'Command Output', 'User Statement'][i] : 'Note';
      // Prefer Note for persisted extras
      const label = (i < 3 && evidenceTexts.length >= 3 && t === evidenceTexts[i] &&
        ['Wi-Fi shows connected, no internet access', 'no route to host', 'VPN was used earlier today'].includes(t))
        ? ['Observation', 'Command Output', 'User Statement'][
            ['Wi-Fi shows connected, no internet access', 'no route to host', 'VPN was used earlier today'].indexOf(t)
          ] || 'Note'
        : 'Note';
      return '<div class="evidence-item"><div class="type">' + label + '</div>' + escapeHtml(t) + '</div>';
    }).join('');
  }

  function renderHypotheses() {
    const ranked = score(evidenceTexts);
    const list = document.getElementById('hypList');
    if (!ranked.length) {
      list.innerHTML = '<div class="empty-state">No hypotheses yet — add evidence</div>';
      return ranked;
    }
    list.innerHTML = ranked.map(r =>
      '<div class="hyp-item">' +
        '<div class="hyp-top"><span>' + escapeHtml(r.cause) + '</span>' +
        '<span class="confidence">' + r.confidence + '%</span></div>' +
        '<div class="meter"><span style="width:' + r.confidence + '%"></span></div>' +
      '</div>'
    ).join('');

    const top = ranked[0];
    document.getElementById('nextCmd').textContent = top.nextTest;
    document.getElementById('confBadge').textContent = 'Confidence ' + top.confidence + '%';
    document.getElementById('timelineHyp').textContent =
      ranked.slice(0, 3).map(r => r.cause + ' (' + r.confidence + '%)').join(' · ');
    return ranked;
  }

  function selectCase(id) {
    const c = cases[id];
    if (!c) return;
    document.querySelectorAll('.case-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-case') === id);
    });
    document.getElementById('symptom').textContent = c.symptom;
    document.getElementById('meta').textContent = c.meta;
    document.getElementById('deviceBadge').textContent = c.device;
    document.getElementById('statusBadge').textContent = c.status;
    document.getElementById('caseBadge').textContent = 'Case #' + id;
    document.getElementById('pillRow').innerHTML =
      c.pills.map(p => '<div class="pill">' + escapeHtml(p) + '</div>').join('');
    if (S) S.saveActiveCase(id);
  }

  function bindCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(btn.getAttribute('data-cmd'));
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1200);
        } catch (_) {
          btn.textContent = 'Failed';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
        }
      };
    });
  }

  // Init
  renderEvidence();
  renderHypotheses();
  bindCopyButtons();

  if (S) {
    const active = S.loadActiveCase();
    selectCase(active);
    if (S.loadSolid()) {
      document.body.classList.add('solid');
      const t = document.getElementById('solidToggle');
      if (t) t.classList.add('on');
    }
  }

  document.getElementById('nextTest').addEventListener('click', async () => {
    const cmd = document.getElementById('nextCmd').textContent.trim();
    try {
      await navigator.clipboard.writeText(cmd);
      document.getElementById('checkTest').classList.add('done');
      document.getElementById('progressFill').style.width = '75%';
      document.getElementById('progressText').textContent = '3 / 4';
    } catch (_) {}
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      document.getElementById('nextTest').click();
    }
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      document.getElementById('evidenceInput').focus();
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      document.getElementById('search').focus();
    }
  });

  const addBtn = document.getElementById('addEvidenceBtn');
  const evidenceInput = document.getElementById('evidenceInput');
  addBtn.addEventListener('click', () => {
    const value = evidenceInput.value.trim();
    if (!value) return;
    evidenceTexts.push(value);
    if (S) S.saveEvidence(evidenceTexts);
    evidenceInput.value = '';
    renderEvidence();
    renderHypotheses();
  });
  evidenceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  document.querySelectorAll('.case-chip').forEach(chip => {
    chip.addEventListener('click', () => selectCase(chip.getAttribute('data-case')));
  });

  const solidToggle = document.getElementById('solidToggle');
  solidToggle.addEventListener('click', () => {
    solidToggle.classList.toggle('on');
    document.body.classList.toggle('solid');
    if (S) S.saveSolid(document.body.classList.contains('solid'));
  });
})();
