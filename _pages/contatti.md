---
layout: single
title: "Contatti"
seo_title: "Contatti | Prodotti Digitali"
seo_description: "Scrivici cosa ti serve o quale prodotto cerchi: ti rispondiamo entro 24 ore, festivi esclusi."
permalink: /contatti/
---

{%- comment -%}
  Pagina Contatti. Logica copiata da edilextreme.com/contatti/ (al-folio):
  - form con 3 campi (nome, email, messaggio) + honeypot "website" (campo trappola per i bot)
  - antispam ALTCHA: nessun captcha da risolvere, il browser calcola una prova (proof-of-work SHA-256)
    chiesta al worker con ?challenge=1 e la rimanda insieme al form
  - invio via POST al Cloudflare Worker ENDPOINT, che gira la richiesta come email
  Per cambiare destinazione/worker: variabile ENDPOINT nello script qui sotto.
  Colore pulsante: var(--t-accent) del tema (admin > Tema). Se il worker rifiuta l'invio, controllare che
  accetti il dominio di questo sito (campo "sito" = location.hostname).
{%- endcomment -%}

<p class="cf-intro">Dicci quale prodotto ti serve o cosa cerchi: ti rispondiamo entro 24 ore, festivi esclusi.</p>

<style>
.cf-wrap,.cf-intro{max-width:520px;margin-left:auto;margin-right:auto}
.cf-intro{text-align:left;box-sizing:border-box;padding:0 29px;margin-bottom:1.5rem}
.cf-form{padding:28px;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:#fffdf5}
.cf-form .cf-campo{margin:0 0 1.1rem}
.cf-form label{display:block;width:100%;margin:0 0 .4rem;font-weight:600;text-align:left}
.cf-form input[type=text],.cf-form input[type=email],.cf-form textarea{display:block;width:100%;box-sizing:border-box;margin:0;padding:.75rem .9rem;font:inherit;font-size:1rem;line-height:1.4;color:inherit;background:#fff;border:1px solid rgba(0,0,0,.2);border-radius:8px}
.cf-form ::placeholder{opacity:.5}
.cf-form textarea{min-height:9rem;resize:vertical}
.cf-form input:focus,.cf-form textarea:focus{outline:2px solid var(--t-accent,#d9480f);outline-offset:1px}
.cf-form .cf-btn{display:block;width:100%;margin:1.5rem 0 0;padding:1rem 1.5rem;border:0;border-radius:999px;background:var(--t-accent,#d9480f);color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:.01em;cursor:pointer;box-shadow:0 6px 18px color-mix(in srgb,var(--t-accent,#d9480f) 38%,transparent);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
.cf-form .cf-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.cf-form .cf-btn:active{transform:translateY(0)}
.cf-form .cf-btn:focus-visible{outline:3px solid var(--t-accent,#d9480f);outline-offset:3px}
.cf-form .cf-btn:disabled{opacity:.65;cursor:progress;transform:none;box-shadow:none}
@media (prefers-reduced-motion:reduce){.cf-form .cf-btn{transition:none}.cf-form .cf-btn:hover{transform:none}}
.cf-nota{margin:.8rem 0 0;font-size:.85rem;opacity:.7;text-align:center}
/* Esito = messaggio sotto il pulsante, sparisce da solo dopo 4 secondi (vedi mostra() nello script) */
#cf-esito{display:none;margin:1rem 0 0;padding:.8rem 1rem;border-radius:10px;background:var(--t-accent,#d9480f);color:#fff;font-weight:600;text-align:center}
#cf-esito.cf-visibile{display:block}
#cf-esito.cf-errore{background:#b00020}
</style>

<div class="cf-wrap">
<form id="cf-form" class="cf-form" novalidate>
  <div class="cf-campo">
    <label for="cf-nome">Come ti chiami?</label>
    <input type="text" id="cf-nome" name="nome" maxlength="100" required autocomplete="name">
  </div>
  <div class="cf-campo">
    <label for="cf-email">La tua email</label>
    <input type="email" id="cf-email" name="email" maxlength="150" required autocomplete="email" placeholder="nome@azienda.it">
  </div>
  <div class="cf-campo">
    <label for="cf-msg">Cosa ti serve?</label>
    <textarea id="cf-msg" name="messaggio" rows="5" maxlength="3000" required placeholder="Esempio: vorrei il template per il sito del mio ristorante."></textarea>
  </div>
  <div style="position:absolute;left:-9999px;height:0;overflow:hidden" aria-hidden="true">
    <label for="cf-web">Non compilare</label>
    <input type="text" id="cf-web" name="website" tabindex="-1" autocomplete="off">
  </div>
  <button type="submit" class="cf-btn" id="cf-btn">Invia la richiesta</button>
  <p class="cf-nota">I tuoi dati servono solo per risponderti.</p>
  <p id="cf-esito" role="status" aria-live="polite"></p>
</form>
</div>

<script>
(function () {
  var form = document.getElementById('cf-form');
  var esito = document.getElementById('cf-esito');
  var btn = document.getElementById('cf-btn');
  var ENDPOINT = "https://contatti-form.evabomboniere.workers.dev";
  var t0 = Date.now();
  /* notifica in alto: "Invio in corso" resta finche' non c'e' l'esito; successo ed errori spariscono dopo 4 secondi (cambia 4000) */
  var tm = null;
  function mostra(m, ok, fisso) {
    esito.textContent = m;
    esito.className = 'cf-visibile' + (ok ? '' : ' cf-errore');
    clearTimeout(tm);
    if (!fisso) tm = setTimeout(function () { esito.className = ''; }, 4000);
  }

  /* ALTCHA: sfida firmata dal worker; il browser trova il numero n tale che SHA-256(salt+n) = challenge */
  var pre = null, preT = 0;
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  async function altcha() {
    var sep = ENDPOINT.indexOf('?') < 0 ? '?' : '&';
    var c = await (await fetch(ENDPOINT + sep + 'challenge=1')).json();
    if (!c.challenge) throw new Error('altcha');
    var enc = new TextEncoder();
    for (var n = 0; n <= c.maxnumber; n++) {
      if (hex(await crypto.subtle.digest('SHA-256', enc.encode(c.salt + n))) === c.challenge) {
        return btoa(JSON.stringify({ algorithm: c.algorithm, challenge: c.challenge, number: n, salt: c.salt, signature: c.signature }));
      }
    }
    throw new Error('altcha');
  }
  /* la prova si prepara in anticipo (al caricamento) e si rinnova dopo 8 minuti o dopo ogni invio */
  function prepara() { preT = Date.now(); pre = altcha().catch(function () { return ''; }); }
  prepara();
  function token() {
    if (!pre || Date.now() - preT > 480000) prepara();
    return pre.then(function (v) { if (v) return v; prepara(); return pre; });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!form.checkValidity()) { mostra('Compila nome, email e messaggio.', false); return; }
    btn.disabled = true; mostra('Invio in corso...', true, true);
    token().then(function (tk) {
      if (!tk) { mostra('Verifica non riuscita. Riprova.', false); btn.disabled = false; return; }
      var d = new URLSearchParams(new FormData(form));
      d.set('altcha', tk);
      d.set('t', String(t0));
      d.set('tipo', 'contatto-web');
      d.set('sito', location.hostname);
      d.set('pagina', location.pathname);
      return fetch(ENDPOINT, { method: 'POST', body: d })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.status === 'ok') { form.reset(); mostra("Ricevuto, grazie! Ti rispondiamo il prima possibile all'email che ci hai lasciato.", true); }
          else { mostra('Invio non riuscito. Riprova tra poco.', false); }
          prepara(); btn.disabled = false; t0 = Date.now();
        });
    }).catch(function () {
      mostra('Errore di rete. Riprova.', false); prepara(); btn.disabled = false;
    });
  });
})();
</script>
