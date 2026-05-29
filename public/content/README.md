# Your document lives here

Everything in `public/content/` is gated — only approved viewers can reach
it. Replace the sample and point `siteConfig.ts` at it.

- **HTML** (`content.type: "html"`): drop a static export here with an
  `index.html` (or set `htmlEntry`). `/deck` redirects to it.
- **PDF** (`content.type: "pdf"`): put e.g. `deck.pdf` here and set `pdfFile`.
  `/deck` embeds it in a viewer.
- **Images** (`content.type: "images"`): drop ordered images (e.g.
  `01.png`, `02.png`); `/deck` shows a slideshow. List them in
  `content.images` to fix the order, or leave it empty to use every image
  sorted by name.

> Converting a PowerPoint? Export it to PDF (or to images) and use that —
> browsers can't render `.pptx` natively.
