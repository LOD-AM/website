---
title: Link Preview Examples
---

# Link Preview Examples

This page demonstrates the new link preview shortcodes.

## Basic Link Preview (Image URL only)

Get just the OpenGraph image URL for a link:

```liquid
{% linkPreview "https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745" %}
```

## Full Link Preview Card

Display a complete link preview card with image, title, and URL:

```liquid
{% linkPreviewCard "https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745" %}
```

## With Custom Title

```liquid
{% linkPreviewCard "https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745", "My Custom Title" %}
```

## Example in HTML

Here is how you can use it in your markdown:

{% linkPreviewCard "https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745", "Persee Article" %}

## Manual Usage (Like GitHub Example)

You can also use the linkPreview shortcode to get the image URL and create your own HTML:

```html
<img src="{% linkPreview 'https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745' %}" alt="Persee article" width="800" />

[View article on Persee ->](https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745)
```

This will render as:

<img src="{% linkPreview 'https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745' %}" alt="Persee article" width="800" />

[View article on Persee ->](https://www.persee.fr/doc/paleo_0153-9345_2002_num_28_2_4745)