---
noindex: true
sitemap: false
layout: single
title: "Carrello"
permalink: /shop/carrello/
classes: wide
author_profile: false
---

<style>
*{box-sizing:border-box}
.cart-wrap{max-width:900px;margin:0 auto}
.cart-empty{text-align:center;padding:4em 0;color:#bbb}
.cart-empty .icon{font-size:4em;margin-bottom:.5em}
.cart-empty p{font-size:1.1em}
.cart-empty a{color:#3f6b00;text-decoration:none;font-weight:600}

/* Lista prodotti */
.cart-item{display:grid;grid-template-columns:80px 1fr auto;gap:1.2em;align-items:center;padding:1.2em 0;border-bottom:1px solid #eee}
.cart-item-img{width:80px;height:80px;object-fit:cover;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2em;color:#ccc}
.cart-item-img img{width:80px;height:80px;object-fit:cover;border-radius:10px}
.cart-item-info{}
.cart-item-title{font-weight:700;font-size:15px;color:#1a1a2e;margin-bottom:.3em}
.cart-item-meta{font-size:12px;color:#999}
.cart-item-price{font-weight:700;color:#3f6b00;font-size:15px}
.cart-item-right{display:flex;flex-direction:column;align-items:flex-end;gap:.6em}
.cart-qty{display:flex;align-items:center;border:1.5px solid #ddd;border-radius:8px;overflow:hidden}
.cart-qty button{width:30px;height:32px;border:none;background:#fff;font-size:1.1em;cursor:pointer;color:#333}
.cart-qty button:hover{background:#f5f5f5}
.cart-qty input{width:38px;height:32px;border:none;border-left:1.5px solid #ddd;border-right:1.5px solid #ddd;text-align:center;font-size:13px;font-weight:700;outline:none}
.cart-remove{font-size:11px;color:#e74c3c;cursor:pointer;text-decoration:none;background:none;border:none;padding:0}
.cart-remove:hover{text-decoration:underline}

/* Riepilogo */
.cart-summary{background:#f9f9f9;border-radius:14px;padding:1.5em;margin-top:1.5em}
.cart-summary-row{display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:.7em}
.cart-summary-row.total{font-size:1.2em;font-weight:800;color:#1a1a2e;border-top:2px solid #eee;padding-top:.7em;margin-top:.3em}
.cart-coupon{display:flex;gap:.6em;margin:1em 0}
.cart-coupon input{flex:1;padding:9px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;outline:none}
.cart-coupon input:focus{border-color:#95d600}
.cart-coupon button{padding:9px 16px;background:#f0f0f0;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;color:#555}
.cart-coupon button:hover{background:#e8e8e8}
.btn-checkout{width:100%;padding:14px;background:#95d600;color:#15191d;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:1em;transition:background .2s;letter-spacing:.3px}
.btn-checkout:hover{background:#a9e81c}
.btn-continue{display:block;text-align:center;margin-top:.8em;font-size:13px;color:#3f6b00;text-decoration:none}

/* Checkout form */
.checkout-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9998;padding:1em}
.checkout-box{background:#fff;border-radius:16px;padding:2em;max-width:440px;width:100%;max-height:90vh;overflow-y:auto}
.checkout-box h3{font-size:1.2em;font-weight:800;margin:0 0 .3em;color:#1a1a2e}
.checkout-box .sub{font-size:13px;color:#888;margin-bottom:1.2em}
.checkout-field{margin-bottom:1em}
.checkout-field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:.4em;text-transform:uppercase;letter-spacing:.3px}
.checkout-field input{width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none}
.checkout-field input:focus{border-color:#95d600}
.checkout-field .err{font-size:11px;color:#e74c3c;margin-top:.3em;display:none}
.checkout-note{font-size:12px;color:#888;background:#f5f5f8;border-radius:8px;padding:.7em 1em;margin-bottom:1.2em}
.checkout-actions{display:flex;gap:.7em;margin-top:1.3em}
.checkout-actions button{flex:1;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}
.checkout-actions .btn-annulla{background:#f0f0f0;color:#555}
.checkout-actions .btn-conferma{background:#95d600;color:#15191d}
.checkout-actions .btn-conferma:hover{background:#a9e81c}

/* Badge carrello nel menu */
.cart-badge-count{background:#e74c3c;color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;margin-left:3px;vertical-align:middle}

/* Toast */
.sp-toast{position:fixed;bottom:2em;left:50%;transform:translateX(-50%) translateY(60px);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;opacity:0;transition:all .3s;z-index:9999;pointer-events:none}
.sp-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

@media(max-width:600px){
  .cart-item{grid-template-columns:60px 1fr;gap:.8em}
  .cart-item-right{flex-direction:row;align-items:center;grid-column:1/-1}
}
</style>

<div class="cart-wrap">
  <div id="cart-container">
    <p style="color:#aaa;text-align:center;padding:2em">Caricamento carrello...</p>
  </div>
</div>

<div id="sp-toast" class="sp-toast"></div>

<script>
const BASE = window.location.origin + (window.SITE_BASE || '');
const CART_KEY = (window.SITE_BASE || 'default') + '_cart';

function getCart() {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; }
}
function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s,i) => s + (i.qty||1), 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total > 0 ? `🛒 Carrello (${total})` : '🛒 Carrello';
  });
}
function showToast(msg) {
  const t = document.getElementById('sp-toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-container');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="icon">🛒</div>
        <p>Il tuo carrello è vuoto.</p>
        <a href="${BASE}/shop/">→ Vai allo Shop</a>
      </div>`;
    return;
  }

  const subtotal = cart.reduce((s,i) => s + (parseFloat(i.price)||0) * (i.qty||1), 0);
  const shipping = subtotal >= 35 ? 0 : 4.90;
  const total = subtotal + shipping;

  const itemsHtml = cart.map((item, idx) => `
    <div class="cart-item" id="cart-item-${idx}">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '📦'}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-meta">
          ${item.color ? `Colore: ${item.color}` : ''}
          ${item.size  ? ` &nbsp;|&nbsp; Taglia: ${item.size}` : ''}
          ${item.sku   ? ` &nbsp;|&nbsp; SKU: ${item.sku}` : ''}
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">€ ${(parseFloat(item.price) * (item.qty||1)).toFixed(2)}</div>
        <div class="cart-qty">
          <button onclick="changeItemQty(${idx}, -1)">−</button>
          <input type="number" value="${item.qty||1}" min="1" onchange="setItemQty(${idx}, this.value)">
          <button onclick="changeItemQty(${idx}, 1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeItem(${idx})">✕ Rimuovi</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <h2 style="font-size:1.3em;font-weight:800;margin-bottom:1.2em">Il tuo carrello <span style="font-size:.7em;font-weight:400;color:#999">(${cart.length} articol${cart.length===1?'o':'i'})</span></h2>
    ${itemsHtml}

    <div class="cart-summary">
      <div class="cart-coupon">
        <input type="text" id="coupon-input" placeholder="Codice sconto (prova: DENTE10)">
        <button onclick="applyCoupon()">Applica</button>
      </div>
      <div id="coupon-msg" style="font-size:12px;margin-bottom:.5em;min-height:16px"></div>
      <div class="cart-summary-row"><span>Subtotale</span><span>€ ${subtotal.toFixed(2)}</span></div>
      <div class="cart-summary-row"><span>Spedizione</span><span>${shipping === 0 ? '<span style="color:#27ae60">Gratuita 🎉</span>' : '€ ' + shipping.toFixed(2)}</span></div>
      <div id="discount-row" style="display:none" class="cart-summary-row"><span>Sconto</span><span id="discount-val" style="color:#27ae60"></span></div>
      <div class="cart-summary-row total"><span>Totale</span><span id="total-val">€ ${total.toFixed(2)}</span></div>
      ${shipping > 0 ? `<div style="font-size:11px;color:#e67e22;text-align:center;margin-top:.5em">Aggiungi € ${(35-subtotal).toFixed(2)} per la spedizione gratuita 🚚</div>` : ''}
      <button class="btn-checkout" onclick="checkout()">💳 Procedi al checkout</button>
      <a href="${BASE}/shop/" class="btn-continue">← Continua lo shopping</a>
    </div>
  `;
}

function changeItemQty(idx, delta) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, (cart[idx].qty||1) + delta);
  saveCart(cart); renderCart();
}
function setItemQty(idx, val) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, parseInt(val)||1);
  saveCart(cart); renderCart();
}
function removeItem(idx) {
  const cart = getCart();
  const name = cart[idx].title;
  cart.splice(idx, 1);
  saveCart(cart); renderCart();
  showToast(`🗑️ "${name}" rimosso dal carrello`);
}
function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  const msg = document.getElementById('coupon-msg');
  const discRow = document.getElementById('discount-row');
  const discVal = document.getElementById('discount-val');
  const totalEl = document.getElementById('total-val');
  const cart = getCart();
  const subtotal = cart.reduce((s,i) => s + (parseFloat(i.price)||0) * (i.qty||1), 0);
  const shipping = subtotal >= 35 ? 0 : 4.90;

  if (code === 'DENTE10') {
    const disc = subtotal * 0.10;
    msg.innerHTML = '<span style="color:#27ae60">✅ Codice applicato! Sconto 10%</span>';
    discRow.style.display = 'flex';
    discVal.textContent = '- € ' + disc.toFixed(2);
    totalEl.textContent = '€ ' + (subtotal + shipping - disc).toFixed(2);
  } else {
    msg.innerHTML = '<span style="color:#e74c3c">❌ Codice non valido</span>';
    discRow.style.display = 'none';
  }
}
// Un carrello richiede l'indirizzo fisico se contiene ALMENO UN prodotto fisico.
// Se sono tutti digitali, basta l'email. Se e' misto, vince il fisico (serve anche l'indirizzo).
function carrelloRichiedeIndirizzo() {
  const cart = getCart();
  return cart.some(i => (i.tipo || 'fisico') !== 'digitale');
}

function checkout() {
  const richiedeIndirizzo = carrelloRichiedeIndirizzo();
  const overlay = document.createElement('div');
  overlay.className = 'checkout-overlay';
  overlay.id = 'checkout-overlay';
  overlay.innerHTML = `
    <div class="checkout-box">
      <h3>💳 Completa l'ordine</h3>
      <div class="sub">${richiedeIndirizzo ? 'Ordine con prodotti fisici — serve un indirizzo di spedizione.' : 'Solo prodotti digitali — riceverai tutto via email.'}</div>

      ${!richiedeIndirizzo ? `<div class="checkout-note">📩 Prodotto digitale: nessuna spedizione, riceverai il materiale all'indirizzo email indicato.</div>` : ''}

      <div class="checkout-field">
        <label>Email</label>
        <input type="email" id="ck-email" placeholder="nome@esempio.it">
        <div class="err" id="ck-email-err">Inserisci un'email valida.</div>
      </div>

      ${richiedeIndirizzo ? `
      <div class="checkout-field">
        <label>Nome e cognome</label>
        <input type="text" id="ck-nome" placeholder="Mario Rossi">
        <div class="err" id="ck-nome-err">Campo obbligatorio.</div>
      </div>
      <div class="checkout-field">
        <label>Indirizzo di spedizione</label>
        <input type="text" id="ck-indirizzo" placeholder="Via Roma 1, 00100 Roma (RM)">
        <div class="err" id="ck-indirizzo-err">Inserisci l'indirizzo completo per il corriere.</div>
      </div>
      ` : ''}

      <div class="checkout-actions">
        <button class="btn-annulla" onclick="chiudiCheckout()">Annulla</button>
        <button class="btn-conferma" onclick="confermaCheckout(${richiedeIndirizzo})">Conferma ordine</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function chiudiCheckout() {
  const overlay = document.getElementById('checkout-overlay');
  if (overlay) overlay.remove();
}

function confermaCheckout(richiedeIndirizzo) {
  const email = document.getElementById('ck-email').value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  document.getElementById('ck-email-err').style.display = emailOk ? 'none' : 'block';

  let ok = emailOk;

  if (richiedeIndirizzo) {
    const nome = document.getElementById('ck-nome').value.trim();
    const indirizzo = document.getElementById('ck-indirizzo').value.trim();
    const nomeOk = nome.length > 0;
    const indirizzoOk = indirizzo.length > 5;
    document.getElementById('ck-nome-err').style.display = nomeOk ? 'none' : 'block';
    document.getElementById('ck-indirizzo-err').style.display = indirizzoOk ? 'none' : 'block';
    ok = ok && nomeOk && indirizzoOk;
  }

  if (!ok) return;

  chiudiCheckout();
  showToast(richiedeIndirizzo
    ? '🎉 Ordine confermato! Spedizione in preparazione — integra qui il tuo gateway di pagamento.'
    : '🎉 Ordine confermato! Materiale digitale in arrivo via email — integra qui il tuo gateway di pagamento.');
}

// Aggiungi prodotto al carrello (chiamato dalla pagina prodotto)
window.addToCartGlobal = function(item) {
  const cart = getCart();
  const itemKey = item.slug || item.title;
  const existing = cart.find(i => (i.slug || i.title) === itemKey && i.color === item.color && i.size === item.size);
  if (existing) { existing.qty = (existing.qty||1) + (item.qty||1); }
  else { cart.push({ ...item, qty: item.qty||1 }); }
  saveCart(cart);
};

renderCart();
updateCartBadge();
</script>
