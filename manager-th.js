// 🇹🇭 PAGES EN THAÏ POUR LE MANAGER : sur le téléphone du manager (ouvert depuis manager.html), les pages
// « Places disponibles », « Partager l'app » et « Réservations / Essais » s'affichent en thaï.
// Le téléphone du patron (a ouvert patron.html) garde le français.
(function () {
  function g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  if (g('pointage_espace') !== 'manager' || g('pointage_patron') === '1') return;
  document.documentElement.lang = 'th';
  var E = function (s) { return new RegExp('^\\s*' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$'); };   // texte exact
  var R = [
    // ===== 🗓️ Places disponibles =====
    [E('🗓️ Places disponibles'), '🗓️ ที่ว่าง'],
    [E('👥 Places par horaire'), '👥 จำนวนคนต่อช่วงเวลา'],
    [E('Horaire'), 'ช่วงเวลา'],
    [E('☀️ avril → oct.'), '☀️ เม.ย. → ต.ค.'],
    [E('🌙 1 nov. → 30 mars'), '🌙 1 พ.ย. → 30 มี.ค.'],
    [E('✅ Enregistrer'), '✅ บันทึก'],
    [E('✅ Enregistré'), '✅ บันทึกแล้ว'],
    [/❌ Pas enregistré.*/, '❌ บันทึกไม่สำเร็จ · แจ้งเจ้าของร้าน'],
    [E('Libres aujourd\'hui'), 'ว่างวันนี้'],
    [E('10 jours'), '10 วัน'],
    [/⚠️ (\d+) de trop/, '⚠️ เกิน $1'],
    [E('complet'), 'เต็ม'],
    [E('▸ qui ?'), '▸ ใคร?'],
    [/1\/4 = 1 place libre sur 4.*/, '1/4 = ว่าง 1 จาก 4 ที่ · 🟢 ยังมีที่ว่าง · 🔴 0/4 เต็ม · « 10 วัน » = วันที่คนเยอะที่สุด · 👆 แตะช่วงเวลาเพื่อดูว่าใครอยู่'],
    [/⚠️ (\d+) contrats? comptés? sans fiche dans « Employés » : /, '⚠️ $1 สัญญาไม่มีในรายชื่อพนักงาน : '],
    [/→ touchez l'horaire : 🗑️ Retirer.*/, '→ แตะช่วงเวลา : 🗑️ ลบออก ถ้าซ้ำ/ไม่มาทำงาน · ➕ สร้างใหม่ ถ้าเป็นพนักงานจริง'],
    [/⚠️ Le tableau dit (\d+) et la liste montre (\d+) fille\(s\) aujourd'hui — touchez 🔄 Actualiser/, '⚠️ ตารางบอก $1 แต่รายชื่อมี $2 คนวันนี้ — แตะ 🔄 รีเฟรช'],
    [/✔ (\d+) filles? aujourd'hui sur cet horaire · (\d+) place\(s\) libre\(s\)/, '✔ วันนี้ $1 คนในช่วงเวลานี้ · ว่าง $2 ที่'],
    [E('Personne sur cet horaire.'), 'ไม่มีใครในช่วงเวลานี้'],
    [/⚠️ pas dans Employés/, '⚠️ ไม่มีในรายชื่อพนักงาน'],
    [/📞 même numéro que la fiche « (.+) » → doublon \(nom écrit autrement\)/, '📞 เบอร์เดียวกับ « $1 » → ซ้ำ (ชื่อเขียนต่างกัน)'],
    [/🚫 bloquée \(pas comptée\)/, '🚫 ถูกบล็อก (ไม่นับ)'],
    [/🧪 test \(pas comptée\)/, '🧪 ทดสอบ (ไม่นับ)'],
    [E('🔓 Débloquer'), '🔓 ปลดบล็อก'],
    [E('➕ Recréer sa fiche'), '➕ สร้างใหม่'],
    [E('🗑️ Retirer'), '🗑️ ลบออก'],
    [E('➕ Ajouter une employée sur cet horaire'), '➕ เพิ่มพนักงานในช่วงเวลานี้'],
    [E('⏳ chargement des employées…'), '⏳ กำลังโหลดรายชื่อ…'],
    [/— choisir l'employée —/, '— เลือกพนักงาน —'],
    [/ — déjà (.+)$/, ' — มีช่วงเวลาแล้ว $1'],
    [E('✍️ Autre : taper le nom et le numéro'), '✍️ อื่น ๆ : พิมพ์ชื่อและเบอร์'],
    [/⚠️ liste non chargée.*/, '⚠️ โหลดรายชื่อไม่ได้ — แตะช่วงเวลาอีกครั้ง'],
    [E('Début :'), 'เริ่ม :'],
    [E('Contrat mensuel (30 jours)'), 'สัญญารายเดือน (30 วัน)'],
    [E('Contrat freelance (10 jours)'), 'สัญญาฟรีแลนซ์ (10 วัน)'],
    [E('✔ Valider'), '✔ ยืนยัน'],
    [/\(mensuel\)/, '(รายเดือน)'],
    [/Chargement… \(réessayez dans un instant\)/, 'กำลังโหลด… (ลองใหม่อีกสักครู่)'],
    [/⚠️ Le script Google n'a pas encore la liste des noms\./, '⚠️ ระบบยังไม่พร้อม · แจ้งเจ้าของร้าน'],
    [/→ Apps Script : collez.*/, ''],
    [/⚠️ Google n'a pas répondu\./, '⚠️ Google ไม่ตอบ'],
    [/⚠️ Erreur du script : /, '⚠️ ระบบผิดพลาด : '],
    [E('🔄 Réessayer'), '🔄 ลองใหม่'],
    // ===== 📣 Partager l'app =====
    [E('📣 Partager l\'app (recrutement)'), '📣 แชร์แอป (รับสมัครพนักงาน)'],
    [E('1. Le message (en thaï)'), '1. ข้อความ'],
    [E('📢 Annonce'), '📢 ประกาศ'],
    [E('✂️ Court'), '✂️ สั้น'],
    [E('🧪 Essai'), '🧪 ทดลองงาน'],
    [/Vous pouvez modifier le texte\..*/, 'แก้ไขข้อความได้ · ลิงก์แอปจะเพิ่มท้ายข้อความอัตโนมัติ (แยกตามช่องทาง)'],
    [E('2. Envoyer'), '2. ส่ง'],
    [E('📤 Autre (partage du téléphone)'), '📤 อื่น ๆ (แชร์จากโทรศัพท์)'],
    [/^Instagram et TikTok ne permettent pas.*/, 'Instagram และ TikTok ส่งข้อความสำเร็จรูปไม่ได้ : ระบบจะ'],
    [E('copié'), 'คัดลอก'],
    [/^, l'app s'ouvre, il suffit de $/, 'ข้อความให้ แอปจะเปิด แล้ว'],
    [E('coller'), 'วาง'],
    [/^ \(dans la bio, un message ou la légende d'une vidéo\)\.$/, ' (ในไบโอ ข้อความ หรือคำบรรยายวิดีโอ)'],
    [E('3. Les liens (à copier)'), '3. ลิงก์ (คัดลอก)'],
    [/📋 Message copié — collez-le dans la publication/, '📋 คัดลอกข้อความแล้ว — วางในโพสต์'],
    [/📋 Message copié — collez-le dans la conversation/, '📋 คัดลอกข้อความแล้ว — วางในแชท'],
    [/📋 Message copié — collez-le dans (.+)/, '📋 คัดลอกข้อความแล้ว — วางใน $1'],
    [E('📋 Message copié'), '📋 คัดลอกข้อความแล้ว'],
    [E('📤 Autre'), '📤 อื่น ๆ'],
    // ===== 📝 Réservations / 🧪 Essais (déjà en 2 langues : on garde seulement le thaï) =====
    [E('🧪 Gestion des essais'), '🧪 จัดการทดลองงาน'],
    [E('📝 Réservations reçues'), '📝'],
    [/· reçu \/ /, '· '],
    [/🧪 Essai 1 jour \/ ทดลองงาน 1 วัน/, '🧪 ทดลองงาน 1 วัน'],
    [/ \/ ทดลองงาน 1 วัน/, ' · ทดลองงาน 1 วัน'],
    [/🎂 (\d+) ans \/ ปี/, '🎂 $1 ปี'],
    [/Appeler \/ โทร/, 'โทร'],
    [/^(?:[^\/]*[a-zàâçéèêëîïôûùüÿœ'][^\/]*) \/ ([^\/]*[฀-๿].*)$/, '$1'],
    [/\b(\d+) jours\b/, '$1 วัน'],
    // ===== communs =====
    [E('Chargement…'), 'กำลังโหลด…'],
    [E('🔄 Actualiser'), '🔄 รีเฟรช'],
    [/⚠️ Pas de connexion — réessayez/, '⚠️ ไม่มีการเชื่อมต่อ ลองใหม่'],
    [/❌ Pas fait — réessayez/, '❌ ไม่สำเร็จ ลองใหม่'],
    [E('← Fiche manager'), '← หน้าผู้จัดการ'],
    [/\baujourd'hui\b/, 'วันนี้']
  ];
  function tr(s) {
    if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return s;
    var t = s;
    for (var i = 0; i < R.length; i++) if (R[i][0].test(t)) t = t.replace(R[i][0], R[i][1]);
    return t;
  }
  // ===== dialogues (alert / confirm / prompt) =====
  var D = [
    [/^Mettre (.+) sur (.+) à partir du (.+) \?$/, 'ให้ $1 ทำช่วงเวลา $2 เริ่ม $3 ?'],
    [/^🔴 Cet horaire est complet le (.+)\.\nL'ajouter quand même \?$/, '🔴 ช่วงเวลานี้เต็มแล้ววันที่ $1\nเพิ่มอยู่ดีไหม?'],
    [/^⛔ (.+) a déjà un contrat : ([^\n]+)\.\n[\s\S]*$/, '⛔ $1 มีสัญญาอยู่แล้ว : $2'],
    [/^✅ (.+) est sur (.+) du (.+) au (.+)$/, '✅ $1 ทำช่วงเวลา $2 ตั้งแต่ $3 ถึง $4'],
    [/^Débloquer (.+) \?[\s\S]*$/, 'ปลดบล็อก $1 ?'],
    [/^✅ (.+) est débloquée[\s\S]*$/, '✅ ปลดบล็อก $1 แล้ว'],
    [/^ℹ️ (.+) n'est plus bloquée.*$/, 'ℹ️ $1 ไม่ได้ถูกบล็อกแล้ว — รีเฟรชหน้า'],
    [/^Recréer la fiche de (.+) \((.+)\)[\s\S]*$/, 'สร้างข้อมูลพนักงาน $1 ($2) ใหม่?'],
    [/^✅ Fiche de (.+) recréée.*$/, '✅ สร้างข้อมูล $1 ใหม่แล้ว'],
    [/^Retirer du planning le contrat de (.+) \((.+), début (.+)\) \?[\s\S]*$/, 'ลบสัญญาของ $1 ($2 เริ่ม $3) ออกจากตาราง?\nทำเฉพาะเมื่อซ้ำ หรือไม่ทำงานแล้ว'],
    [/^Surnom en lettres anglaises.*$/, 'ชื่อเล่นเป็นภาษาอังกฤษ (เช่น Namsom)'],
    [/^Numéro thaï à 10 chiffres.*$/, 'เบอร์โทรไทย 10 หลัก (06 / 08 / 09…)'],
    [/^Choisissez l'employée$/, 'เลือกพนักงาน'],
    [/^Choisissez la date de début$/, 'เลือกวันเริ่ม'],
    [/^🔐 Activez ce téléphone patron$/, '🔐 แจ้งเจ้าของร้าน'],
    [/^⚠️ Le planning a changé — rechargez la page$/, '⚠️ ตารางเปลี่ยนแล้ว — รีเฟรชหน้า'],
    [/^❌ Pas fait — réessayez$/, '❌ ไม่สำเร็จ ลองใหม่'],
    // réservations : « français\nไทย » → seulement le thaï
    [/^[\s\S]*?\n((?=[\s\S]*[฀-๿])[\s\S]+)$/, '$1']
  ];
  function trD(s) { s = String(s == null ? '' : s); for (var i = 0; i < D.length; i++) if (D[i][0].test(s)) return s.replace(D[i][0], D[i][1]); return tr(s); }
  var A = window.alert, C = window.confirm, P = window.prompt;
  window.alert = function (m) { return A.call(window, trD(m)); };
  window.confirm = function (m) { return C.call(window, trD(m)); };
  window.prompt = function (m, d) { return P.call(window, trD(m), d); };
  // ===== textes de la page (et tout ce qui s'ajoute ensuite) =====
  function nd(n) {
    if (n.nodeType === 3) { var v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA' || n.tagName === 'CODE') return;
    if (n.placeholder) { var p = tr(n.placeholder); if (/^Surnom/.test(p)) p = 'ชื่อเล่น (ภาษาอังกฤษ เช่น Namsom)'; n.placeholder = p; }
    for (var c = n.firstChild; c; c = c.nextSibling) nd(c);
  }
  function go() {
    document.title = tr(document.title.replace(/^🗓️ Places disponibles$/, '🗓️ ที่ว่าง').replace(/^📣 Partager l'app$/, '📣 แชร์แอป'));
    nd(document.body);
    new MutationObserver(function (L) { L.forEach(function (m) { if (m.type === 'characterData') nd(m.target); else m.addedNodes.forEach(nd); }); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
