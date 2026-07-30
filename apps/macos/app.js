/* Fix Happens Case Workspace — app logic + storage + core bridge */
(function () {
  const S = window.FixHappensStorage;
  const Core = window.FixHappensCore; // from preload when running in Electron

  if (!S) console.warn('FixHappensStorage missing — load storage.js first');

  const FALLBACK_CAUSES = {
    'DHCP Failure': { base: 40, keywords: ['no ip', 'no ipv4', 'dhcp', 'no address', 'lease', 'en0', 'no route to host'], nextTest: 'ipconfig getifaddr en0' },
    'DNS Failure': { base: 25, keywords: ['dns', 'resolve', 'nxdomain', 'cannot resolve', 'name resolution'], nextTest: 'nslookup apple.com' },
    'VPN Route Corruption': { base: 15, keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'], nextTest: 'route -n get default' },
    'Network Preference Corruption': { base: 30, keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'], nextTest: 'networksetup -getinfo Wi-Fi' },
    'Interface Down': { base: 20, keywords: ['interface down', 'en0 down', 'link down', 'media: none'], nextTest: 'ifconfig en0' },
    'Firewall Block': { base: 10, keywords: ['firewall', 'pf', 'blocked', 'deny'], nextTest: 'sudo pfctl -s rules' }
  };

  let cases = S ? S.loadCases() : {};
  let evidenceTexts = S ? S.loadEvidence() : [];
  let activeId = S ? S.loadActiveCase() : '1042';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function score(evidence) {
    if (Core && Core.hasEngine && Core.hasEngine()) {
      const ranked = Core.score(evidence);
      if (Array.isArray(ranked)) return ranked;
    }
    const text = evidence.join('\n').toLowerCase();
    return Object.entries(FALLBACK_CAUSES).map(([cause, def]) => {
      let confidence = def.base;
      for (const kw of def.keywords) if (text.includes(kw)) confidence += 18;
      if (text.includes('no route to host') && cause === 'DHCP Failure') confidence += 20;
      if (text.includes('vpn') && cause === 'VPN Route Corruption') confidence += 25;
      if ((text.includes('no ip') || text.includes('no ipv4')) && cause === 'DHCP Failure') confidence += 25;
      confidence = Math.max(0, Math.min(100, confidence));
      return { cause, confidence, nextTest: def.nextTest };
    }).filter(r => r.confidence > 5).sort((a, b) => b.confidence - a.confidence);
  }

  function renderCaseSwitcher() {
    const wrap = document.getElementById('caseSwitcherList');
    if (!wrap) return;
    const open = Object.entries(cases).filter(([, c]) => !c.closed);
    if (!open.length) {
      wrap.innerHTML = '<div class="empty-state" style="margin:0">No open cases</div>';
      return;
    }
    wrap.innerHTML = open.map(([id, c]) =>
      '<div class="case-chip' + (id === activeId ? ' active' : '') + '" data-case="' + escapeHtml(id) + '">' +
        '<span class="id">#' + escapeHtml(id) + '</span>' +
        '<span class="sym">' + escapeHtml(c.symptom) + '</span>' +
      '</div>'
    ).join('');
    wrap.querySelectorAll('.case-chip').forEach(chip => {
      chip.addEventListener('click', () => selectCase(chip.getAttribute('data-case')));
    });
  }

  function renderEvidence() {
    const list = document.getElementById('evidenceList');
    if (!list) return;
    if (!evidenceTexts.length) {
      list.innerHTML = '<div class="empty-state">No evidence yet — add a note</div>';
      return;
    }
    list.innerHTML = evidenceTexts.map(t =>
      '<div class="evidence-item"><div class="type">Note</div>' + escapeHtml(t) + '</div>'
    ).join('');
  }

  function renderHypotheses() {
    const ranked = score(evidenceTexts);
    const list = document.getElementById('hypList');
    if (!ranked.length) {
      list.innerHTML = '<div class="empty-state">No hypotheses yet — add evidence</div>';
      document.getElementById('nextCmd').textContent = '—';
      document.getElementById('confBadge').textContent = 'Confidence —';
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
    const th = document.getElementById('timelineHyp');
    if (th) th.textContent = ranked.slice(0, 3).map(r => r.cause + ' (' + r.confidence + '%)').join(' · ');
    return ranked;
  }

  function selectCase(id) {
    const c = cases[id];
    if (!c) return;
    activeId = id;
    document.getElementById('symptom').textContent = c.symptom;
    document.getElementById('meta').textContent = c.meta;
    document.getElementById('deviceBadge').textContent = c.device || 'Device';
    document.getElementById('statusBadge').textContent = c.status;
    document.getElementById('caseBadge').textContent = 'Case #' + id;
    document.getElementById('pillRow').innerHTML =
      (c.pills || []).map(p => '<div class="pill">' + escapeHtml(p) + '</div>').join('');
    if (S) S.saveActiveCase(id);
    renderCaseSwitcher();
  }

  function createCase() {
    const symptom = window.prompt('Symptom / problem description:');
    if (!symptom || !symptom.trim()) return;
    const id = String(1000 + Math.floor(Math.random() * 9000));
    cases[id] = {
      symptom: symptom.trim(),
      meta: 'Opened just now · Platform: macOS',
      device: 'Field device',
      status: 'Diagnosing',
      pills: [],
      closed: false
    };
    if (S) S.saveCases(cases);
    evidenceTexts = [];
    if (S) S.saveEvidence(evidenceTexts);
    activeId = id;
    if (S) S.saveActiveCase(id);
    renderCaseSwitcher();
    selectCase(id);
    renderEvidence();
    renderHypotheses();
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0 / 4';
    document.getElementById('checkTest').classList.remove('done');
  }

  function closeCase() {
    const c = cases[activeId];
    if (!c) return;
    if (c.closed) return;
    if (!window.confirm('Close case #' + activeId + '?')) return;
    c.closed = true;
    c.status = 'Closed';
    if (S) S.saveCases(cases);
    document.getElementById('statusBadge').textContent = 'Closed';
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('progressText').textContent = '4 / 4';
    const open = Object.entries(cases).filter(([, x]) => !x.closed);
    if (open.length) {
      selectCase(open[0][0]);
    } else {
      renderCaseSwitcher();
    }
    renderCaseSwitcher();
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
  renderCaseSwitcher();
  selectCase(activeId in cases ? activeId : Object.keys(cases)[0]);
  renderEvidence();
  renderHypotheses();
  bindCopyButtons();

  if (S && S.loadSolid()) {
    document.body.classList.add('solid');
    const t = document.getElementById('solidToggle');
    if (t) t.classList.add('on');
  }

  const engineBadge = document.getElementById('engineBadge');
  if (engineBadge) {
    engineBadge.textContent = (Core && Core.hasEngine && Core.hasEngine()) ? 'Core engine' : 'Browser engine';
  }

  document.getElementById('nextTest').addEventListener('click', async () => {
    const cmd = document.getElementById('nextCmd').textContent.trim();
    if (!cmd || cmd === '—') return;
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
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); document.getElementById('nextTest').click(); }
    if (e.key === 'e' || e.key === 'E') { e.preventDefault(); document.getElementById('evidenceInput').focus(); }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      document.getElementById('search').focus();
    }
  });

  document.getElementById('addEvidenceBtn').addEventListener('click', () => {
    const input = document.getElementById('evidenceInput');
    const value = input.value.trim();
    if (!value) return;
    evidenceTexts.push(value);
    if (S) S.saveEvidence(evidenceTexts);
    input.value = '';
    renderEvidence();
    renderHypotheses();
  });
  document.getElementById('evidenceInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addEvidenceBtn').click();
  });

  document.getElementById('solidToggle').addEventListener('click', () => {
    const t = document.getElementById('solidToggle');
    t.classList.toggle('on');
    document.body.classList.toggle('solid');
    if (S) S.saveSolid(document.body.classList.contains('solid'));
  });

  const createBtn = document.getElementById('createCaseBtn');
  const closeBtn = document.getElementById('closeCaseBtn');
  if (createBtn) createBtn.addEventListener('click', createCase);
  if (closeBtn) closeBtn.addEventListener('click', closeCase);
})();
