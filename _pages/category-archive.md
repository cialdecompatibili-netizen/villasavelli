---
title: "Categorie"
layout: single
permalink: /categories/
author_profile: false
classes: wide
---

<style>
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.2em;margin-top:1.5em}
.cat-card{background:#fff;border:1.5px solid #eee;border-radius:12px;padding:1.4em 1.6em;text-decoration:none;color:inherit;transition:box-shadow .15s,border-color .15s;display:block}
.cat-card:hover{border-color:#95d600;box-shadow:0 4px 16px rgba(149,214,0,.12);text-decoration:none}
.cat-card-name{font-size:1em;font-weight:700;color:#1a1a2e;margin-bottom:.3em}
.cat-card-desc{font-size:13px;color:#888;margin-bottom:.8em;line-height:1.5}
.cat-card-count{font-size:12px;color:#3f6b00;font-weight:600}
</style>

<div class="cat-grid">
{% assign cats = site.categories | sort %}
{% for cat in cats %}
  {% assign cat_data = site.data.categorie | where: "nome", cat[0] | first %}
  <a class="cat-card" href="{{ '/categoria/?cat=' | append: cat[0] | relative_url }}">
    <div class="cat-card-name">{{ cat[0] }}</div>
    <div class="cat-card-desc">{{ cat_data.descrizione | strip_html | truncate: 80 }}</div>
    <div class="cat-card-count">{{ cat[1].size }} articoli →</div>
  </a>
{% endfor %}
</div>