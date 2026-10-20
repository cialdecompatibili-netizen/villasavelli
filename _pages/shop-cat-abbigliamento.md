---
noindex: true
sitemap: false
layout: single
title: "Categoria"
permalink: /shop/categoria/abbigliamento/
classes: wide
author_profile: false
shop_category: abbigliamento
shop_category_name: Abbigliamento
---

<style>
.shop-list{display:flex;flex-direction:column;gap:1em;margin-top:1.5em}
.prod-card{background:white;border:1.5px solid #eee;border-radius:12px;padding:1.2em 1.5em;color:#1a1a2e;display:flex;gap:1.2em;align-items:center}
.prod-card:hover{border-color:#95d600;box-shadow:0 4px 16px rgba(149,214,0,.12)}
.prod-card img{width:90px;height:90px;object-fit:cover;border-radius:8px;flex-shrink:0}
.prod-card-body{flex:1;min-width:0}
.prod-card h3{font-size:1em;font-weight:700;margin:0 0 .3em}
.prod-card .desc{font-size:13px;color:#666;margin-bottom:.5em;line-height:1.5}
.prod-card .price{font-size:1.05em;font-weight:700;color:#3f6b00}
.btn-cart{background:#95d600;color:#15191d;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0}
.btn-cart:hover{background:#a9e81c}
</style>

<p style="margin-bottom:.5em"><a href="{{ '/shop/' | relative_url }}" style="color:#3f6b00;font-size:13px;text-decoration:none">← Torna allo Shop</a></p>
<p style="color:#666;font-size:14px">Prodotti nella categoria <strong>{{ page.shop_category_name }}</strong></p>

{% assign cat_products = site.products | where: "category", page.shop_category %}
<div class="shop-list" id="prods-grid">
  {% if cat_products.size == 0 %}
    <p style="color:#bbb">Nessun prodotto in questa categoria.</p>
  {% else %}
    {% for p in cat_products %}
    <div class="prod-card">
      {% if p.image %}<img src="{{ p.image }}" alt="{{ p.title }}">{% endif %}
      <div class="prod-card-body">
        <h3><a href="{{ p.url | relative_url }}" style="color:inherit;text-decoration:none">{{ p.title }}</a></h3>
        {% if p.description %}<div class="desc">{{ p.description | truncate: 120 }}</div>{% endif %}
        <div class="price">€ {{ p.price | default: "—" }}</div>
      </div>
      <button class="btn-cart" onclick="aggiungiCarrello('{{ p.path | split: '/' | last | remove: '.md' }}','{{ p.title | replace: "'", "\'" }}',{{ p.price | default: 0 }},'{{ p.image | split: "|||" | first }}','{{ p.tipo | default: "fisico" }}')">🛒 Aggiungi</button>
    </div>
    {% endfor %}
  {% endif %}
</div>

<script>
function aggiungiCarrello(slug, title, price, image, tipo) {
  const CART_KEY = (window.SITE_BASE || 'default') + '_cart';
  let cart = JSON.parse(sessionStorage.getItem(CART_KEY) || '[]');
  const idx = cart.findIndex(i => i.slug === slug);
  if (idx >= 0) cart[idx].qty++;
  else cart.push({slug, title, price, image, tipo: tipo || 'fisico', qty: 1});
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  const tot = cart.reduce((s,i) => s + i.qty, 0);
  alert(`✅ "${title}" aggiunto al carrello (tot. ${tot} articoli)`);
}

loadCat();
</script>
