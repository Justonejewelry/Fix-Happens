/* Knowledge drawer + contextual field tips (knowledge + plugins) + CaseArtifact export */
(function () {
  const K = window.FixHappensKnowledge;
  const P = window.FixHappensPlugins;
  const X = window.FixHappensExport;

  function el(id) {
    return document.getElementById(id);
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
      '.field-tip.knowledge strong{color:#a8c8ff;}';
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
      body.innerHTML = '<div class="empty-state">Knowledge API unavailable (open in Electron)</div>';
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
      body.innerHTML = '<div class="empty-state">Failed: ' + escapeHtml(e.message || e) + '</div>';
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Combine plugin tips + contextual knowledge tips under the case hero.
   */
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

    // Plugin tips
    if (P && P.available) {
      try {
        const results = await P.run(context);
        for (const r of results || []) {
          if (r.error) continue;
          for (const t of r.tips || []) {
            items.push({ source: 'plugin', label: r.pluginId, text: t });
          }
        }
      } catch (_) {}
    }

    // Knowledge pack tips (contextual)
    if (K && K.available && typeof K.relevant === 'function') {
      try {
        const relevant = await K.relevant({
          symptom,
          evidence
        });
        for (const r of relevant || []) {
          items.push({
            source: 'knowledge',
            label: r.packTitle || r.packId,
            text: r.tip
          });
        }
      } catch (_) {}
    }

    if (!items.length) {
      host.innerHTML = '';
      return;
    }

    // Prefer a mix; cap at 6
    const shown = items.slice(0, 6);
    host.innerHTML =
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

  async function exportActiveCase() {
    if (!X || !X.available) {
      window.alert('Export requires Electron');
      return;
    }
    const badge = el('caseBadge');
    const idMatch = badge && badge.textContent.match(/#(\S+)/);
    const caseId = idMatch ? idMatch[1] : null;
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
