/* Knowledge drawer + plugin tip strip + CaseArtifact export (macOS) */
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
      '#pluginTips{margin-top:12px;}' +
      '.plugin-tip{padding:8px 10px;border-radius:12px;border:1px solid rgba(255,90,165,.25);' +
      'background:rgba(255,90,165,.08);font-size:12.5px;margin-bottom:6px;color:var(--muted);}' +
      '.plugin-tip strong{color:#ffc2dc;font-size:11px;display:block;margin-bottom:2px;}';
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
          return (
            '<div class="kd-pack">' +
            '<h4>' +
            escapeHtml(p.title || p.id) +
            '</h4>' +
            '<div class="meta">v' +
            escapeHtml(String(p.version || 1)) +
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

  async function refreshPluginTips() {
    let host = el('pluginTips');
    if (!host) {
      const hero = document.querySelector('.case-hero .hero-actions') || document.querySelector('.case-hero');
      if (!hero) return;
      host = document.createElement('div');
      host.id = 'pluginTips';
      host.style.width = '100%';
      hero.parentNode.insertBefore(host, hero.nextSibling);
    }
    if (!P || !P.available) {
      host.innerHTML = '';
      return;
    }

    const symptom = el('symptom')?.textContent || '';
    const evidence = [...document.querySelectorAll('#evidenceList .evidence-item')].map(
      (n) => n.innerText
    );
    try {
      const results = await P.run({
        symptom,
        evidence,
        platform: 'macos',
        device: el('deviceBadge')?.textContent || ''
      });
      const tips = [];
      for (const r of results || []) {
        if (r.error) continue;
        for (const t of r.tips || []) {
          tips.push({ plugin: r.pluginId, text: t });
        }
      }
      if (!tips.length) {
        host.innerHTML = '';
        return;
      }
      host.innerHTML =
        '<div class="section-head" style="margin-top:8px">Plugin tips</div>' +
        tips
          .slice(0, 5)
          .map(
            (t) =>
              '<div class="plugin-tip"><strong>' +
              escapeHtml(t.plugin) +
              '</strong>' +
              escapeHtml(t.text) +
              '</div>'
          )
          .join('');
    } catch (_) {
      host.innerHTML = '';
    }
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

  // Observe evidence list + symptom for tip refresh
  function observe() {
    const list = el('evidenceList');
    if (list) {
      new MutationObserver(() => refreshPluginTips()).observe(list, {
        childList: true,
        subtree: true
      });
    }
    const sym = el('symptom');
    if (sym) {
      new MutationObserver(() => refreshPluginTips()).observe(sym, {
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
      setTimeout(refreshPluginTips, 600);
    });
  } else {
    ensureDrawer();
    wireNav();
    observe();
    setTimeout(refreshPluginTips, 600);
  }

  window.FixHappensKnowledgeUI = {
    open: openDrawer,
    refreshTips: refreshPluginTips,
    exportCase: exportActiveCase
  };
})();
