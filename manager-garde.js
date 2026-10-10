// 🧑‍💼 GARDE DU LIEN MANAGER : le lien envoyé par LINE (manager.html?k=…) peut être retiré par le patron.
// · le téléphone du patron (a ouvert patron.html) passe toujours
// · le téléphone du manager garde sa clé ; si le patron la retire → « ⛔ Accès retiré » sur la fiche et ses pages
(function () {
  var API = 'https://pointage-staff.web.app/api';
  function g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  var kUrl = new URLSearchParams(location.search).get('k');
  if (kUrl) { s('pointage_mgr', kUrl); s('pointage_mgr_ko', null); try { history.replaceState(null, '', location.pathname); } catch (e) {} }   // la clé ne reste pas dans la barre d'adresse
  var k = g('pointage_mgr'), estFiche = /manager\.html$/.test(location.pathname), patron = g('pointage_patron') === '1';
  function bloquer(msg) {
    var css = 'position:fixed;inset:0;z-index:99999;background:#f3f4f6;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif';
    var html = '<div style="max-width:380px"><div style="font-size:3rem">⛔</div><div style="font-size:1.25rem;font-weight:800;margin:8px 0">' + msg[0] + '</div><div style="font-size:1.05rem;font-weight:700;color:#374151">' + msg[1] + '</div></div>';
    function poser() { var d = document.getElementById('mgrBloc'); if (!d) { d = document.createElement('div'); d.id = 'mgrBloc'; document.body.appendChild(d); } d.style.cssText = css; d.innerHTML = html; document.body.style.overflow = 'hidden'; }
    if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);
  }
  var RETIRE = ['ยกเลิกสิทธิ์การเข้าถึงแล้ว', 'ติดต่อเจ้าของร้าน'];
  if (patron && !kUrl) return;                    // 👑 téléphone du patron
  if (!k) { if (estFiche) bloquer(['ลิงก์ไม่ถูกต้อง', 'ขอลิงก์ใหม่จากเจ้าของร้าน']); return; }
  if (g('pointage_mgr_ko') === k) bloquer(RETIRE);   // déjà retiré (même sans internet)
  function verifier() {
    fetch(API + '?mgr=' + encodeURIComponent(k) + '&_=' + Date.now()).then(function (r) { return r.text(); }).then(function (t) {
      var j = null; try { j = JSON.parse(t.trim()); } catch (e) { return; }
      if (j && j.ok === false) { s('pointage_mgr_ko', k); bloquer(RETIRE); }
      else if (j && j.ok) { s('pointage_mgr_ko', null); var d = document.getElementById('mgrBloc'); if (d) { d.remove(); document.body.style.overflow = ''; } if (j.nom) { var n = document.getElementById('mgrNom'); if (n) n.textContent = '👋 ' + j.nom; } }
    }).catch(function () {});
  }
  verifier();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) verifier(); });
})();
