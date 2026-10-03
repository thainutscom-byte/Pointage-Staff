// ============================================================
//  📨 DEMANDES DEPUIS L'ÉCRAN VERROUILLÉ — chargé par index.html (à mettre sur GitHub à côté de index.html)
//  Sur les écrans 🔒 « app fermée hors horaire » et 📍 « app seulement au salon », 3 boutons :
//   🤒 ลาป่วย   : choisir le jour (aujourd'hui → +2 jours), l'heure limite du certificat s'affiche
//                 (début du shift + 4 h, comme le règlement) ; photo du certificat tout de suite ou plus tard.
//                 La journée est cochée « absence avec certificat » → le contrôle automatique habituel s'applique
//                 (sans certificat à l'heure = absence → blocage). Avec certificat, la journée se valide toute seule.
//   🍸 Bar fine : date de début + nombre de jours → demande au patron (✅ / ❌ dans l'onglet « 📨 Demandes »)
//                 Acceptée : ces jours partent « Bar fine » dans Massages (0 massage) et comptent comme congé (pas d'abandon de poste)
//   🚪 ลาออก    : dernier jour + raison → demande au patron (il confirme avec la page patron « 🚪 Démission »)
//   🤝 ชวนเพื่อน : le message « 👭 ชวนเพื่อน » part directement par LINE (1 même amie ne compte jamais 2 fois)
//  Chaque demande part dans Google (fichier Apps Script « Demandes ») + un message LINE tout prêt pour le patron.
// ============================================================
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const nom = () => (($('name') || {}).value || '').trim();
  const tel = () => (($('phone') || {}).value || '').replace(/\D/g, '');
  const LS = 'pointage_demandes';
  const lire = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } };
  const ecrire = a => { try { localStorage.setItem(LS, JSON.stringify(a.slice(-30))); } catch (e) {} };
  const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const jourTh = d => TH_DAYS[d.getDay()] + ' ' + fmtDate(d).slice(0, 5);
  const heureTh = d => fmtHM(d) + ' น.';
  const isoVers = s => new Date(s + 'T00:00:00');
  const NOMS = { maladie: '🤒 ลาป่วย', barfine: '🍸 Bar fine', demission: '🚪 ลาออก', certificat: '📎 ใบรับรองแพทย์' };
  const FR = { maladie: 'Arrêt maladie', barfine: 'Bar fine', demission: 'Démission', certificat: 'Certificat médical' };

  // ---------- envoi à Google (réessayé toutes les minutes si pas de réseau) ----------
  function dayDe(iso) { return [...document.querySelectorAll('.day')].find(d => { const dd = dayDate(+d.dataset.d); return dd && isoD(dd) === iso; }); }
  async function envoyer(r) {
    const body = { type: 'demande', id: r.id, kind: r.kind, name: nom(), phone: tel(), contract: N === 10 ? 'Freelance 10 j' : 'Mensuel 30 j', shift: curShift(),
                   date: r.date || '', lim: r.lim || '', deb: r.deb || '', jours: r.jours || 0, fin: r.fin || '', dernier: r.dernier || '',
                   raison: r.raison || '', note: r.note || '', ref: r.ref || '' };
    if (r.kind === 'maladie' || r.kind === 'certificat') { const day = dayDe(r.date); if (day && day.dataset.cert) { body.photo = day.dataset.cert; body.certAt = day.dataset.certAt || ''; body.retard = day.dataset.certLate === '1'; } }
    try {
      const t = await readTxt(await fetch(SHEET_URL, { method: 'POST', body: JSON.stringify(body) }));
      return t.indexOf('"ok":1') >= 0;
    } catch (e) { return false; }
  }
  async function envoyerAttente() {
    const faits = [];
    for (const r of lire()) if (!r.ok && Date.now() - r.t < 7 * 86400000) { if (await envoyer(r)) faits.push(r.id); }
    if (faits.length) { ecrire(lire().map(x => faits.includes(x.id) ? Object.assign(x, { ok: 1 }) : x)); majPanneaux(); }
  }
  async function nouvelle(r) {
    r.id = r.id || nid(); r.t = Date.now(); r.ok = 0;
    const a = lire(); a.push(r); ecrire(a);
    try { appScan('📨 ' + FR[r.kind] + ' — ' + nom() + ' ' + tel()); } catch (e) {}
    const ok = await envoyer(r);
    if (ok) ecrire(lire().map(x => x.id === r.id ? Object.assign(x, { ok: 1 }) : x));
    majPanneaux();
    return ok;
  }

  // ---------- message LINE tout prêt pour le patron ----------
  function lienLine(r) {
    const L = ['📨 ' + NOMS[r.kind] + ' / ' + FR[r.kind], '👤 ' + nom() + (tel() ? ' · ' + tel() : '')];
    if (r.kind === 'maladie') {
      L.push('📅 ' + jourTh(isoVers(r.date)) + (curShift() ? ' (' + curShift() + ')' : ''));
      L.push('⏰ ใบรับรองแพทย์ภายใน / certificat avant : ' + heureTh(new Date(r.lim)));
      L.push(r.cert ? '📎 ส่งใบรับรองแพทย์ในแอปแล้ว ✅' : '📎 จะส่งใบรับรองแพทย์ในแอปก่อนเวลา');
    }
    if (r.kind === 'barfine') { L.push('📅 ' + jourTh(isoVers(r.deb)) + ' → ' + jourTh(isoVers(r.fin)) + ' · ' + r.jours + ' วัน / jours'); if (r.note) L.push('📝 ' + r.note); }
    if (r.kind === 'demission') { L.push('📅 วันทำงานวันสุดท้าย / dernier jour : ' + jourTh(isoVers(r.dernier))); if (r.raison) L.push('📝 ' + r.raison);
      L.push('👑 https://thainutscom-byte.github.io/Pointage-Staff/patron-demission.html'); }
    return 'https://line.me/R/oaMessage/' + encodeURIComponent(LINE_PATRON) + '/?' + encodeURIComponent(L.join('\n'));
  }

  // ---------- photo du certificat (réduite comme dans la fiche) ----------
  function photo(file) {
    return new Promise((res, rej) => {
      const rd = new FileReader();
      rd.onload = e => { const im = new Image();
        im.onload = () => { const max = 1100, k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); };
        im.onerror = rej; im.src = e.target.result; };
      rd.onerror = rej; rd.readAsDataURL(file);
    });
  }
  function poserCert(day, url) {
    const now = new Date(), dl = justDeadline(day);
    day.dataset.cert = url; day.dataset.certAt = now.toISOString();
    if (dl && now > dl) { day.dataset.certLate = '1'; day.querySelector('.c-med').checked = false; }
    else { delete day.dataset.certLate; day.querySelector('.c-med').checked = true; }
    try { showCert(day); } catch (e) {}
    try { calc(); saveState(); } catch (e) {}
    setTimeout(() => { try { syncSheet(); } catch (e) {} }, 500);
  }
  function cocherMalade(day) {
    const cb = day.querySelector('.c-just');
    if (!cb.checked) { cb.checked = true; toggleJust(cb); }
    try { saveState(); } catch (e) {}
  }
  // journée déclarée malade ici + certificat joint → validée toute seule le jour venu (comme ✔️ ยืนยันวันนี้)
  function verrouiller(day) {
    try { calc(); } catch (e) {}
    day.querySelectorAll('input,button').forEach(i => i.disabled = true);
    const b = day.querySelector('button.mini[onclick^="lockDay"]'); if (b) b.style.display = 'none';
    day.querySelector('.lockedTag').style.display = 'block'; day.dataset.locked = '1';
    try { collapseDay(day); } catch (e) {} try { applyFreeze(); } catch (e) {}
    try { saveState(); } catch (e) {} try { syncSheet(); } catch (e) {} try { reminderCheck(); } catch (e) {}
  }
  function autoVerrou() {
    const dates = lire().filter(r => r.kind === 'maladie').map(r => r.date);
    dates.forEach(iso => { const day = dayDe(iso); if (!day || day.dataset.locked === '1') return;
      if (!day.querySelector('.c-just').checked || !day.dataset.cert || day.querySelector('.arrival').value) return;
      const dd = dayDate(+day.dataset.d); if (dd && dd <= workToday()) verrouiller(day); });
    bfVerrou();
  }
  // 🍸 bar fine accepté par le patron : ses jours sont envoyés « Bar fine » et comptent comme congé (pas d'abandon de poste)
  function bfAcceptes() { return lire().filter(r => r.kind === 'barfine' && /✅/.test(r.dec || '')); }
  function bfJour(iso) { return bfAcceptes().some(r => iso >= r.deb && iso <= r.fin); }
  function brancherBarfine() {
    if (typeof dayPayload === 'function' && !dayPayload.__bf) {
      const o = dayPayload;
      dayPayload = function (day) { const p = o(day); try { if (p && bfJour(p.date) && !day.querySelector('.arrival').value) p.situation = 'Bar fine'; } catch (e) {} return p; };
      dayPayload.__bf = 1;
    }
    if (typeof cycleInfo === 'function' && !cycleInfo.__bf) {
      const o = cycleInfo;
      cycleInfo = function () { const c = o(); try { if (c && c.cycleStart && !c.congeStart) { const t = isoD(workToday());
        const r = bfAcceptes().filter(x => x.fin >= t && x.deb <= c.cycleEnd).sort((a, b) => a.deb < b.deb ? -1 : 1)[0];
        if (r) { c.congeStart = r.deb; c.congeEnd = r.fin; } } } catch (e) {} return c; };
      cycleInfo.__bf = 1;
    }
  }
  function bfVerrou() {
    const t = workToday();
    document.querySelectorAll('.day').forEach(day => {
      if (day.dataset.locked === '1' || day.querySelector('.arrival').value) return;
      const dd = dayDate(+day.dataset.d); if (!dd || dd >= t || !bfJour(isoD(dd))) return;
      verrouiller(day);
    });
  }
  // jours où l'on peut se déclarer malade : aujourd'hui (pas commencé) → 2 jours après, dans le contrat
  function joursMalade() {
    const t = workToday(), out = [];
    document.querySelectorAll('.day').forEach(day => {
      const dd = dayDate(+day.dataset.d); if (!dd || dd < t || Math.round((dd - t) / 86400000) > 2) return;
      if (day.dataset.locked === '1' || day.querySelector('.arrival').value) return;
      out.push({ day, dd });
    });
    return out;
  }

  // ---------- fenêtre (au-dessus des écrans verrouillés) ----------
  const G = document.createElement('div');
  G.id = 'demGate';
  G.style.cssText = 'display:none;position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.85);overflow:auto;';
  G.innerHTML = '<div id="demCarte" style="max-width:400px;width:calc(100% - 28px);box-sizing:border-box;margin:calc(40px + env(safe-area-inset-top,0px)) auto 30px;background:#fff;color:#111827;border-radius:18px;padding:18px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3);"></div>';
  document.body.appendChild(G);
  const C = () => $('demCarte');
  const BTN = 'width:100%;border:none;border-radius:12px;padding:14px;font-size:1.05rem;font-weight:800;color:#fff;margin-top:10px;';
  const ANNULER = '<button type="button" onclick="demFermer()" style="' + BTN + 'background:#e5e7eb;color:#111827;">ยกเลิก</button>';
  const fermer = () => { G.style.display = 'none'; };
  const ouvrirG = html => { C().innerHTML = html; G.style.display = 'block'; G.scrollTop = 0; };
  function fini(r, ok, titre, extra) {
    ouvrirG('<div style="text-align:center;font-size:2.6rem;">' + (ok ? '✅' : '📶') + '</div>'
      + '<div style="text-align:center;font-weight:900;font-size:1.2rem;margin:4px 0 8px;">' + titre + '</div>'
      + (extra || '')
      + (ok ? '' : '<div style="background:#fef3c7;border-radius:10px;padding:10px;font-weight:700;margin:8px 0;">📶 ไม่มีอินเทอร์เน็ต — แอปจะส่งให้หัวหน้าอัตโนมัติเมื่อมีอินเทอร์เน็ต</div>')
      + '<a href="' + lienLine(r) + '" style="display:block;text-align:center;text-decoration:none;' + BTN + 'background:#06c755;box-sizing:border-box;">💬 แจ้งหัวหน้าทาง LINE</a>'
      + '<div style="font-size:.85rem;color:#6b7280;text-align:center;margin-top:6px;">กดปุ่มนี้ → LINE จะเปิด → กด <b>ส่ง</b></div>'
      + '<button type="button" onclick="demFermer()" style="' + BTN + 'background:#2563eb;">ปิด</button>');
  }

  // ===== 🤒 ARRÊT MALADIE =====
  function malade() {
    const J = joursMalade();
    if (!document.getElementById('startDate').value || !curShift()) return ouvrirG('<div style="font-weight:800;font-size:1.1rem;">🤒 ลาป่วย</div><p>⚠️ ยังไม่มีสัญญา / ช่วงเวลาทำงาน</p>' + ANNULER);
    if (!J.length) return ouvrirG('<div style="font-weight:800;font-size:1.1rem;">🤒 ลาป่วย</div><p>⚠️ ไม่มีวันทำงานที่ลาได้ (วันนี้ ถึง 2 วันข้างหน้า)</p>' + ANNULER);
    let h = '<div style="font-weight:900;font-size:1.2rem;">🤒 ลาป่วย</div><div style="color:#6b7280;margin:2px 0 10px;">เลือกวันที่ลาป่วย</div>';
    J.forEach((x, i) => {
      const k = Math.round((x.dd - workToday()) / 86400000), dl = justDeadline(x.day);
      h += '<button type="button" onclick="demMaladeJour(' + x.day.dataset.d + ')" style="' + BTN + 'background:' + (i ? '#64748b' : '#dc2626') + ';text-align:left;line-height:1.35;">'
        + (k === 0 ? 'วันนี้' : k === 1 ? 'พรุ่งนี้' : 'มะรืนนี้') + ' · ' + jourTh(x.dd) + ' · ' + curShift()
        + (dl ? '<br><span style="font-weight:600;font-size:.85rem;">⏰ ส่งใบรับรองแพทย์ภายใน ' + heureTh(dl) + '</span>' : '') + '</button>';
    });
    ouvrirG(h + ANNULER);
  }
  let photoAttente = null;
  function maladeJour(n) {
    const day = document.querySelector('.day[data-d="' + n + '"]'); if (!day) return;
    const dd = dayDate(n), dl = justDeadline(day); photoAttente = day.dataset.cert || null;
    ouvrirG('<div style="font-weight:900;font-size:1.2rem;">🤒 ลาป่วย · ' + jourTh(dd) + '</div>'
      + '<div style="color:#6b7280;margin:2px 0 12px;">ช่วงเวลาทำงาน ' + curShift() + '</div>'
      + '<div style="background:#fee2e2;border:2px solid #dc2626;border-radius:14px;padding:12px;text-align:center;">'
      + '<div style="font-weight:700;">⏰ ต้องส่งใบรับรองแพทย์ภายใน</div>'
      + '<div style="font-size:2.4rem;font-weight:900;color:#dc2626;line-height:1.15;">' + (dl ? heureTh(dl) : '—') + '</div>'
      + '<div style="font-weight:700;">' + (dl ? jourTh(dl) : '') + ' · ' + CERT_HOURS + ' ชม. หลังเวลาเริ่มงาน</div>'
      + '<div style="font-size:.85rem;margin-top:6px;">ไม่มีใบรับรองแพทย์ หรือส่งช้า = นับเป็นขาดงาน (กฎกิโยติน)</div></div>'
      + '<label style="display:block;text-align:center;' + BTN + 'background:#7c3aed;box-sizing:border-box;cursor:pointer;">📷 ถ่ายรูป / เลือกรูปใบรับรองแพทย์'
      + '<input type="file" accept="image/*" style="display:none" onchange="demPhotoChoisie(this)"></label>'
      + '<img id="demApercu" style="display:' + (photoAttente ? 'block' : 'none') + ';max-width:100%;max-height:220px;margin:10px auto 0;border-radius:10px;border:1px solid #d1d5db;"' + (photoAttente ? ' src="' + photoAttente + '"' : '') + '>'
      + '<div id="demPhotoTxt" style="font-size:.85rem;color:#6b7280;text-align:center;margin-top:6px;">' + (photoAttente ? '✅ แนบรูปแล้ว' : 'ยังไม่มีใบรับรองแพทย์? แจ้งลาป่วยก่อนได้ แล้วส่งรูปภายหลัง (ก่อนเวลาด้านบน)') + '</div>'
      + '<button type="button" id="demOkMal" onclick="demMaladeOk(' + n + ')" style="' + BTN + 'background:#16a34a;">✅ ยืนยันลาป่วย</button>'
      + ANNULER);
  }
  async function photoChoisie(inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    $('demPhotoTxt').textContent = '⏳ ...';
    try { photoAttente = await photo(f); const im = $('demApercu'); im.src = photoAttente; im.style.display = 'block'; $('demPhotoTxt').textContent = '✅ แนบรูปแล้ว'; }
    catch (e) { $('demPhotoTxt').textContent = '⚠️ เปิดรูปไม่ได้ — ลองใหม่'; }
  }
  async function maladeOk(n) {
    const day = document.querySelector('.day[data-d="' + n + '"]'); if (!day) return;
    const b = $('demOkMal'); b.disabled = true; b.textContent = '⏳ ...';
    const dd = dayDate(n), dl = justDeadline(day), iso = isoD(dd);
    cocherMalade(day);
    if (photoAttente && photoAttente !== day.dataset.cert) poserCert(day, photoAttente);
    const vieille = lire().find(r => r.kind === 'maladie' && r.date === iso);
    const r = { id: vieille ? vieille.id : undefined, kind: 'maladie', date: iso, lim: dl ? dl.toISOString() : '', cert: !!day.dataset.cert };
    if (vieille) ecrire(lire().filter(x => x.id !== vieille.id));
    const ok = await nouvelle(r);
    autoVerrou();
    fini(r, ok, 'แจ้งลาป่วยแล้ว · ' + jourTh(dd),
      '<div style="text-align:center;line-height:1.6;">' + (day.dataset.cert ? '📎 ส่งใบรับรองแพทย์แล้ว ✅' : '<b style="color:#dc2626;">📎 อย่าลืมส่งรูปใบรับรองแพทย์<br>ภายใน ' + (dl ? heureTh(dl) + ' · ' + jourTh(dl) : '') + '</b><br><span style="font-size:.85rem;">กดปุ่ม 📷 บนหน้าจอล็อก</span>') + '</div>'
      + '<div style="text-align:center;margin-top:6px;">ขอให้หายป่วยเร็วๆ นะ 🙏</div>');
  }
  // certificat envoyé plus tard (bouton sur l'écran verrouillé)
  async function certPlusTard(inp, iso) {
    const f = inp.files && inp.files[0]; if (!f) return;
    const day = dayDe(iso); if (!day) return;
    let url; try { url = await photo(f); } catch (e) { alert('⚠️ เปิดรูปไม่ได้ — ลองใหม่'); return; }
    poserCert(day, url);
    const m = lire().find(r => r.kind === 'maladie' && r.date === iso);
    if (m) ecrire(lire().map(x => x.id === m.id ? Object.assign(x, { cert: true }) : x));
    const ok = await nouvelle({ kind: 'certificat', date: iso, ref: m ? m.id : '', lim: m ? m.lim : '' });
    autoVerrou(); majPanneaux();
    alert((day.dataset.certLate === '1' ? '⚠️ ส่งใบรับรองแพทย์แล้ว แต่เกินเวลา — นับเป็นขาดงาน' : '✅ ส่งใบรับรองแพทย์แล้ว — ทันเวลา') + (ok ? '' : '\n📶 จะส่งให้หัวหน้าเมื่อมีอินเทอร์เน็ต'));
  }

  // ===== 🍸 BAR FINE =====
  function barfine() {
    const t = isoD(workToday());
    ouvrirG('<div style="font-weight:900;font-size:1.2rem;">🍸 Bar fine</div><div style="color:#6b7280;margin:2px 0 12px;">ขออนุญาตหัวหน้า · หัวหน้าจะตอบกลับในแอป</div>'
      + '<label style="font-weight:700;font-size:.9rem;">📅 เริ่มวันที่</label>'
      + '<input id="demBfDeb" type="date" min="' + t + '" value="' + t + '" onchange="demBfMaj()" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #d1d5db;font-size:1rem;margin:4px 0 12px;">'
      + '<label style="font-weight:700;font-size:.9rem;">🗓️ จำนวนวัน</label>'
      + '<div style="display:flex;align-items:center;gap:10px;margin:4px 0 6px;">'
      + '<button type="button" onclick="demBfJours(-1)" style="width:56px;height:52px;border:none;border-radius:12px;background:#e5e7eb;font-size:1.6rem;font-weight:900;">−</button>'
      + '<div id="demBfN" style="flex:1;text-align:center;font-size:2rem;font-weight:900;">1</div>'
      + '<button type="button" onclick="demBfJours(1)" style="width:56px;height:52px;border:none;border-radius:12px;background:#e5e7eb;font-size:1.6rem;font-weight:900;">+</button></div>'
      + '<div id="demBfFin" style="text-align:center;font-weight:700;color:#374151;margin-bottom:10px;"></div>'
      + '<label style="font-weight:700;font-size:.9rem;">📝 หมายเหตุ (ถ้ามี)</label>'
      + '<input id="demBfNote" maxlength="120" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #d1d5db;font-size:1rem;margin-top:4px;">'
      + '<button type="button" id="demBfOk" onclick="demBfOk()" style="' + BTN + 'background:#db2777;">📨 ส่งคำขอให้หัวหน้า</button>' + ANNULER);
    bfN = 1; bfMaj();
  }
  let bfN = 1;
  function bfJours(k) { bfN = Math.max(1, Math.min(30, bfN + k)); bfMaj(); }
  function bfMaj() {
    $('demBfN').textContent = bfN; const v = $('demBfDeb').value; if (!v) { $('demBfFin').textContent = ''; return; }
    const f = addDays(isoVers(v), bfN - 1);
    $('demBfFin').textContent = jourTh(isoVers(v)) + ' → ' + jourTh(f) + ' (' + bfN + ' วัน)';
  }
  async function bfOk() {
    const v = $('demBfDeb').value; if (!v) { alert('⚠️ กรุณาเลือกวันที่เริ่ม'); return; }
    const b = $('demBfOk'); b.disabled = true; b.textContent = '⏳ ...';
    const r = { kind: 'barfine', deb: v, jours: bfN, fin: isoD(addDays(isoVers(v), bfN - 1)), note: ($('demBfNote').value || '').trim() };
    const ok = await nouvelle(r);
    fini(r, ok, 'ส่งคำขอ Bar fine แล้ว', '<div style="text-align:center;line-height:1.6;">📅 ' + jourTh(isoVers(r.deb)) + ' → ' + jourTh(isoVers(r.fin)) + ' · ' + r.jours + ' วัน<br>⏳ รอหัวหน้าอนุมัติ</div>');
  }

  // ===== 🚪 DÉMISSION =====
  function demission() {
    const t = isoD(workToday());
    ouvrirG('<div style="font-weight:900;font-size:1.2rem;">🚪 ลาออก</div><div style="color:#6b7280;margin:2px 0 12px;">แจ้งหัวหน้าว่าต้องการลาออก</div>'
      + '<label style="font-weight:700;font-size:.9rem;">📅 วันทำงานวันสุดท้าย</label>'
      + '<input id="demDmDate" type="date" min="' + t + '" value="' + t + '" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #d1d5db;font-size:1rem;margin:4px 0 12px;">'
      + '<label style="font-weight:700;font-size:.9rem;">📝 เหตุผล</label>'
      + '<select id="demDmRaison" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #d1d5db;font-size:1rem;margin:4px 0 8px;background:#fff;">'
      + ['เหตุผลส่วนตัว', 'กลับบ้าน / ต่างจังหวัด', 'ได้งานใหม่', 'ปัญหาสุขภาพ', 'อื่นๆ'].map(x => '<option>' + x + '</option>').join('') + '</select>'
      + '<input id="demDmNote" maxlength="120" placeholder="รายละเอียด (ถ้ามี)" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #d1d5db;font-size:1rem;margin-bottom:10px;">'
      + '<div style="background:#fef3c7;border-radius:10px;padding:10px;font-size:.9rem;line-height:1.5;">ℹ️ เมื่อหัวหน้ายืนยัน แอปจะถูกล็อก และจองงานใหม่ไม่ได้<br>เงินของวันที่ทำงานแล้ว คิดตามกฎระเบียบ</div>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-weight:700;"><input type="checkbox" id="demDmSur" style="width:22px;height:22px;flex:none;"> ฉันยืนยันว่าต้องการลาออก</label>'
      + '<button type="button" id="demDmOk" onclick="demDmOk()" style="' + BTN + 'background:#dc2626;">🚪 ส่งใบลาออกให้หัวหน้า</button>' + ANNULER);
  }
  async function dmOk() {
    if (!$('demDmSur').checked) { alert('⚠️ กรุณากดยืนยันว่าต้องการลาออก'); return; }
    const v = $('demDmDate').value; if (!v) { alert('⚠️ กรุณาเลือกวันสุดท้าย'); return; }
    const b = $('demDmOk'); b.disabled = true; b.textContent = '⏳ ...';
    const note = ($('demDmNote').value || '').trim();
    const r = { kind: 'demission', dernier: v, raison: $('demDmRaison').value + (note ? ' — ' + note : '') };
    const ok = await nouvelle(r);
    fini(r, ok, 'ส่งใบลาออกแล้ว', '<div style="text-align:center;line-height:1.6;">📅 วันสุดท้าย ' + jourTh(isoVers(v)) + '<br>⏳ รอหัวหน้ายืนยัน</div>');
  }

  // ---------- panneau sur les écrans verrouillés ----------
  let serveur = null, serveurT = 0;
  async function lireServeur() {
    if (Date.now() - serveurT < 5 * 60000 || !tel()) return; serveurT = Date.now();
    try { const t = await readTxt(await fetch(SHEET_URL + '?demandes=1&tel=' + encodeURIComponent(tel()) + '&_=' + Date.now()));
          if (t[0] === '{') { const j = JSON.parse(t); if (j && j.ok) { serveur = j.l || [];
            const dec = {}; serveur.forEach(x => { dec[x.id] = x.dec; });
            ecrire(lire().map(x => dec[x.id] ? Object.assign(x, { dec: dec[x.id] }) : x));
            majPanneaux(); autoVerrou(); } } } catch (e) {}
  }
  function etatHTML() {
    let h = '';
    // 🤒 certificat encore à envoyer
    lire().filter(r => r.kind === 'maladie').forEach(r => {
      const day = dayDe(r.date); if (!day || day.dataset.locked === '1' || !day.querySelector('.c-just').checked) return;
      const dl = r.lim ? new Date(r.lim) : justDeadline(day);
      if (day.dataset.cert) { h += '<div style="background:rgba(22,163,74,.2);border-radius:10px;padding:8px;margin-bottom:8px;font-size:.9rem;">🤒 ' + jourTh(isoVers(r.date)) + ' · 📎 ใบรับรองแพทย์ ' + (day.dataset.certLate === '1' ? '⚠️ ส่งช้า' : '✅ ส่งแล้ว') + '</div>'; return; }
      const reste = dl ? dl - nowT() : 0, hh = Math.floor(reste / 3600000), mm = Math.floor(reste % 3600000 / 60000);
      h += '<div style="background:rgba(220,38,38,.25);border:2px solid #f87171;border-radius:12px;padding:10px;margin-bottom:8px;">'
        + '<div style="font-weight:800;">🤒 ' + jourTh(isoVers(r.date)) + ' · ยังไม่ได้ส่งใบรับรองแพทย์</div>'
        + '<div style="font-size:.95rem;margin:4px 0;">⏰ ภายใน <b style="color:#fbbf24;">' + (dl ? heureTh(dl) + ' · ' + jourTh(dl) : '') + '</b>' + (reste > 0 ? ' (เหลือ ' + hh + ' ชม. ' + mm + ' นาที)' : ' — <b>เกินเวลาแล้ว</b>') + '</div>'
        + '<label style="display:block;text-align:center;border-radius:10px;padding:12px;font-weight:800;background:#7c3aed;color:#fff;cursor:pointer;">📷 ส่งรูปใบรับรองแพทย์'
        + '<input type="file" accept="image/*" style="display:none" onchange="demCertPlusTard(this,\'' + r.date + '\')"></label></div>';
    });
    // 📨 dernières demandes + réponse du patron
    const dec = {}; (serveur || []).forEach(x => { dec[x.id] = x.dec; });
    lire().filter(r => r.kind !== 'certificat' && Date.now() - r.t < 14 * 86400000).slice(-3).reverse().forEach(r => {
      const d = dec[r.id] || '', st = !r.ok ? '📶 รอส่ง' : /✅/.test(d) ? '✅ อนุมัติ' : /❌/.test(d) ? '❌ ไม่อนุมัติ' : r.kind === 'maladie' ? '✅ แจ้งแล้ว' : '⏳ รอหัวหน้า';
      const quoi = r.kind === 'maladie' ? jourTh(isoVers(r.date)) : r.kind === 'barfine' ? jourTh(isoVers(r.deb)) + ' · ' + r.jours + ' วัน' : 'วันสุดท้าย ' + jourTh(isoVers(r.dernier));
      h += '<div style="font-size:.85rem;color:#d1d5db;margin-bottom:4px;">' + NOMS[r.kind] + ' · ' + quoi + ' · <b style="color:#fff;">' + st + '</b></div>';
    });
    return h;
  }
  function panneauHTML() {
    const b = 'border:none;border-radius:12px;padding:12px 6px;font-size:.98rem;font-weight:800;color:#fff;';
    return '<div style="font-weight:800;font-size:1rem;margin-bottom:8px;">📨 แจ้งหัวหน้า</div><div class="demEtat"></div>'
      + '<button type="button" onclick="demOuvrir(\'maladie\')" style="' + b + 'width:100%;background:#dc2626;margin-bottom:8px;">🤒 ลาป่วย (ใบรับรองแพทย์)</button>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + '<button type="button" onclick="demOuvrir(\'barfine\')" style="' + b + 'background:#db2777;">🍸 Bar fine</button>'
      + '<button type="button" onclick="demOuvrir(\'demission\')" style="' + b + 'background:#475569;">🚪 ลาออก</button></div>'
      + '<button type="button" onclick="parTypeSet(\'ami\');parPartager(\'line\')" style="' + b + 'width:100%;margin-top:8px;background:#06c755;">🤝 ชวนเพื่อน รับ 2,000 ฿</button>';
  }
  function installer() {
    [['plageGate', 'a[href*="line.me/R/ti/g/"]'], ['gpsGate', null]].forEach(([id, avant]) => {
      const g = $(id); if (!g || g.querySelector('.demPanel')) return;
      const inner = g.firstElementChild; if (!inner) return;
      const p = document.createElement('div'); p.className = 'demPanel';
      p.style.cssText = 'margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,.2);text-align:left;';
      p.innerHTML = panneauHTML();
      const ref = avant ? inner.querySelector(avant) : null;
      if (ref) inner.insertBefore(p, ref); else inner.appendChild(p);
    });
    majPanneaux();
  }
  function visible() { return !!nom() && /^0\d{9}$/.test(tel()) && !!($('startDate') || {}).value && !window.__essai && !window.__BOSS && nom().toLowerCase() !== 'boss'; }
  function majPanneaux() {
    document.querySelectorAll('.demPanel').forEach(p => {
      p.style.display = visible() ? 'block' : 'none';
      const e = p.querySelector('.demEtat'); if (e) { const h = etatHTML(); if (e.innerHTML !== h) e.innerHTML = h; }
    });
  }

  // ---------- fonctions appelées par les boutons ----------
  window.demOuvrir = k => { if (!visible()) return; ({ maladie: malade, barfine, demission })[k](); };
  window.demFermer = fermer;
  window.demMaladeJour = maladeJour;
  window.demPhotoChoisie = photoChoisie;
  window.demMaladeOk = maladeOk;
  window.demCertPlusTard = certPlusTard;
  window.demBfJours = bfJours;
  window.demBfMaj = bfMaj;
  window.demBfOk = bfOk;
  window.demDmOk = dmOk;

  function tick() {
    try { installer(); } catch (e) {}
    try { brancherBarfine(); } catch (e) {}
    try { autoVerrou(); } catch (e) {}
    const ouvert = ['plageGate', 'gpsGate'].some(id => { const g = $(id); return g && g.style.display === 'block'; });
    if (ouvert || (lire().some(r => r.kind === 'barfine') && Date.now() - serveurT > 30 * 60000)) lireServeur();
  }
  setTimeout(tick, 1500); setInterval(tick, 30000);
  setInterval(envoyerAttente, 60000); setTimeout(envoyerAttente, 8000);
  // le compte à rebours du certificat se met à jour quand un écran verrouillé est affiché
  setInterval(() => { const ouvert = ['plageGate', 'gpsGate'].some(id => { const g = $(id); return g && g.style.display === 'block'; }); if (ouvert) majPanneaux(); }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
})();
