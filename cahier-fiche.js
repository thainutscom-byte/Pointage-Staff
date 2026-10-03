// ============================================================
//  🗒️ CAHIER → FICHE DE L'EMPLOYÉE — chargé par index.html (à mettre sur GitHub à côté de index.html)
//   • sa journée se remplit toute seule avec le cahier de la tablette : 1 lady, 2 lady, Happy Hour
//     (massages annulés retirés ; Outside / Barfine ne sont pas des cases de la fiche)
//   • après « ▶️ เริ่มงาน » : le cahier du jour s'affiche sur son téléphone, SANS argent (ni paiement, ni montant, ni caisse)
//   • mise à jour toutes les 2 minutes quand l'app est ouverte
//   • « ⏹ เลิกงาน » → la tablette affiche « 🏁 journée terminée »
//   • dès que le cahier du jour existe, ses cases 1 lady / 2 lady / Happy Hour sont bloquées (seul le cahier les remplit)
// ============================================================
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const nomMoi = () => (($('name') || {}).value || '').trim().toLowerCase();
  const isoJ = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DEHORS = { out: 1, bf: 1 };
  // ce que compte UNE fille : 3 lady = les 2 premières en duo (2 lady, ou Happy Hour si début entre 16:00 et 20:00), la 3e en 1 lady
  const hhA = t => { const h = new Date(t).getHours(); return h >= 16 && h < 20; };
  const egal = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  function sonType(r, moi) {
    if (r.type !== 'l3') return r.type;
    const i = r.names.findIndex(n => egal(n, moi)); return i >= 2 ? 'l1' : (hhA(r.start) ? 'hh' : 'l2');
  }

  // journée d'aujourd'hui dans la fiche (même jour de travail que la tablette : change à 06:00)
  function jourFiche() {
    const iso = isoJ(workToday());
    return [...document.querySelectorAll('.day')].find(d => { const dd = dayDate(+d.dataset.d); return dd && isoJ(dd) === iso; }) || null;
  }
  const arrivee = d => !!(d && d.querySelector('.arrival') && d.querySelector('.arrival').value);

  // ---------- carte « cahier du jour » (au-dessus des journées) ----------
  function carte() {
    let c = $('cahCard'); if (c) return c;
    const days = $('days'); if (!days) return null;
    c = document.createElement('div'); c.id = 'cahCard'; c.className = 'card'; c.hidden = true;
    c.style.cssText = 'border:2px solid #0f766e;';
    days.parentNode.insertBefore(c, days);
    return c;
  }
  function afficher(rows) {
    const c = carte(); if (!c) return;
    const moi = nomMoi();
    const mesRows = rows.filter(r => !r.annule && r.names.some(n => String(n).trim().toLowerCase() === moi));
    const nb = t => mesRows.filter(r => sonType(r, moi) === t).length;
    const lignes = rows.slice().sort((a, b) => b.n - a.n).map(r => {
      const mien = r.names.some(n => String(n).trim().toLowerCase() === moi);
      const etat = r.annule ? '❌' : r.end ? hm(r.end) : (DEHORS[r.type] ? '🚗 นอกร้าน' : '🔴 กำลังนวด');
      return '<tr style="' + (r.annule ? 'color:#9ca3af;text-decoration:line-through;' : mien ? 'background:#ccfbf1;font-weight:700;' : !r.end ? 'background:#fee2e2;' : '') + '">'
        + '<td>' + r.n + '</td><td>' + r.names.map(esc).join(' + ') + '</td><td>' + hm(r.start) + '</td><td>' + etat + '</td>'
        + '<td>' + (DEHORS[r.type] ? 'นอกร้าน' : (r.room || '')) + '</td><td>' + esc(r.label) + '</td><td>' + (r.ref === 'new' ? '🆕' : '🔁') + '</td></tr>';
    }).join('');
    c.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;">'
      + '<b style="font-size:1.1rem;">🗒️ สมุดวันนี้ · Cahier du jour</b><span class="small">🔄 ' + hm(Date.now()) + '</span></div>'
      + '<div style="margin:8px 0;padding:8px 10px;border-radius:10px;background:#f0fdfa;font-weight:700;">👤 ของฉัน: 1 เลดี้ <b>' + nb('l1') + '</b> · 2 เลดี้ <b>' + nb('l2') + '</b> · Happy Hour <b>' + nb('hh') + '</b>'
      + (nb('out') + nb('bf') ? ' · นอกร้าน <b>' + (nb('out') + nb('bf')) + '</b>' : '') + '</div>'
      + (rows.length ? '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.85rem;min-width:420px;">'
        + '<thead><tr style="text-align:left;color:#6b7280;"><th>N°</th><th>ชื่อ</th><th>เริ่ม</th><th>เสร็จ</th><th>ห้อง</th><th>นวด</th><th>ลูกค้า</th></tr></thead>'
        + '<tbody>' + lignes + '</tbody></table></div>'
        : '<div class="small">ยังไม่มีการนวดในสมุดวันนี้ · aucun massage pour l\'instant</div>');
    c.querySelectorAll('td,th').forEach(x => { x.style.padding = '6px 6px'; x.style.borderBottom = '1px solid #e5e7eb'; x.style.whiteSpace = 'nowrap'; });
    c.hidden = false; c.dataset.ok = '1';
  }

  // 🩺 en cas de problème, la carte s'affiche quand même avec la raison (pour savoir quoi réparer)
  function erreur(msg) {
    const c = carte(); if (!c) return;
    if (c.dataset.ok === '1' && !c.hidden) { const s = c.querySelector('.cahErr') || c.appendChild(Object.assign(document.createElement('div'), { className: 'cahErr small' })); s.textContent = msg; s.style.color = '#b91c1c'; return; }
    c.innerHTML = '<b style="font-size:1.1rem;">🗒️ สมุดวันนี้ · Cahier du jour</b><div class="small" style="color:#b91c1c;font-weight:700;margin-top:6px;">' + esc(msg) + '</div>';
    c.hidden = false;
  }
  // ---------- la fiche se remplit avec le cahier ----------
  function remplir(rows) {
    const day = jourFiche(); if (!day || day.dataset.locked === '1' || !rows.length) return;
    const moi = nomMoi(); if (!moi) return;
    const mes = rows.filter(r => !r.annule && r.names.some(n => String(n).trim().toLowerCase() === moi));
    const vals = { '.solo': mes.filter(r => sonType(r, moi) === 'l1').length, '.duo8': mes.filter(r => sonType(r, moi) === 'l2').length, '.duo': mes.filter(r => sonType(r, moi) === 'hh').length };
    let chg = false;
    Object.keys(vals).forEach(sel => { const i = day.querySelector(sel); if (!i) return;
      const v = String(vals[sel] || ''); if (i.value !== v && !(i.value === '0' && v === '')) { i.value = v; chg = true; } });
    if (chg) { try { calc(); saveState(); } catch (e) {} }
    // 🔒 cases bloquées : seul le cahier de la tablette les remplit (le patron peut toujours corriger en 👑 mode patron)
    Object.keys(vals).forEach(sel => { const i = day.querySelector(sel); if (!i) return;
      if (window.__BOSS) { i.readOnly = false; i.style.background = ''; return; }
      i.readOnly = true; i.style.background = '#e5e7eb'; i.title = 'สมุดลงงาน'; });
    let note = day.querySelector('.cahNote');
    if (!note) { note = document.createElement('div'); note.className = 'cahNote small'; note.style.cssText = 'color:#0f766e;font-weight:700;margin:4px 0;';
      const s = day.querySelector('.solo'); const box = s && s.closest('.grid4'); if (box) box.parentNode.insertBefore(note, box.nextSibling); }
    note.textContent = '🔒 🗒️ จากสมุดลงงาน ' + hm(Date.now()) + ' · แก้เองไม่ได้ · rempli par le cahier (non modifiable)';
  }

  let dernier = 0, enCours = false;
  async function maj(force) {
    if (enCours || window.__BOSS || window.__essai) return;
    const day = jourFiche();
    if (!arrivee(day)) { const c = $('cahCard'); if (c) c.hidden = true; return; }       // seulement après « ▶️ เริ่มงาน »
    if (!force && Date.now() - dernier < 2 * 60000) return;
    enCours = true; dernier = Date.now();
    try {
      const t = await readTxt(await fetch(SHEET_URL + '?cahierjour=1&d=' + isoJ(workToday()) + '&_=' + Date.now()));
      if (t[0] !== '{') { erreur('⚠️ สมุดยังไม่เชื่อม · le serveur ne connaît pas le cahier (script Cahier / Nouvelle version ?) — « ' + t.slice(0, 40) + ' »'); return; }
      const j = JSON.parse(t); if (!j.ok) { erreur('⚠️ ' + t.slice(0, 60)); return; }
      afficher(j.rows || []); remplir(j.rows || []);
    } catch (e) { erreur('📶 ไม่มีอินเทอร์เน็ต · pas de connexion (' + String(e && e.message || e).slice(0, 40) + ')'); dernier = 0; } finally { enCours = false; }
  }
  // 🏁 « ⏹ เลิกงาน » → la tablette du salon affiche « journée terminée »
  if (typeof finishWork === 'function' && !finishWork.__cah) {
    const f0 = finishWork;
    finishWork = function (btn) {
      const r = f0.apply(this, arguments);
      try { const day = btn && btn.closest('.day'), h = day && day.querySelector('.finish').value, nom = (($('name') || {}).value || '').trim();
        if (h && nom) fetch(SHEET_URL, { method: 'POST', body: JSON.stringify({ type: 'cahier', op: 'fin', d: isoJ(workToday()), name: nom, h }) }).catch(() => {}); } catch (e) {}
      return r;
    };
    finishWork.__cah = 1;
  }
  setTimeout(() => maj(true), 2500);
  setInterval(() => maj(false), 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maj(true); });
})();
