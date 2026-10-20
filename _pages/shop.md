---
noindex: true
sitemap: false
layout: single
title: "Shop"
permalink: /shop/
classes: wide
author_profile: false
---

<style>
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.5em;margin-top:1.5em}
.shop-cat-card{background:white;border:1.5px solid #eee;border-radius:12px;padding:1.5em;text-decoration:none;color:#1a1a2e;transition:all .2s;display:block}
.shop-cat-card:hover{border-color:#95d600;box-shadow:0 4px 16px rgba(149,214,0,.12);transform:translateY(-2px)}
.shop-cat-card .icon{font-size:2em;margin-bottom:.5em}
.shop-cat-card h3{font-size:1em;font-weight:700;margin:0 0 .3em}
.shop-cat-card .count{font-size:12px;color:#888}
.prod-card{background:white;border:1.5px solid #eee;border-radius:12px;padding:1.5em;text-decoration:none;color:#1a1a2e;transition:all .2s;display:block;cursor:pointer}
.prod-card:hover{border-color:#95d600;box-shadow:0 4px 16px rgba(149,214,0,.12);transform:translateY(-2px)}
.prod-card h3{font-size:1em;font-weight:700;margin:0 0 .4em}
.prod-card .price{font-size:1.1em;font-weight:700;color:#3f6b00}
</style>

<p style="color:#666;font-size:14px">Sfoglia i prodotti per categoria</p>

<div class="shop-grid" id="cats-grid">
  {% assign cats = site.data["shop-categorie"] %}
  {% if cats.size == 0 %}
    <p style="color:#bbb">Nessuna categoria ancora.</p>
  {% else %}
    {% for cat in cats %}
      {% assign count = site.products | where: "category", cat.slug | size %}
      <a class="shop-cat-card" href="{{ '/shop/categoria/' | append: cat.slug | append: '/' | relative_url }}">
        <div class="icon">📦</div><h3>{{ cat.nome }}</h3><div class="count">{{ count }} prodott{% if count == 1 %}o{% else %}i{% endif %}</div>
      </a>
    {% endfor %}
  {% endif %}
</div>

<hr style="margin:2.5em 0">
<h2 style="font-size:1.1em;font-weight:700;margin-bottom:1em">Tutti i prodotti</h2>

<div class="shop-grid" id="prods-grid">
  {% if site.products.size == 0 %}
    <p style="color:#bbb">Nessun prodotto ancora.</p>
  {% else %}
    {% for p in site.products %}
    <a class="prod-card" href="{{ p.url | relative_url }}">
      {% if p.image %}<img src="{{ p.image }}" alt="{{ p.title }}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:.8em">{% endif %}
      <h3>{{ p.title }}</h3>
      <div class="price">€ {{ p.price | default: "—" }}</div>
      <div style="font-size:12px;color:#888;margin-top:.3em">{{ p.category }}</div>
    </a>
    {% endfor %}
  {% endif %}
</div>
