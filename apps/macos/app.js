/* Fix Happens Case Workspace — durable DB primary, localStorage fallback */
(function () {
  const DB = window.FixHappensDB;
  const S = window.FixHappensStorage;
  const Core = window.FixHappensCore;
  const useDB = !!(DB && DB.available);

  const FALLBACK_CAUSES = {
    'DHCP Failure': { base: 40, keywords: ['no ip', 'no ipv4', 'dhcp', 'no address', 'lease', 'en0', 'no route to host'], nextTest: 'ipconfig getifaddr en0' },
    'DNS Failure': { base: 25, keywords: ['dns', 'resolve', 'nxdomain', 'cannot resolve', 'name resolution'], nextTest: 'nslookup apple.com' },
    'VPN Route Corruption': { base: 15, keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'], nextTest: 'route -n get default' },
    'Network Preference Corruption': { base: 30, keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'], nextTest: 'networksetup -getinfo Wi-Fi' },
    'Interface Down': { base: 20, keywords: ['interface down', 'en0 down', 'link down', 'media: none'], nextTest: 'ifconfig en0' },
    'Firewall Block': { base: 10, keywords: ['firewall', 'pf', 'blocked', 'deny'], nextTest: 'sudo pfctl -s rules' }
  };

  let cases = {};
  let evidenceTexts = [];
  let activeId = null;

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
      '<div class="case-chip' + (String(id) === String(activeId) ? ' active' : '') + '" data-case="' + escapeHtml(String(id)) + '">' +
        '<span class="id">#' + escapeHtml(String(id)) + '</span>' +
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
    list.innerHTML = evidenceTexts.map(t => {
      const isObj = t && typeof t === 'object';
      const type = isObj ? (t.evidence_type || t.type || 'Note') : 'Note';
      const value = isObj ? (t.value || '') : String(t);
      return '<div class="evidence-item"><div class="type">' + escapeHtml(type) + '</div>' + escapeHtml(value) + '</div>';
    }).join('');
  }

  async function persistHypotheses(ranked) {
    if (useDB && activeId != null) {
      try { await DB.saveHypotheses(activeId, ranked); } catch (_) {}
    }
  }

  function renderHypotheses() {
    const plain = evidenceTexts.map(t =>
      t && typeof t === 'object' ? (t.value || '') : String(t)
    );
    const ranked = score(plain);
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
    persistHypotheses(ranked);
    return ranked;
  }

  async function selectCase(id) {
    activeId = id;
    if (useDB) {
      try {
        const full = await DB.getCase(id);
        if (full) {
          cases[id] = {
            symptom: full.symptom,
            meta: (full.device || 'Device') + ' · ' + (full.status || '') + ' · ' + (full.created_at || ''),
            device: full.device || 'Device',
            status: full.status,
            pills: full.pills || [],
            closed: !!full.closed,
            verification: full.verification
          };
          evidenceTexts = (full.evidence || []).map(e =>
            typeof e === 'string' ? e : e
          );
        }
        await DB.updateMeta({ activeCaseId: id });
      } catch (e) {
        console.warn('getCase failed', e);
      }
    } else {
      const c = cases[id];
      if (!c) return;
      if (S) S.saveActiveCase(id);
    }
    const c = cases[id];
    if (!c) return;
    document.getElementById('symptom').textContent = c.symptom;
    document.getElementById('meta').textContent = c.meta || '';
    document.getElementById('deviceBadge').textContent = c.device || 'Device';
    document.getElementById('statusBadge').textContent = c.status || '';
    document.getElementById('caseBadge').textContent = 'Case #' + id;
    document.getElementById('pillRow').innerHTML =
      (c.pills || []).map(p => '<div class="pill">' + escapeHtml(p) + '</div>').join('');
    renderCaseSwitcher();
    renderEvidence();
    renderHypotheses();
  }

  async function createCase() {
    const symptom = window.prompt('Symptom / problem description:');
    if (!symptom || !symptom.trim()) return;

    if (useDB) {
      try {
        const row = await DB.createCase({ symptom: symptom.trim(), device: 'Field device', status: 'New' });
        cases[row.id] = {
          symptom: row.symptom,
          meta: 'Opened just now · Platform: macOS',
          device: row.device || 'Field device',
          status: row.status || 'New',
          pills: [],
          closed: false
        };
        activeId = row.id;
        evidenceTexts = [];
        await selectCase(row.id);
      } catch (e) {
        console.error(e);
        window.alert('Create failed: ' + e);
      }
      return;
    }

    const id = String(1000 + Math.floor(Math.random() * 9000));
    cases[id] = {
      symptom: symptom.trim(),
      meta: 'Opened just now · Platform: macOS',
      device: 'Field device',
      status: 'New',
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
  }

  async function closeCase() {
    if (activeId == null) return;
    if (!window.confirm('Close case #' + activeId + '?')) return;

    if (useDB) {
      try {
        await DB.closeCase(activeId, 'Closed from Case Workspace');
        delete cases[activeId];
        const open = await DB.listOpenCases();
        cases = {};
        open.forEach(c => {
          cases[c.id] = {
            symptom: c.symptom,
            meta: (c.device || '') + ' · ' + (c.status || ''),
            device: c.device,
            status: c.status,
            pills: c.pills || [],
            closed: false
          };
        });
        if (open.length) await selectCase(open[0].id);
        else {
          activeId = null;
          evidenceTexts = [];
          renderCaseSwitcher();
          renderEvidence();
          renderHypotheses();
        }
      } catch (e) {
        window.alert('Close failed: ' + e);
      }
      return;
    }

    const c = cases[activeId];
    if (!c || c.closed) return;
    c.closed = true;
    c.status = 'Resolved';
    if (S) S.saveCases(cases);
    const open = Object.entries(cases).filter(([, x]) => !x.closed);
    if (open.length) selectCase(open[0][0]);
    else renderCaseSwitcher();
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

  async function boot() {
    bindCopyButtons();

    if (useDB) {
      try {
        const open = await DB.listOpenCases();
        cases = {};
        open.forEach(c => {
          cases[c.id] = {
            symptom: c.symptom,
            meta: (c.device || '') + ' · ' + (c.status || ''),
            device: c.device,
            status: c.status,
            pills: c.pills || [],
            closed: false
          };
        });
        const meta = await DB.getMeta();
        if (meta && meta.solid) {
          document.body.classList.add('solid');
          const t = document.getElementById('solidToggle');
          if (t) t.classList.add('on');
        }
        const startId = (meta && meta.activeCaseId && cases[meta.activeCaseId])
          ? meta.activeCaseId
          : (open[0] && open[0].id);
        if (startId != null) await selectCase(startId);
        else renderCaseSwitcher();
      } catch (e) {
        console.error('DB boot failed', e);
      }
    } else {
      cases = S ? S.loadCases() : {};
      evidenceTexts = S ? S.loadEvidence() : [];
      activeId = S ? S.loadActiveCase() : Object.keys(cases)[0];
      renderCaseSwitcher();
      if (activeId) selectCase(activeId);
      if (S && S.loadSolid()) {
        document.body.classList.add('solid');
        const t = document.getElementById('solidToggle');
        if (t) t.classList.add('on');
      }
    }

    const engineBadge = document.getElementById('engineBadge');
    if (engineBadge) {
      const eng = (Core && Core.hasEngine && Core.hasEngine()) ? 'Core engine' : 'Browser engine';
      engineBadge.textContent = useDB ? eng + ' · DB' : eng + ' · local';
    }
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

  document.getElementById('addEvidenceBtn').addEventListener('click', async () => {
    const input = document.getElementById('evidenceInput');
    const value = input.value.trim();
    if (!value) return;
    if (useDB && activeId != null) {
      try {
        await DB.addEvidence(activeId, 'Note', value);
        evidenceTexts.push({ evidence_type: 'Note', value });
      } catch (e) {
        window.alert('Add evidence failed: ' + e);
        return;
      }
    } else {
      evidenceTexts.push(value);
      if (S) S.saveEvidence(evidenceTexts.map(t =>
        t && typeof t === 'object' ? t.value : t
      ));
    }
    input.value = '';
    renderEvidence();
    renderHypotheses();
  });
  document.getElementById('evidenceInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addEvidenceBtn').click();
  });

  document.getElementById('solidToggle').addEventListener('click', async () => {
    const t = document.getElementById('solidToggle');
    t.classList.toggle('on');
    document.body.classList.toggle('solid');
    const on = document.body.classList.contains('solid');
    if (useDB) {
      try { await DB.updateMeta({ solid: on }); } catch (_) {}
    } else if (S) {
      S.saveSolid(on);
    }
  });

  const search = document.getElementById('search');
  if (search) {
    let timer;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = search.value.trim();
        if (useDB) {
          try {
            const rows = await DB.searchCases(q);
            cases = {};
            rows.forEach(c => {
              cases[c.id] = {
                symptom: c.symptom,
                meta: (c.device || '') + ' · ' + (c.status || ''),
                device: c.device,
                status: c.status,
                pills: c.pills || [],
                closed: !!c.closed
              };
            });
            renderCaseSwitcher();
          } catch (_) {}
        }
      }, 200);
    });
  }

  const createBtn = document.getElementById('createCaseBtn');
  const closeBtn = document.getElementById('closeCaseBtn');
  if (createBtn) createBtn.addEventListener('click', createCase);
  if (closeBtn) closeBtn.addEventListener('click', closeCase);

  boot();
})();
