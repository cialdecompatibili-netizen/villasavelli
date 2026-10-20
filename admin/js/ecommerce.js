// E-COMMERCE (admin): prodotti e categorie del negozio. Porting da ecommercealfolio1 (admin/admin-ecommerce.js), adattato a questo admin (index.html + core.js).
// Usa le funzioni globali di index.html/core.js: tok, ghGet, ghPut, ghDelete, enc, dec, showMsg, startDeployPolling, REPO. Stesso schema di collezioni.js.
// PUNTI CRITICI
// 1) FONTE UNICA = _data/catalogo.json ({_nota, categorie:[{id,nome,icona}], prodotti:[{id,nome,descrizione,descrizione_completa,categoria,icona,tipo,prezzo_centesimi,immagine,visibile}]}).
//    La leggono /negozio/, le schede prodotto, il carrello nel menu (masthead) e questa vista: i nomi dei campi NON si cambiano senza cambiare tutti.
// 2) Il sito e' sul build classico di GitHub Pages (niente plugin Ruby): la scheda di ogni prodotto e di ogni categoria e' un piccolo file in _negozio/ (front matter + id).
//    Questo file li crea/aggiorna/toglie da solo dopo ogni salvataggio (sync). Il pulsante "Rigenera pagine" rifa' tutto da zero se qualcosa si disallinea (es. catalogo modificato a mano).
// 3) L'id di prodotto/categoria e' l'URL (/negozio/<id>/) e la chiave del carrello: dopo la creazione NON si cambia. Solo a-z 0-9 e '-'. L'id 'categoria' e' riservato.
// 4) prezzo_centesimi = euro x 100 INTERO. Qui si scrive in euro (virgola o punto) e si converte con toCents.
// 5) Interruttore: chiave `ecommerce` di _config.yml (solo true accende). Sta in Impostazioni; spento = il gruppo E-commerce sparisce da questo menu e dal sito. I dati restano.
// 6) Si rilegge SEMPRE il file prima di scrivere (sha fresco): se un'altra scheda ha salvato nel frattempo GitHub risponde 409 e si vede il messaggio.
(function () {
  var PATH = '_data/catalogo.json', DIR = '_negozio', ID_RE = /^[a-z0-9-]+$/, fcat = '', cur = null;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var jq = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); };
  var slug = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); };
  var euro = function (c) { return (Math.round(+c || 0) / 100).toFixed(2).replace('.', ','); };
  var toCents = function (s) { var n = parseFloat(String(s).trim().replace(',', '.')); if (!isFinite(n) || n <= 0 || n > 10000) return 0; return Math.round(n * 100); };
  var byId = function (a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
  var msgOf = function (e) { return (e && e.message) || String(e); };

  async function load() {
    var r = await ghGet(PATH), d = {}, sha = null;
    if (r.ok) {
      var j = await r.json(); sha = j.sha;
      try { d = JSON.parse(dec(j.content).replace(/^\uFEFF/, '')); } catch (e) { throw new Error('Il catalogo non si legge (_data/catalogo.json rovinato): controllalo su GitHub'); }
    } else if (r.status !== 404) throw new Error('GitHub ha risposto ' + r.status);
    if (!d || typeof d !== 'object') d = {};
    if (!Array.isArray(d.categorie)) d.categorie = [];
    if (!Array.isArray(d.prodotti)) d.prodotti = [];
    return { sha: sha, d: d };
  }
  function ser(d) {
    var line = function (x) { return '  ' + JSON.stringify(x); };
    return '{\n "_nota": ' + JSON.stringify(d._nota || '') + ',\n "categorie": [\n' + d.categorie.map(line).join(',\n') + '\n ],\n "prodotti": [\n' + d.prodotti.map(line).join(',\n') + '\n ]\n}\n';
  }
  async function save(c, msg, touch) {
    var r = await ghPut(PATH, msg, ser(c.d), c.sha);
    if (!r.ok) { var j = {}; try { j = await r.json(); } catch (e) {} throw new Error(r.status === 409 || r.status === 422 ? 'Il catalogo e\u0027 cambiato nel frattempo: ricarica la pagina e riprova' : (j.message || 'salvataggio non riuscito')); }
    return sync(c.d, false, touch);
  }

  /* ---------- pagine _negozio/*.md (come _plugins/ecommerce.rb) ---------- */
  var q = function (s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; };
  function mdProd(p) { return '---\nlayout: negozio-prodotto\ntitle: ' + q(p.nome) + '\npid: ' + p.id + '\npermalink: /negozio/' + p.id + '/\ndescription: ' + q(p.descrizione || '') + '\n---\n'; }
  function mdCat(k) { return '---\nlayout: negozio-categoria\ntitle: ' + q(((k.icona || '') + ' ' + k.nome).trim()) + '\ncid: ' + k.id + '\npermalink: /negozio/categoria/' + k.id + '/\ndescription: ' + q('Prodotti della categoria ' + k.nome + '.') + '\n---\n'; }
  function desired(d) {
    var m = {}, vis = d.prodotti.filter(function (p) { return p.visibile !== false && ID_RE.test(p.id || '') && p.id !== 'categoria'; });
    vis.forEach(function (p) { m[p.id + '.md'] = mdProd(p); });
    d.categorie.forEach(function (k) {
      if (!ID_RE.test(k.id || '') || !vis.some(function (p) { return p.categoria === k.id; })) return;
      m['categoria-' + k.id + '.md'] = mdCat(k);
    });
    return m;
  }
  /* sync: crea i file mancanti, aggiorna quelli con contenuto diverso (solo se deep=true li rilegge tutti), toglie quelli senza piu' prodotto/categoria. */
  async function sync(d, deep, touch) {
    var want = desired(d), have = {}, r = await ghGet(DIR);
    if (r.ok) (await r.json()).forEach(function (f) { if (/\.md$/.test(f.name)) have[f.name] = f.sha; });
    for (var n in want) {
      var path = DIR + '/' + n, sha = have[n], txt = want[n];
      if (sha) { // gia' presente: lo rileggo solo se serve (rigenera, o file toccato da questo salvataggio) e lo riscrivo se il testo e' cambiato
        if (!deep && !(touch && touch.indexOf(n) >= 0)) continue;
        var rr = await ghGet(path); if (!rr.ok) continue; var jj = await rr.json(); sha = jj.sha;
        if (dec(jj.content).replace(/\r\n/g, '\n') === txt) continue;
      }
      var pr = await ghPut(path, 'Negozio: pagina ' + n, txt, sha); if (!pr.ok) throw new Error('Pagina ' + n + ' non scritta (' + pr.status + ')');
    }
    for (var h in have) if (!(h in want)) { var dr = await ghDelete(DIR + '/' + h, have[h], 'Negozio: tolta pagina ' + h); if (!dr.ok) throw new Error('Pagina ' + h + ' non tolta (' + dr.status + ')'); }
    startDeployPolling();
  }

  /* ---------- interruttore (Impostazioni) ---------- */
  async function leggiStato() {
    var r = await ghGet('_config.yml'); if (!r.ok) return null;
    var j = await r.json(), m = dec(j.content).match(/^ecommerce:[ \t]*(\S+)/m);
    return { on: !!m && m[1].toLowerCase() === 'true', sha: j.sha, text: dec(j.content) };
  }
  function mostraGruppo(on) { document.querySelectorAll('.ec-nav').forEach(function (e) { e.style.display = on ? '' : 'none'; }); }
  window.ecToggle = async function () {
    var msg = 'ec-set-msg', val = $('ec-switch').checked ? 'true' : 'false';
    if (!tok()) return showMsg(msg, '\u26a0\ufe0f Token mancante.', 'err');
    try {
      var s = await leggiStato(); if (!s) throw new Error('_config.yml non si legge');
      var t = s.text;
      if (/^ecommerce:/m.test(t)) t = t.replace(/^(ecommerce:[ \t]*)\S+/m, function (_x, a) { return a + val; });
      else { var eo = /\r\n/.test(t) ? '\r\n' : '\n'; t = t + (/\n$/.test(t) ? '' : eo) + 'ecommerce: ' + val + eo; }
      if (t === s.text) return showMsg(msg, 'Nessuna modifica.', 'ok');
      var r = await ghPut('_config.yml', 'admin: e-commerce ' + (val === 'true' ? 'acceso' : 'spento'), t, s.sha);
      if (!r.ok) throw new Error((await r.json()).message || 'salvataggio non riuscito');
      mostraGruppo(val === 'true'); showMsg(msg, '\u2705 Salvato. Il sito si aggiorna in 2-3 minuti.', 'ok'); startDeployPolling();
    } catch (e) { showMsg(msg, '\u274c ' + msgOf(e), 'err'); }
  };

  /* ---------- struttura admin ---------- */
  function build() {
    return '<div class="page" id="page-ec-prodotti"><div class="page-title">\ud83d\uded2 Prodotti negozio</div><div id="ec-p-avviso"></div>' +
      '<div id="ec-p-lista-view"><div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="ecEdit(\'\')">\u271a Nuovo prodotto</button>' +
      '<button class="btn btn-secondary" onclick="ecRigenera()" title="Ricrea le pagine /negozio/... da catalogo.json">\u21bb Rigenera pagine</button></div>' +
      '<div class="card"><div class="card-title" style="display:flex;justify-content:space-between;gap:8px">Prodotti <select id="ec-f" onchange="ecFilt(this.value)" style="width:auto"></select></div><div id="ec-p-lista"><em style="color:#bbb;font-size:13px">Caricamento...</em></div></div>' +
      '<div class="msg" id="ec-p-msg"></div></div>' +
      '<div id="ec-p-ed" style="display:none"></div></div>' +
      '<div class="page" id="page-ec-categorie"><div class="page-title">\ud83d\udce6 Categorie negozio</div>' +
      '<div id="ec-c-lista-view"><div style="margin-bottom:16px"><button class="btn btn-primary" onclick="ecCatEdit(\'\')">\u271a Nuova categoria</button></div>' +
      '<div class="card"><div class="card-title">Categorie</div><div id="ec-c-lista"><em style="color:#bbb;font-size:13px">Caricamento...</em></div></div><div class="msg" id="ec-c-msg"></div></div>' +
      '<div id="ec-c-ed" style="display:none"></div></div>';
  }
  function init() {
    var main = document.querySelector('main.main'); if (!main) return;
    main.insertAdjacentHTML('beforeend', build());
    var sis = [].slice.call(document.querySelectorAll('.nav-label')).filter(function (e) { return e.textContent.trim() === 'Sistema'; })[0];
    var nav = '<div class="nav-label ec-nav">E-commerce</div>' +
      '<button class="nav-item ec-nav" onclick="ecShow(\'ec-prodotti\',this)"><span class="icon">\ud83d\uded2</span>Prodotti negozio</button>' +
      '<button class="nav-item ec-nav" onclick="ecShow(\'ec-categorie\',this)"><span class="icon">\ud83d\udce6</span>Categorie negozio</button>';
    if (sis) sis.insertAdjacentHTML('beforebegin', nav); else document.querySelector('.sidebar').insertAdjacentHTML('beforeend', nav);
    var imp = $('page-impostazioni');
    if (imp) imp.insertAdjacentHTML('beforeend', '<div class="card"><div class="card-title">\ud83d\uded2 E-commerce</div>' +
      '<div class="field"><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="ec-switch" style="width:auto"> Abilita e-commerce</label>' +
      '<span class="hint" style="display:block">Acceso = il Negozio compare nel menu del sito, con carrello e pagine prodotto. Spento = Negozio, carrello e schede spariscono dal sito e il gruppo E-commerce da questo menu (prodotti e categorie restano salvati: riaccendendo ritrovi tutto). Dopo Salva il sito si aggiorna in 2-3 minuti.</span></div>' +
      '<div class="btn-group"><button class="btn btn-primary" onclick="ecToggle()">\ud83d\udcbe Salva e-commerce</button></div><div class="msg" id="ec-set-msg"></div></div>');
    if (tok()) leggiStato().then(function (s) { if (s) { mostraGruppo(s.on); var c = $('ec-switch'); if (c) c.checked = s.on; } }).catch(function () {});
  }
  window.ecShow = function (k, btn) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
    $('page-' + k).classList.add('active'); btn.classList.add('active');
    if (k === 'ec-prodotti') { $('ec-p-ed').style.display = 'none'; $('ec-p-lista-view').style.display = 'block'; ecListaP(); } else { $('ec-c-ed').style.display = 'none'; $('ec-c-lista-view').style.display = 'block'; ecListaC(); }
  };
  function fail(id, e) { showMsg(id, '\u274c ' + msgOf(e), 'err'); }
  function banner() { return leggiStato().then(function (s) { return s && s.on ? '' : '<div class="card" style="border-color:#dba617;background:#fcf9e8"><b>E-commerce spento.</b> Il Negozio non si vede sul sito. Qui puoi preparare prodotti e categorie; per accenderlo vai in Impostazioni e spunta \u201cAbilita e-commerce\u201d.</div>'; }, function () { return ''; }); }

  /* ---------- PRODOTTI ---------- */
  window.ecFilt = function (v) { fcat = v; ecListaP(); };
  window.ecListaP = async function () {
    if (!tok()) { $('ec-p-lista').innerHTML = '<em style="color:#bbb;font-size:13px">Token mancante.</em>'; return; }
    try {
      var c = (await load()).d; $('ec-p-avviso').innerHTML = await banner();
      $('ec-f').innerHTML = '<option value="">Tutte le categorie</option>' + c.categorie.map(function (k) { return '<option value="' + esc(k.id) + '"' + (fcat === k.id ? ' selected' : '') + '>' + esc((k.icona || '') + ' ' + k.nome) + '</option>'; }).join('') + '<option value="-"' + (fcat === '-' ? ' selected' : '') + '>Senza categoria</option>';
      var h = '', n = 0;
      c.prodotti.forEach(function (p) {
        var k = byId(c.categorie, p.categoria);
        if (fcat === '-' ? k : (fcat && p.categoria !== fcat)) return;
        n++; var hid = p.visibile === false;
        h += '<div class="list-row"><span style="font-size:13px">' + esc(p.icona || '') + ' <b' + (hid ? ' style="opacity:.55"' : '') + '>' + esc(p.nome) + '</b> <small style="color:#888">' + esc(k ? k.nome : 'senza categoria') + ' \u00b7 ' + (p.tipo === 'digitale' ? 'digitale' : 'fisico') + ' \u00b7 ' + euro(p.prezzo_centesimi) + ' \u20ac' + (hid ? ' \u00b7 nascosto' : '') + '</small></span>' +
          '<div style="display:flex;gap:8px"><button class="btn btn-secondary btn-sm" onclick="ecVis(\'' + jq(p.id) + '\')">' + (hid ? 'Mostra' : 'Nascondi') + '</button><button class="btn btn-secondary btn-sm" onclick="ecEdit(\'' + jq(p.id) + '\')">\u270f\ufe0f Modifica</button><button class="btn btn-danger btn-sm" onclick="ecDel(\'' + jq(p.id) + '\')">\ud83d\uddd1</button></div></div>';
      });
      $('ec-p-lista').innerHTML = h || '<em style="color:#bbb;font-size:13px">Nessun prodotto' + (fcat ? ' in questa categoria' : '') + '. Premi \u201cNuovo prodotto\u201d.</em>';
    } catch (e) { fail('ec-p-msg', e); }
  };
  window.ecVis = async function (id) {
    try { var c = await load(), p = byId(c.d.prodotti, id); if (!p) throw new Error('Prodotto non trovato: ricarica'); p.visibile = (p.visibile === false); await save(c, 'admin: e-commerce ' + (p.visibile ? 'mostra ' : 'nascondi ') + id); ecListaP(); showMsg('ec-p-msg', '\u2705 Fatto. Il sito si aggiorna in 2-3 minuti.', 'ok'); } catch (e) { fail('ec-p-msg', e); }
  };
  window.ecDel = async function (id) {
    try {
      var c = await load(), p = byId(c.d.prodotti, id); if (!p) throw new Error('Prodotto non trovato: ricarica');
      if (!confirm('Eliminare \u201c' + p.nome + '\u201d? Sparisce dal negozio. Se vuoi solo toglierlo dalla vendita usa Nascondi.')) return;
      c.d.prodotti = c.d.prodotti.filter(function (x) { return x.id !== id; });
      await save(c, 'admin: e-commerce elimina ' + id); ecListaP(); showMsg('ec-p-msg', '\u2705 Eliminato.', 'ok');
    } catch (e) { fail('ec-p-msg', e); }
  };
  window.ecRigenera = async function () {
    showMsg('ec-p-msg', '\u23f3 Rigenero le pagine...', '');
    try { await sync((await load()).d, true); showMsg('ec-p-msg', '\u2705 Pagine del negozio allineate al catalogo.', 'ok'); } catch (e) { fail('ec-p-msg', e); }
  };
  window.ecEdit = async function (id) {
    try {
      var c = await load(), p = id ? byId(c.d.prodotti, id) : null; if (id && !p) throw new Error('Prodotto non trovato: ricarica');
      p = p || { tipo: 'fisico', visibile: true, icona: '\ud83d\udce6' }; cur = id || '';
      var opt = function (arr, sel) { return arr.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === sel ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); };
      var cats = [['', 'Nessuna categoria']].concat(c.d.categorie.map(function (k) { return [k.id, (k.icona || '') + ' ' + k.nome]; }));
      $('ec-p-lista-view').style.display = 'none'; $('ec-p-ed').style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' });
      $('ec-p-ed').innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-secondary" onclick="ecShow(\'ec-prodotti\',document.querySelector(\'.nav-item.ec-nav\'))">\u2190 Torna ai prodotti</button></div><div class="card"><div class="card-title">' + (id ? 'Modifica prodotto' : 'Nuovo prodotto') + '</div>' +
        '<div class="field"><label>Nome *</label><input type="text" id="ec-nome" value="' + esc(p.nome || '') + '" placeholder="Es. Kit pulizia grondaie"></div>' +
        '<div class="field"><label>Indirizzo (URL: /negozio/<i>indirizzo</i>/)</label><input type="text" id="ec-id" value="' + esc(p.id || '') + '"' + (id ? ' readonly style="background:#f0f0f1"' : ' placeholder="vuoto = lo ricavo dal nome"') + '><span class="hint" style="display:block">' + (id ? 'Non si cambia dopo la creazione: \u00e8 la chiave del carrello e degli ordini.' : 'Solo lettere minuscole, numeri e trattini. Dopo il salvataggio non si cambia pi\u00f9.') + '</span></div>' +
        '<div class="field"><label>Descrizione breve</label><textarea class="sm" id="ec-desc" style="min-height:70px">' + esc(p.descrizione || '') + '</textarea></div>' +
        '<div class="field"><label>Descrizione completa (ogni a capo = riga nuova)</label><textarea class="sm" id="ec-full" style="min-height:140px">' + esc(p.descrizione_completa || '') + '</textarea></div>' +
        '<div class="field"><label>Foto (percorso o URL)</label><input type="text" id="ec-img" value="' + esc(p.immagine || '') + '" placeholder="assets/img/negozio/foto.jpg"><div style="margin-top:6px"><input type="file" accept="image/*" id="ec-file" onchange="ecUpload(this)"></div><span class="hint" style="display:block">Scegli un file per caricarlo (meglio sotto 1 MB), oppure scrivi un percorso/URL. Vuoto = si vede l\u0027icona.</span><div id="ec-img-pv"></div></div>' +
        '<div class="grid2"><div class="field"><label>Categoria</label><select id="ec-cat">' + opt(cats, p.categoria || '') + '</select></div><div class="field"><label>Icona (una emoji)</label><input type="text" id="ec-ico" value="' + esc(p.icona || '') + '" maxlength="4"></div></div>' +
        '<div class="grid2"><div class="field"><label>Tipo</label><select id="ec-tipo">' + opt([['fisico', 'Fisico (l\u0027ordine chiede l\u0027indirizzo)'], ['digitale', 'Digitale (nessun indirizzo)']], p.tipo === 'digitale' ? 'digitale' : 'fisico') + '</select></div><div class="field"><label>Prezzo in euro *</label><input type="text" id="ec-prezzo" inputmode="decimal" value="' + (p.prezzo_centesimi ? euro(p.prezzo_centesimi) : '') + '" placeholder="Es. 29,90"></div></div>' +
        '<div class="field"><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="ec-vis" style="width:auto"' + (p.visibile === false ? '' : ' checked') + '> Visibile nel negozio</label></div>' +
        '<div class="btn-group"><button class="btn btn-primary" onclick="ecSave()">\ud83d\udcbe Salva prodotto</button></div><div class="msg" id="ec-e-msg"></div></div>';
      ecPv();
    } catch (e) { fail('ec-p-msg', e); }
  };
  function ecPv() {
    var v = ($('ec-img') || {}).value || '', box = $('ec-img-pv'); if (!box) return;
    var base = location.origin + location.pathname.replace(/\/admin\/?.*$/, '/');
    box.innerHTML = v ? '<img src="' + esc(/^(https?:)?\/\//.test(v) ? v : base + v.replace(/^\//, '')) + '" style="max-width:220px;max-height:140px;border:1px solid #ddd;border-radius:6px;margin-top:6px">' : '';
  }
  window.ecUpload = function (inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    if (f.size > 3 * 1024 * 1024) return showMsg('ec-e-msg', '\u26a0\ufe0f Foto troppo pesante (oltre 3 MB): riducila prima.', 'err');
    showMsg('ec-e-msg', '\u23f3 Carico la foto...', '');
    var rd = new FileReader();
    rd.onload = async function () {
      try {
        var ext = (f.name.split('.').pop() || 'jpg').toLowerCase(), name = (slug(f.name.replace(/\.[^.]+$/, '')) || 'foto') + '-' + Date.now().toString(36) + '.' + ext, path = 'assets/img/negozio/' + name;
        var r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, { method: 'PUT', headers: { 'Authorization': 'token ' + tok(), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Negozio: foto ' + name, content: rd.result.split(',')[1] }) });
        if (!r.ok) throw new Error((await r.json()).message || 'caricamento non riuscito');
        $('ec-img').value = path; ecPv(); showMsg('ec-e-msg', '\u2705 Foto caricata (si vedr\u00e0 sul sito dopo il salvataggio e il deploy).', 'ok');
      } catch (e) { fail('ec-e-msg', e); }
    };
    rd.readAsDataURL(f);
  };
  window.ecSave = async function () {
    var nome = $('ec-nome').value.trim(), cents = toCents($('ec-prezzo').value), old = cur;
    if (!nome) return showMsg('ec-e-msg', '\u26a0\ufe0f Scrivi il nome del prodotto.', 'err');
    if (!cents) return showMsg('ec-e-msg', '\u26a0\ufe0f Prezzo non valido: scrivi un importo in euro, es. 29,90.', 'err');
    var id = old || slug($('ec-id').value.trim() || nome);
    if (!ID_RE.test(id) || id === 'categoria') return showMsg('ec-e-msg', '\u26a0\ufe0f Indirizzo non valido: solo lettere minuscole, numeri e trattini (\u201ccategoria\u201d \u00e8 riservato).', 'err');
    showMsg('ec-e-msg', '\u23f3 Salvataggio...', '');
    try {
      var c = await load(), prev = byId(c.d.prodotti, id);
      if (old && !prev) throw new Error('Prodotto non trovato: ricarica la pagina');
      if (!old && prev) throw new Error('Esiste gi\u00e0 un prodotto con questo indirizzo (' + id + '): cambialo');
      var n = { id: id, nome: nome, descrizione: $('ec-desc').value.trim(), categoria: $('ec-cat').value, icona: $('ec-ico').value.trim(), tipo: $('ec-tipo').value, prezzo_centesimi: cents };
      var full = $('ec-full').value.trim(); if (full) n.descrizione_completa = full;
      var im = $('ec-img').value.trim(); if (im) n.immagine = /^(https?:)?\/\//.test(im) ? im : im.replace(/^\//, '');
      n.visibile = $('ec-vis').checked;
      if (prev) for (var k in prev) if (!(k in n) && k !== 'descrizione_completa' && k !== 'immagine') n[k] = prev[k]; // chiavi extra scritte a mano restano
      if (prev) c.d.prodotti[c.d.prodotti.indexOf(prev)] = n; else c.d.prodotti.push(n);
      await save(c, 'admin: e-commerce ' + (prev ? 'modifica ' : 'nuovo ') + id, [id + '.md', 'categoria-' + n.categoria + '.md', 'categoria-' + (prev ? prev.categoria : '') + '.md']);
      showMsg('ec-e-msg', '\u2705 Salvato. Il sito si aggiorna in 2-3 minuti.', 'ok'); cur = id;
    } catch (e) { fail('ec-e-msg', e); }
  };

  /* ---------- CATEGORIE ---------- */
  window.ecListaC = async function () {
    if (!tok()) { $('ec-c-lista').innerHTML = '<em style="color:#bbb;font-size:13px">Token mancante.</em>'; return; }
    try {
      var c = (await load()).d, h = '';
      c.categorie.forEach(function (k, i) {
        var n = c.prodotti.filter(function (p) { return p.categoria === k.id; }).length;
        h += '<div class="list-row"><span style="font-size:13px">' + esc(k.icona || '') + ' <b>' + esc(k.nome) + '</b> <small style="color:#888">' + n + (n === 1 ? ' prodotto' : ' prodotti') + '</small></span><div style="display:flex;gap:6px">' +
          '<button class="btn btn-secondary btn-sm"' + (i ? '' : ' disabled') + ' onclick="ecCatMove(\'' + jq(k.id) + '\',-1)">\u25b2</button><button class="btn btn-secondary btn-sm"' + (i < c.categorie.length - 1 ? '' : ' disabled') + ' onclick="ecCatMove(\'' + jq(k.id) + '\',1)">\u25bc</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="ecCatEdit(\'' + jq(k.id) + '\')">\u270f\ufe0f Modifica</button><button class="btn btn-danger btn-sm" onclick="ecCatDel(\'' + jq(k.id) + '\')">\ud83d\uddd1</button></div></div>';
      });
      $('ec-c-lista').innerHTML = h || '<em style="color:#bbb;font-size:13px">Nessuna categoria. Premi \u201cNuova categoria\u201d.</em>';
    } catch (e) { fail('ec-c-msg', e); }
  };
  window.ecCatEdit = async function (id) {
    try {
      var c = await load(), k = id ? byId(c.d.categorie, id) : null; if (id && !k) throw new Error('Categoria non trovata: ricarica');
      k = k || { icona: '\ud83d\udecd\ufe0f' }; cur = id || '';
      $('ec-c-lista-view').style.display = 'none'; $('ec-c-ed').style.display = 'block';
      $('ec-c-ed').innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-secondary" onclick="ecShow(\'ec-categorie\',document.querySelectorAll(\'.nav-item.ec-nav\')[1])">\u2190 Torna alle categorie</button></div><div class="card"><div class="card-title">' + (id ? 'Modifica categoria' : 'Nuova categoria') + '</div>' +
        '<div class="field"><label>Nome *</label><input type="text" id="ek-nome" value="' + esc(k.nome || '') + '"></div><div class="field"><label>Icona (una emoji)</label><input type="text" id="ek-ico" value="' + esc(k.icona || '') + '" maxlength="4"></div>' +
        '<div class="btn-group"><button class="btn btn-primary" onclick="ecCatSave()">\ud83d\udcbe Salva categoria</button></div><div class="msg" id="ek-msg"></div></div>';
    } catch (e) { fail('ec-c-msg', e); }
  };
  window.ecCatSave = async function () {
    var nome = $('ek-nome').value.trim(), ico = $('ek-ico').value.trim(), old = cur;
    if (!nome) return showMsg('ek-msg', '\u26a0\ufe0f Scrivi il nome della categoria.', 'err');
    var id = old || slug(nome); if (!ID_RE.test(id) || id === 'categoria') return showMsg('ek-msg', '\u26a0\ufe0f Nome non valido: usa lettere o numeri (\u201ccategoria\u201d \u00e8 riservato).', 'err');
    try {
      var c = await load(), prev = byId(c.d.categorie, id);
      if (old && !prev) throw new Error('Categoria non trovata: ricarica');
      if (!old && prev) throw new Error('Esiste gi\u00e0 una categoria con questo nome');
      if (prev) { prev.nome = nome; prev.icona = ico; } else c.d.categorie.push({ id: id, nome: nome, icona: ico });
      await save(c, 'admin: e-commerce categoria ' + (prev ? 'modifica ' : 'nuova ') + id, ['categoria-' + id + '.md']); showMsg('ek-msg', '\u2705 Salvata.', 'ok'); cur = id;
    } catch (e) { fail('ek-msg', e); }
  };
  window.ecCatMove = async function (id, dir) {
    try { var c = await load(), a = c.d.categorie, i = a.indexOf(byId(a, id)), j = i + dir; if (i < 0 || j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; await save(c, 'admin: e-commerce ordine categorie'); ecListaC(); } catch (e) { fail('ec-c-msg', e); }
  };
  window.ecCatDel = async function (id) {
    try {
      var c = await load(), k = byId(c.d.categorie, id); if (!k) throw new Error('Categoria non trovata: ricarica');
      var n = c.d.prodotti.filter(function (p) { return p.categoria === id; }).length;
      if (n) return showMsg('ec-c-msg', '\u26a0\ufe0f La categoria ha ancora ' + n + (n === 1 ? ' prodotto' : ' prodotti') + ': spostali o eliminali prima.', 'err');
      if (!confirm('Eliminare la categoria \u201c' + k.nome + '\u201d?')) return;
      c.d.categorie = c.d.categorie.filter(function (x) { return x.id !== id; }); await save(c, 'admin: e-commerce elimina categoria ' + id); ecListaC();
    } catch (e) { fail('ec-c-msg', e); }
  };
  document.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'ec-img') ecPv(); });
  init();
})();
