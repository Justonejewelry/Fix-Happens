/* Knowledge drawer + field tips + privileged scan runner UI + CaseArtifact export */
(function () {
  const K = window.FixHappensKnowledge;
  const P = window.FixHappensPlugins;
  const X = window.FixHappensExport;
  const S = window.FixHappensScan;
  const DB = window.FixHappensDB;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function activeCaseId() {
    const badge = el('caseBadge');
    const idMatch = badge && badge.textContent.match(/#(\S+)/);
    return idMatch ? idMatch[1] : null;
  }

  function ensureDrawer() {
    if (el('knowledgeDrawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'knowledgeDrawer';
    drawer.innerHTML =
      '<div class="kd-backdrop" id="kdBackdrop"></div>' +
      '<aside class="kd-panel glass" role="dialog" aria-label="Knowledge">' +
      '  <div class="kd-head">' +
      '    <div class="kd-title"><span class="kd-icon">📚</span> Knowledge packs</div>' +
      '    <button type="button" class="btn" id="kdClose">Close</button>' +
      '  </div>' +
      '  <div class="kd-body" id="kdBody"><div class="empty-state">Loading…</div></div>' +
      '</aside>';
    document.body.appendChild(drawer);

    const style = document.createElement('style');
    style.textContent =
      '#knowledgeDrawer{display:none;position:fixed;inset:0;z-index:100;}' +
      '#knowledgeDrawer.open{display:block;}' +
      '.kd-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);}' +
      '.kd-panel{position:absolute;top:12px;right:12px;bottom:12px;width:min(420px,92vw);' +
      'padding:16px;display:flex;flex-direction:column;gap:12px;overflow:hidden;}' +
      '.kd-head{display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
      '.kd-title{font-weight:700;font-size:16px;display:flex;align-items:center;gap:8px;}' +
      '.kd-body{overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px;}' +
      '.kd-pack{padding:12px;border-radius:16px;border:1px solid var(--line);background:var(--surface);}' +
      '.kd-pack h4{margin:0 0 6px;font-size:14px;}' +
      '.kd-pack .meta{font-size:11px;color:var(--muted);margin-bottom:8px;}' +
      '.kd-pack li{margin:0 0 4px;font-size:12.5px;color:var(--muted);}' +
      '#fieldTips{margin-top:12px;}' +
      '.field-tip{padding:8px 10px;border-radius:12px;border:1px solid rgba(255,90,165,.25);' +
      'background:rgba(255,90,165,.08);font-size:12.5px;margin-bottom:6px;color:var(--muted);}' +
      '.field-tip strong{color:#ffc2dc;font-size:11px;display:block;margin-bottom:2px;}' +
      '.field-tip.knowledge{border-color:rgba(120,180,255,.3);background:rgba(80,140,255,.08);}' +
      '.field-tip.knowledge strong{color:#a8c8ff;}' +
      '#scanPanel{margin-top:10px;padding:12px;border-radius:16px;border:1px solid rgba(120,200,160,.25);' +
      'background:rgba(60,140,100,.08);}' +
      '#scanPanel .scan-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}' +
      '#scanPanel .scan-title{font-weight:700;font-size:13px;color:#b8f0d0;}' +
      '#scanPanel .scan-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}' +
      '#scanPanel button.scan-btn{font-size:11.5px;padding:6px 10px;border-radius:10px;' +
      'border:1px solid rgba(120,200,160,.35);background:rgba(80,160,120,.2);color:#d8ffe8;cursor:pointer;}' +
      '#scanPanel button.scan-btn:disabled{opacity:.45;cursor:not-allowed;}' +
      '#scanPanel button.scan-btn:hover:not(:disabled){background:rgba(80,160,120,.35);}' +
      '#scanOutput{margin-top:8px;max-height:180px;overflow:auto;font-family:ui-monospace,monospace;' +
      'font-size:11px;white-space:pre-wrap;color:var(--muted);padding:8px;border-radius:10px;' +
      'background:rgba(0,0,0,.25);border:1px solid var(--line);display:none;}' +
      '.priv-toggle{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);}';
    document.head.appendChild(style);

    el('kdClose').onclick = closeDrawer;
    el('kdBackdrop').onclick = closeDrawer;
  }

  function openDrawer() {
    ensureDrawer();
    el('knowledgeDrawer').classList.add('open');
    renderPacks();
  }

  function closeDrawer() {
    const d = el('knowledgeDrawer');
    if (d) d.classList.remove('open');
  }

  async function renderPacks() {
    const body = el('kdBody');
    if (!body) return;
    if (!K || !K.available) {
      body.innerHTML =
        '<div class="empty-state">Knowledge API unavailable (open in Electron)</div>';
      return;
    }
    try {
      const { packs, errors } = await K.list();
      if (!packs.length) {
        body.innerHTML =
          '<div class="empty-state">No knowledge packs found</div>' +
          (errors && errors.length
            ? '<div class="empty-state">' + errors.map((e) => e.error).join('; ') + '</div>'
            : '');
        return;
      }
      body.innerHTML = packs
        .map((p) => {
          const tips = (p.tips || []).map((t) => '<li>' + escapeHtml(t) + '</li>').join('');
          const causes = (p.relatedCauses || []).join(', ');
          const cat = p.category ? ' · ' + escapeHtml(p.category) : '';
          return (
            '<div class="kd-pack">' +
            '<h4>' +
            escapeHtml(p.title || p.id) +
            '</h4>' +
            '<div class="meta">v' +
            escapeHtml(String(p.version || 1)) +
            cat +
            (causes ? ' · ' + escapeHtml(causes) : '') +
            '</div>' +
            (tips ? '<ul style="margin:0;padding-left:18px">' + tips + '</ul>' : '') +
            '</div>'
          );
        })
        .join('');
    } catch (e) {
      body.innerHTML =
        '<div class="empty-state">Failed: ' + escapeHtml(e.message || e) + '</div>';
    }
  }

  async function refreshFieldTips() {
    let host = el('fieldTips');
    if (!host) {
      const hero =
        document.querySelector('.case-hero .hero-actions') ||
        document.querySelector('.case-hero');
      if (!hero) return;
      host = document.createElement('div');
      host.id = 'fieldTips';
      host.style.width = '100%';
      hero.parentNode.insertBefore(host, hero.nextSibling);
    }

    const symptom = el('symptom')?.textContent || '';
    const evidence = [...document.querySelectorAll('#evidenceList .evidence-item')].map(
      (n) => n.innerText
    );
    const context = {
      symptom,
      evidence,
      platform: 'macos',
      device: el('deviceBadge')?.textContent || ''
    };

    const items = [];
    const recommended = [];

    if (P && P.available) {
      try {
        const results = await P.run(context);
        for (const r of results || []) {
          if (r.error) continue;
          for (const t of r.tips || []) {
            items.push({ source: 'plugin', label: r.pluginId, text: t });
          }
          for (const s of r.recommendedScans || []) {
            recommended.push(s);
          }
        }
      } catch (_) {}
    }

    if (K && K.available && typeof K.relevant === 'function') {
      try {
        const relevant = await K.relevant({ symptom, evidence });
        for (const r of relevant || []) {
          items.push({
            source: 'knowledge',
            label: r.packTitle || r.packId,
            text: r.tip
          });
        }
      } catch (_) {}
    }

    let html = '';
    if (items.length) {
      const shown = items.slice(0, 6);
      html +=
        '<div class="section-head" style="margin-top:8px">Field tips</div>' +
        shown
          .map((t) => {
            const cls = t.source === 'knowledge' ? 'field-tip knowledge' : 'field-tip';
            return (
              '<div class="' +
              cls +
              '"><strong>' +
              escapeHtml(t.label) +
              '</strong>' +
              escapeHtml(t.text) +
              '</div>'
            );
          })
          .join('');
    }

    html += await renderScanPanel(recommended);
    host.innerHTML = html;
    wireScanButtons();
  }

  async function renderScanPanel(recommended) {
    if (!S || !S.available) return '';

    let status = { enabled: false, available: true };
    try {
      status = await S.status();
    } catch (_) {}

    const scans = [];
    const seen = new Set();
    for (const s of recommended || []) {
      const key = s.planId + JSON.stringify(s.params || {});
      if (seen.has(key)) continue;
      seen.add(key);
      scans.push(s);
    }

    // Always offer baseline plans when panel is shown with scan context
    if (!scans.length) {
      // still show toggle + note when no recommendations
      return (
        '<div id="scanPanel">' +
        '<div class="scan-head">' +
        '<div class="scan-title">Privileged scans</div>' +
        privToggleHtml(status.enabled) +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--muted)">' +
        (status.enabled
          ? 'No recommended scans for current evidence. Add scan/map keywords or pick a plan from the catalog later.'
          : 'Enable to run allowlisted read-only network diagnostics (ARP, ifconfig, ping, …). Off by default.') +
        '</div></div>'
      );
    }

    const buttons = scans
      .slice(0, 8)
      .map((s, i) => {
        const label = s.label || s.planId;
        return (
          '<button type="button" class="scan-btn" data-scan-idx="' +
          i +
          '" ' +
          (status.enabled ? '' : 'disabled title="Enable privileged scans first"') +
          '>' +
          escapeHtml(label) +
          '</button>'
        );
      })
      .join('');

    // stash for click handlers
    window.__fhScanRecs = scans.slice(0, 8);

    return (
      '<div id="scanPanel">' +
      '<div class="scan-head">' +
      '<div class="scan-title">Privileged scans</div>' +
      privToggleHtml(status.enabled) +
      '</div>' +
      '<div class="scan-actions">' +
      buttons +
      '</div>' +
      '<div id="scanOutput"></div>' +
      '</div>'
    );
  }

  function privToggleHtml(enabled) {
    return (
      '<label class="priv-toggle">' +
      '<input type="checkbox" id="privScanToggle" ' +
      (enabled ? 'checked' : '') +
      '/>' +
      ' Enable' +
      '</label>'
    );
  }

  function wireScanButtons() {
    const toggle = el('privScanToggle');
    if (toggle) {
      toggle.onchange = async () => {
        if (!S) return;
        try {
          await S.setEnabled(!!toggle.checked);
          await refreshFieldTips();
        } catch (e) {
          window.alert('Could not update scan preference: ' + (e.message || e));
        }
      };
    }

    document.querySelectorAll('#scanPanel .scan-btn').forEach((btn) => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute('data-scan-idx'));
        const rec = (window.__fhScanRecs || [])[idx];
        if (!rec || !S) return;
        btn.disabled = true;
        const out = el('scanOutput');
        if (out) {
          out.style.display = 'block';
          out.textContent = 'Running ' + rec.planId + '…';
        }
        try {
          const result = await S.run({
            planId: rec.planId,
            params: rec.params || {},
            caseId: activeCaseId()
          });
          if (out) {
            out.textContent = [
              result.command ? '$ ' + result.command : rec.planId,
              result.stdout || '',
              result.stderr || '',
              result.error ? 'Error: ' + result.error : '',
              result.attachedEvidence ? '(attached to case evidence)' : '',
              result.durationMs != null ? result.durationMs + 'ms' : ''
            ]
              .filter(Boolean)
              .join('\n');
          }
          // Refresh evidence list if app exposes a reload hook
          if (result.attachedEvidence && typeof window.reloadActiveCase === 'function') {
            window.reloadActiveCase();
          }
        } catch (e) {
          if (out) out.textContent = 'Failed: ' + (e.message || e);
        } finally {
          btn.disabled = false;
        }
      };
    });
  }

  async function exportActiveCase() {
    if (!X || !X.available) {
      window.alert('Export requires Electron');
      return;
    }
    const caseId = activeCaseId();
    if (!caseId) {
      window.alert('No active case');
      return;
    }
    try {
      const artifact = await X.exportCase(caseId);
      const blob = new Blob([JSON.stringify(artifact, null, 2)], {
        type: 'application/json'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fix-happens-case-' + caseId + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      window.alert('Export failed: ' + (e.message || e));
    }
  }

  function wireNav() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      const label = (item.textContent || '').trim();
      if (label.includes('Knowledge')) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', openDrawer);
      }
    });

    const menuExport = el('menuExport');
    if (menuExport) {
      menuExport.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        exportActiveCase();
      });
    }
  }

  function observe() {
    const list = el('evidenceList');
    if (list) {
      new MutationObserver(() => refreshFieldTips()).observe(list, {
        childList: true,
        subtree: true
      });
    }
    const sym = el('symptom');
    if (sym) {
      new MutationObserver(() => refreshFieldTips()).observe(sym, {
        characterData: true,
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureDrawer();
      wireNav();
      observe();
      setTimeout(refreshFieldTips, 600);
    });
  } else {
    ensureDrawer();
    wireNav();
    observe();
    setTimeout(refreshFieldTips, 600);
  }

  window.FixHappensKnowledgeUI = {
    open: openDrawer,
    refreshTips: refreshFieldTips,
    exportCase: exportActiveCase
  };
})();
