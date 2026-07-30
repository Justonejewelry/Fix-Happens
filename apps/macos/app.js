/* Fix Happens Case Workspace — durable DB primary, localStorage fallback */
(function () {
  const DB = window.FixHappensDB;
  const S = window.FixHappensStorage;
  const Core = window.FixHappensCore;
  const useDB = !!(DB && DB.available);

  const FALLBACK_CAUSES = {
    'DHCP Failure': {
      base: 40,
      keywords: ['no ip', 'no ipv4', 'dhcp', 'no address', 'lease', 'en0', 'no route to host'],
      nextTest: 'ipconfig getifaddr en0'
    },
    'DNS Failure': {
      base: 25,
      keywords: ['dns', 'resolve', 'nxdomain', 'cannot resolve', 'name resolution'],
      nextTest: 'nslookup apple.com'
    },
    'VPN Route Corruption': {
      base: 15,
      keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'],
      nextTest: 'route -n get default'
    },
    'Network Preference Corruption': {
      base: 30,
      keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'],
      nextTest: 'networksetup -getinfo Wi-Fi'
    },
    'Interface Down': {
      base: 20,
      keywords: ['interface down', 'en0 down', 'link down', 'media: none'],
      nextTest: 'ifconfig en0'
    },
    'Firewall Block': {
      base: 10,
      keywords: ['firewall', 'pf', 'blocked', 'deny'],
      nextTest: 'sudo pfctl -s rules'
    },
    'Incomplete Host Discovery': {
      base: 18,
      keywords: ['arp', 'empty arp', 'no hosts', 'ping sweep', 'host list', 'neighbor'],
      nextTest: 'arp -a'
    },
    'Path / Routing Anomaly': {
      base: 16,
      keywords: ['traceroute', 'packet loss', 'high rtt', 'hop', 'blackhole', 'latency'],
      nextTest: 'traceroute -n 1.1.1.1'
    },
    'Port / Service Unreachable': {
      base: 14,
      keywords: ['port', 'filtered', 'connection refused', 'connection timed out', 'nmap', 'closed port'],
      nextTest: 'nc -vz <host> <port>'
    },
    'VLAN / L2 Isolation': {
      base: 15,
      keywords: ['vlan', 'client isolation', 'guest network', 'wrong vlan', 'layer 2'],
      nextTest: 'arp -a'
    },
    'Duplicate IP Address': {
      base: 22,
      keywords: ['duplicate ip', 'ip conflict', 'address conflict', 'gratuitous arp'],
      nextTest: 'arp -a'
    },
    'Printer Offline': {
      base: 35,
      keywords: ['printer', 'offline', 'print queue', 'cups', 'laserjet', 'spool'],
      nextTest: 'lpstat -p'
    },
    'Power / Sleep Issue': {
      base: 20,
      keywords: ['sleep', 'wake', 'power nap', 'battery', 'clamshell'],
      nextTest: 'pmset -g'
    },
    'Disk Space Critical': {
      base: 28,
      keywords: ['disk full', 'no space', 'storage full', 'df -h', 'volume full'],
      nextTest: 'df -h'
    }
  };

  let cases = {};
  let evidenceTexts = [];
  let activeId = null;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function score(evidence) {
    if (Core && Core.hasEngine && Core.hasEngine()) {
      const ranked = Core.score(evidence);
      if (Array.isArray(ranked)) return ranked;
    }
    const text = evidence.join('\n').toLowerCase();
    return Object.entries(FALLBACK_CAUSES)
      .map(([cause, def]) => {
        let confidence = def.base;
        for (const kw of def.keywords) if (text.includes(kw)) confidence += 18;
        if (text.includes('no route to host') && cause === 'DHCP Failure') confidence += 20;
        if (text.includes('vpn') && cause === 'VPN Route Corruption') confidence += 25;
        if ((text.includes('no ip') || text.includes('no ipv4')) && cause === 'DHCP Failure')
          confidence += 25;
        if ((text.includes('empty arp') || text.includes('no hosts')) &&
          cause === 'Incomplete Host Discovery') confidence += 18;
        if ((text.includes('duplicate ip') || text.includes('ip conflict')) &&
          cause === 'Duplicate IP Address') confidence += 20;
        if ((text.includes('disk full') || text.includes('no space')) &&
          cause === 'Disk Space Critical') confidence += 22;
        confidence = Math.max(0, Math.min(100, confidence));
        return { cause, confidence, nextTest: def.nextTest };
      })
      .filter((r) => r.confidence > 5)
      .sort((a, b) => b.confidence - a.confidence);
  }

  function renderCaseSwitcher() {
    const wrap = document.getElementById('caseSwitcherList');
    if (!wrap) return;
    const open = Object.entries(cases).filter(([, c]) => !c.closed);
    if (!open.length) {
      wrap.innerHTML = '<div class="empty-state" style="margin:0">No open cases</div>';
      return;
    }
    wrap.innerHTML = open
      .map(([id, c]) => {
        const tip = 'Open case #' + id + ' — ' + (c.symptom || '');
        return (
          '<div class="case-chip' +
          (String(id) === String(activeId) ? ' active' : '') +
          '" data-case="' +
          escapeHtml(String(id)) +
          '" data-tip="' +
          escapeHtml(tip) +
          '" data-tip-pos="below">' +
          '<span class="id">#' +
          escapeHtml(String(id)) +
          '</span>' +
          '<span class="sym">' +
          escapeHtml(c.symptom) +
          '</span>' +
          '</div>'
        );
      })
      .join('');
    wrap.querySelectorAll('.case-chip').forEach((chip) => {
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
    list.innerHTML = evidenceTexts
      .map((t) => {
        const isObj = t && typeof t === 'object';
        const type = isObj ? t.evidence_type || t.type || 'Note' : 'Note';
        const value = isObj ? t.value || '' : String(t);
        const tip = type + ': ' + String(value).slice(0, 80);
        return (
          '<div class="evidence-item" data-tip="' +
          escapeHtml(tip) +
          '" data-tip-pos="left"><div class="type">' +
          escapeHtml(type) +
          '</div>' +
          escapeHtml(value) +
          '</div>'
        );
      })
      .join('');
  }

  async function persistHypotheses(ranked) {
    if (useDB && activeId != null) {
      try {
        await DB.saveHypotheses(activeId, ranked);
      } catch (_) {}
    }
  }

  function renderHypotheses() {
    const plain = evidenceTexts.map((t) =>
      t && typeof t === 'object' ? t.value || '' : String(t)
    );
    const ranked = score(plain);
    const list = document.getElementById('hypList');
    if (!ranked.length) {
      list.innerHTML = '<div class="empty-state">No hypotheses yet — add evidence</div>';
      document.getElementById('nextCmd').textContent = '—';
      document.getElementById('confBadge').textContent = 'Confidence —';
      return ranked;
    }
    list.innerHTML = ranked
      .map((r) => {
        const tip =
          r.cause +
          ' — ' +
          r.confidence +
          '% confidence' +
          (r.nextTest ? ' · next: ' + r.nextTest : '');
        return (
          '<div class="hyp-item" data-tip="' +
          escapeHtml(tip) +
          '" data-tip-pos="left">' +
          '<div class="hyp-top"><span>' +
          escapeHtml(r.cause) +
          '</span>' +
          '<span class="confidence">' +
          r.confidence +
          '%</span></div>' +
          '<div class="meter"><span style="width:' +
          r.confidence +
          '%"></span></div>' +
          '</div>'
        );
      })
      .join('');
    const top = ranked[0];
    document.getElementById('nextCmd').textContent = top.nextTest;
    document.getElementById('confBadge').textContent = 'Confidence ' + top.confidence + '%';
    const th = document.getElementById('timelineHyp');
    if (th)
      th.textContent = ranked
        .slice(0, 3)
        .map((r) => r.cause + ' (' + r.confidence + '%)')
        .join(' · ');
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
            meta:
              (full.device || 'Device') +
              ' · ' +
              (full.status || '') +
              ' · ' +
              (full.created_at || ''),
            device: full.device || 'Device',
            status: full.status,
            pills: full.pills || [],
            closed: !!full.closed,
            verification: full.verification
          };
          evidenceTexts = (full.evidence || []).map((e) =>
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
    document.getElementById('pillRow').innerHTML = (c.pills || [])
      .map((p) => '<div class="pill">' + escapeHtml(p) + '</div>')
      .join('');
    renderCaseSwitcher();
    renderEvidence();
    renderHypotheses();

    if (window.FixHappensKnowledgeUI && window.FixHappensKnowledgeUI.refreshTips) {
      setTimeout(() => window.FixHappensKnowledgeUI.refreshTips(), 50);
    }
  }

  async function reloadActiveCase() {
    if (activeId == null) return;
    await selectCase(activeId);
  }

  async function createCase() {
    const symptom = window.prompt('Symptom / problem description:');
    if (!symptom || !symptom.trim()) return;

    if (useDB) {
      try {
        const row = await DB.createCase({
          symptom: symptom.trim(),
          device: 'Field device',
          status: 'New'
        });
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

  async function importArtifactFromFile() {
    if (!useDB) {
      window.alert('Import requires the durable DB path (Electron).');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        if (raw.schema && raw.schema !== 'fixhappens.case') {
          throw new Error('Not a Fix Happens CaseArtifact (schema mismatch)');
        }
        if (!raw.symptom || !String(raw.symptom).trim()) {
          throw new Error('Artifact missing symptom');
        }
        const row = await DB.createCase({
          symptom: String(raw.symptom).trim(),
          device: raw.device || 'Imported device',
          status: raw.closed ? 'Resolved' : raw.status || 'Investigating'
        });
        const evList = Array.isArray(raw.evidence) ? raw.evidence : [];
        for (const e of evList) {
          const type =
            typeof e === 'string' ? 'Note' : e.evidence_type || e.type || 'Note';
          const value = typeof e === 'string' ? e : e.value || '';
          if (value) await DB.addEvidence(row.id, type, String(value));
        }
        if (Array.isArray(raw.hypotheses) && raw.hypotheses.length) {
          await DB.saveHypotheses(row.id, raw.hypotheses);
        }
        cases[row.id] = {
          symptom: row.symptom,
          meta: 'Imported · ' + (raw.device || 'device'),
          device: row.device,
          status: row.status,
          pills: Array.isArray(raw.pills) ? raw.pills : [],
          closed: !!raw.closed
        };
        await selectCase(row.id);
        window.alert('Imported case #' + row.id + ' (' + evList.length + ' evidence items)');
      } catch (e) {
        window.alert('Import failed: ' + (e.message || e));
      }
    };
    input.click();
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
        open.forEach((c) => {
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
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(btn.getAttribute('data-cmd'));
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1200);
        } catch (_) {
          btn.textContent = 'Failed';
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 1200);
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
        open.forEach((c) => {
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
        const startId =
          meta && meta.activeCaseId && cases[meta.activeCaseId]
            ? meta.activeCaseId
            : open[0] && open[0].id;
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
      const eng = Core && Core.hasEngine && Core.hasEngine() ? 'Core engine' : 'Browser engine';
      engineBadge.textContent = useDB ? eng + ' · DB' : eng + ' · local';
    }

    const ver = document.getElementById('appVersion');
    if (ver) ver.textContent = 'Clear Crystal · v1.3.0';
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
      if (S)
        S.saveEvidence(
          evidenceTexts.map((t) => (t && typeof t === 'object' ? t.value : t))
        );
    }
    input.value = '';
    renderEvidence();
    renderHypotheses();
    if (window.FixHappensKnowledgeUI && window.FixHappensKnowledgeUI.refreshTips) {
      window.FixHappensKnowledgeUI.refreshTips();
    }
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
      try {
        await DB.updateMeta({ solid: on });
      } catch (_) {}
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
            rows.forEach((c) => {
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

  window.reloadActiveCase = reloadActiveCase;
  window.FixHappensApp = {
    reloadActiveCase,
    selectCase,
    createCase,
    closeCase,
    importArtifact: importArtifactFromFile,
    getActiveId: () => activeId
  };

  boot();
})();
