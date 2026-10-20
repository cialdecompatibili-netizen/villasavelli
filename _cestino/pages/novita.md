---
layout: single
title: "Changelog"
permalink: /changelog/
author_profile: false
classes: wide
---

{% capture changelog_content %}{% include changelog.md %}{% endcapture %}
{{ changelog_content | markdownify }}
