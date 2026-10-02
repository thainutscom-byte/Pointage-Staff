// 👑 AUTORISATIONS À DISTANCE — inclus dans toutes les pages patron.
// Les demandes des téléphones des employées apparaissent en haut de la page : ✅ Autoriser / ❌ Refuser.
// Ce téléphone patron doit être activé UNE fois avec le code d'activation (Google Sheets → onglet « 🔐 Autorisations », case B1).
(function(){
  const API='https://script.google.com/macros/s/AKfycbxyz1ElnhUFdqn4NXSAny9tyhnTh7oeQ9hicxbsUzHLsuSPEVh82sWBBqFuWWJnB4Q5/exec';
  const K='patron_aut_tok';
  const tok=()=>{ try{ return localStorage.getItem(K)||''; }catch(e){ return ''; } };
  const txt=async r=>{ let t=(await r.text()).trim(); if(t[0]==='<'){ try{ t=new DOMParser().parseFromString(t,'text/html').body.innerText.trim(); }catch(e){} } return t; };
  // 🔑 jeton patron ajouté automatiquement à tous les appels vers le script Google
  const f0=window.fetch.bind(window);
  window.fetch=function(u,o){
    try{
      const t=tok(), url=String(u&&u.url||u);
      if(t && url.indexOf(API)===0){
        if(o && o.method==='POST' && typeof o.body==='string' && o.body[0]==='{'){ const b=JSON.parse(o.body); if(!b.tok){ b.tok=t; o={...o, body:JSON.stringify(b)}; } }
        else if(!/[?&]tok=/.test(url) && (!o || !o.method || o.method==='GET')) u=url+(url.indexOf('?')>=0?'&':'?')+'tok='+encodeURIComponent(t);
      }
    }catch(e){}
    return f0(u,o);
  };
  const css=document.createElement('style');
  css.textContent='#autZone{position:fixed;left:0;right:0;top:0;z-index:100000;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 0;pointer-events:none}'
   +'#autZone .d{pointer-events:auto;max-width:460px;margin:0 auto 8px;background:#111827;color:#fff;border-radius:14px;padding:12px;box-shadow:0 6px 20px rgba(0,0,0,.35);font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
   +'#autZone .d b{font-size:1.05rem}#autZone .r{display:flex;gap:8px;margin-top:10px}#autZone .r button{flex:1;border:none;border-radius:10px;padding:12px;font-weight:800;font-size:1rem}'
   +'#autLock{position:fixed;inset:0;z-index:99998;background:#e5e7eb;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;text-align:center}'
   +'#autAlertes .a{pointer-events:auto;max-width:460px;margin:0 auto 8px;background:#fef2f2;color:#991b1b;border:2px solid #dc2626;border-radius:14px;padding:10px 12px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2)}'
   +'#autAlertes .a .r{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#autAlertes .a .r a,#autAlertes .a .r button{flex:1 1 40%;text-align:center;text-decoration:none;border:none;border-radius:9px;padding:9px;font-weight:800;font-size:.9rem}'
   +'#autAct{position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:99999;border:none;border-radius:999px;padding:10px 14px;font-weight:800;background:#7c3aed;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25);font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}';
  document.head.appendChild(css);
  const Z=document.createElement('div'); Z.id='autZone'; document.body.appendChild(Z);
  const vus=new Set();
  function heure(ms){ const d=new Date(ms); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  let serveurOK=null;
  async function serveur(){ if(serveurOK!==null) return serveurOK; try{ const t=await txt(await f0(API+'?autping=1&_='+Date.now())); serveurOK=t.indexOf('"aut":1')>=0; }catch(e){ return false; } return serveurOK; }
  async function verrou(){
    const L=document.getElementById('autLock');
    if(tok() || !(await serveur())){ if(L) L.remove(); return; }
    if(L) return;
    const d=document.createElement('div'); d.id='autLock';
    d.innerHTML='<div><div style="font-size:3rem">🔐</div><h2 style="margin:8px 0">Page patron protégée</h2><div style="color:#4b5563;line-height:1.6">Activez ce téléphone avec le code d\'activation<br>(Google Sheets → onglet « 🔐 Autorisations », case B1)</div></div>';
    document.body.appendChild(d);
  }
  function boutonActiver(){
    let b=document.getElementById('autAct'); verrou();
    if(tok()){ if(b) b.remove(); return; }
    if(b) return;
    b=document.createElement('button'); b.id='autAct'; b.textContent='🔐 Activer ce téléphone patron';
    b.onclick=async()=>{
      const c=prompt('Code d\'activation (Google Sheets → onglet « 🔐 Autorisations », case B1)'); if(!c) return;
      b.disabled=true; b.textContent='⏳ …';
      try{ const j=JSON.parse(await txt(await fetch(API,{method:'POST',body:JSON.stringify({type:'autlink',code:c.trim()})})));
        if(j.tok){ localStorage.setItem(K,j.tok); alert('✅ Téléphone patron activé : les demandes des employées s\'afficheront ici.'); b.remove(); verifier(); return; }
        alert(j.err==='stop'?'⛔ Trop d\'essais — attendez 30 minutes':'❌ Code incorrect'); }
      catch(e){ alert('⚠️ Pas de connexion — réessayez'); }
      b.disabled=false; b.textContent='🔐 Activer ce téléphone patron';
    };
    document.body.appendChild(b);
  }
  async function repondre(id, ok, el){
    el.querySelectorAll('button').forEach(x=>x.disabled=true);
    try{ const j=JSON.parse(await txt(await fetch(API,{method:'POST',body:JSON.stringify({type:'autrep',tok:tok(),id,ok})})));
      if(j.err==='tok'){ localStorage.removeItem(K); boutonActiver(); alert('🔐 Ce téléphone n\'est plus activé — entrez le nouveau code'); }
      el.innerHTML='<b>'+(ok?'✅ Autorisé':'❌ Refusé')+'</b>'; setTimeout(()=>el.remove(),2500); }
    catch(e){ el.querySelectorAll('button').forEach(x=>x.disabled=false); alert('⚠️ Pas envoyé — réessayez'); }
  }
  async function verifier(){
    boutonActiver(); if(!tok() || document.hidden) return;
    try{
      const j=JSON.parse(await txt(await fetch(API+'?autliste=1&tok='+encodeURIComponent(tok())+'&_='+Date.now())));
      if(j.err==='tok'){ localStorage.removeItem(K); boutonActiver(); return; }
      const ids=new Set((j.dem||[]).map(d=>d.id));
      [...Z.children].forEach(el=>{ if(el.dataset.id && !ids.has(el.dataset.id) && !el.dataset.rep) el.remove(); });
      (j.dem||[]).forEach(d=>{
        if(Z.querySelector('[data-id="'+d.id+'"]')) return;
        const el=document.createElement('div'); el.className='d'; el.dataset.id=d.id;
        el.innerHTML='<div>🔔 <b></b> <span style="color:#9ca3af;font-size:.85rem"></span></div><div class="t" style="margin-top:4px"></div>'
          +'<div class="r"><button style="background:#16a34a;color:#fff">✅ Autoriser</button><button style="background:#e5e7eb;color:#111827">❌ Refuser</button></div>';
        el.querySelector('b').textContent=d.nom; el.querySelector('span').textContent=(d.tel||'')+' · '+heure(d.at);
        el.querySelector('.t').textContent=d.txt;
        const [a,r]=el.querySelectorAll('button'); a.onclick=()=>{ el.dataset.rep=1; repondre(d.id,true,el); }; r.onclick=()=>{ el.dataset.rep=1; repondre(d.id,false,el); };
        Z.appendChild(el);
        if(!vus.has(d.id)){ vus.add(d.id); try{ navigator.vibrate && navigator.vibrate([200,100,200]); }catch(e){}
          try{ const A=new (window.AudioContext||window.webkitAudioContext)(), o=A.createOscillator(); o.frequency.value=880; o.connect(A.destination); o.start(); setTimeout(()=>{ o.stop(); A.close(); },250); }catch(e){} }
      });
    }catch(e){}
  }
  // 📲 contacter une employée en retard : appel, SMS pré-rempli, LINE (message copié → ouvrir son profil → chat ou appel LINE)
  let LINES={}, LINES_T=0, LINES_P=null;
  function lineIds(){ if(LINES_P && Date.now()-LINES_T<10*60000) return LINES_P; LINES_T=Date.now();
    LINES_P=(async()=>{ try{ const j=JSON.parse(await txt(await fetch(API+'?lineids=1&_='+Date.now()))); if(j && j.line) LINES=j.line; }catch(e){} return LINES; })(); return LINES_P; }
  const cleE=(nom,tel)=>String(nom||'').trim().toLowerCase().replace(/\s+/g,' ')+'|'+String(tel||'').replace(/\D/g,'');
  function msgRetard(o){ const n=new Date(); return 'สวัสดี '+o.nom+' 🙏 ตอนนี้ '+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+' น. แล้ว คุณยังไม่ได้กดเริ่มงาน (ช่วงเวลา '+o.sh+') กรุณามาที่ร้านด่วน หรือแจ้งหัวหน้าทันที'; }
  function contactBoutons(R, o, vu){
    const ios=/iPhone|iPad|iPod/.test(navigator.userAgent), m=msgRetard(o), line=LINES[cleE(o.nom,o.tel)];
    const btn=(t,bg,fg,f)=>{ const b=document.createElement('a'); b.textContent=t; b.style.cssText='background:'+bg+';color:'+fg; if(typeof f==='string') b.href=f; else { b.href='#'; b.onclick=e=>{ e.preventDefault(); f(); }; } R.appendChild(b); return b; };
    btn('📞 Appeler','#16a34a','#fff','tel:'+o.tel);
    btn('✉️ SMS','#2563eb','#fff','sms:'+o.tel+(ios?'&':'?')+'body='+encodeURIComponent(m));
    if(line) btn('💬 LINE','#06c755','#fff', async()=>{ try{ await navigator.clipboard.writeText(m); }catch(e){}
      alert('📋 Message copié.\nLINE va s\'ouvrir sur le profil de '+o.nom+' : touchez « Chat » puis collez, ou « Appel » pour l\'appeler sur LINE.'); location.href='https://line.me/R/ti/p/~'+encodeURIComponent(line); });
    else btn('💬 LINE ?','#e5e7eb','#6b7280', ()=>alert(o.nom+' n\'a pas encore donné son LINE ID.\nElle peut l\'ajouter dans son app (case « 💬 LINE ID »), ou vous pouvez l\'écrire dans l\'onglet « 💬 LINE ID » de Google Sheets.'));
    if(vu){ const b=document.createElement('button'); b.textContent='👌 Vu'; b.style.cssText='background:#e5e7eb;color:#111827'; b.onclick=vu; R.appendChild(b); }
  }
  window.autContact=contactBoutons; window.autLineIds=lineIds;
  // ⏰ ALERTE : employée pas encore arrivée 15 min après le début de son horaire
  const AZ=document.createElement('div'); AZ.id='autAlertes'; Z.appendChild(AZ);
  const cacheVu=()=>{ try{ return JSON.parse(localStorage.getItem('patron_retard_vu')||'{}'); }catch(e){ return {}; } };
  const isoJ=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  function debutMin(sh){ const m=String(sh||'').match(/^(\d{1,2})[h:](\d{2})?/); return m ? (+m[1])*60+(+(m[2]||0)) : null; }
  function finMin(sh){ const m=String(sh||'').match(/-(\d{1,2})[h:]?(\d{2})?/); if(!m) return null; let f=(+m[1])*60+(+(m[2]||0)); const d=debutMin(sh); if(d!==null && f<=d) f+=1440; return f; }
  async function retards(){
    if(!tok() || document.hidden) return;
    try{
      const now=new Date(), base=new Date(now.getTime()-6*3600e3), jour=isoJ(base); base.setHours(0,0,0,0);
      const j=JSON.parse(await txt(await fetch(API+'?boss=1&pin=x&d='+jour+'&_='+Date.now()))); if(!j.emps) return;
      await lineIds(); const vu=cacheVu(), out=[];
      Object.keys(j.hor||{}).forEach(lab=>{
        const h=j.hor[lab]; if(!h || !h.deb || jour<h.deb || jour>h.fin) return;
        const e=(j.emps||[]).find(x=>x.label===lab); if(!e || e.bloque || e.service || /^boss$/i.test(e.nom)) return;
        const d=debutMin(h.sh), f=finMin(h.sh); if(d===null) return;
        const min=(now-base)/60000; if(min<d+15 || (f!==null && min>f)) return;
        const k=jour+'|'+lab; if(vu[k]) return;
        out.push({k, nom:e.nom, tel:e.tel, sh:h.sh, retard:Math.round(min-d)});
      });
      AZ.innerHTML='';
      out.forEach(o=>{ const el=document.createElement('div'); el.className='a';
        el.innerHTML='⏰ <b></b> pas encore arrivée<br><span style="font-size:.85rem"></span><div class="r"></div>';
        el.querySelector('b').textContent=o.nom; el.querySelector('span').textContent='Horaire '+o.sh+' · retard '+o.retard+' min';
        contactBoutons(el.querySelector('.r'), o, ()=>{ const v=cacheVu(); v[o.k]=1; try{ localStorage.setItem('patron_retard_vu', JSON.stringify(v)); }catch(e){} el.remove(); });
        AZ.appendChild(el); });
    }catch(e){}
  }
  // 📍 position GPS du salon (bouton sur la page d'accueil patron)
  window.autGpsSalon=function(){
    if(!tok()){ alert('🔐 Activez d\'abord ce téléphone patron'); return; }
    if(!confirm('📍 Vous êtes AU SALON en ce moment ?\nLa position de ce téléphone devient la position du salon (rayon 200 m pour « เริ่มงาน »).')) return;
    navigator.geolocation.getCurrentPosition(async p=>{
      try{ const j=JSON.parse(await txt(await fetch(API,{method:'POST',body:JSON.stringify({type:'autgps',lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy})})));
        alert(j.ok?'✅ Position du salon enregistrée (précision '+Math.round(p.coords.accuracy)+' m)':'❌ Pas enregistré'); }catch(e){ alert('⚠️ Pas de connexion'); }
    }, err=>alert('❌ Position impossible : autorisez la localisation pour ce site'), {enableHighAccuracy:true, timeout:20000, maximumAge:0});
  };
  verifier(); setInterval(verifier, 4000);
  retards(); setInterval(retards, 120000);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) verifier(); });
})();
