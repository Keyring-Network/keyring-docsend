/**
 * User-editable, non-secret configuration. This is the one file you edit to
 * brand and point your instance at your document. Secrets (OAuth
 * credentials, SMTP passwords, the admin email list) live in environment
 * variables — never here. See .env.example.
 */
export const siteConfig = {
  /** Shown in the page title, sign-in card, and outbound emails. */
  siteName: "keyring-docsend",

  /** One-line description under the sign-in heading. */
  tagline: "This document is private. Sign in to continue.",

  /**
   * Optional secondary contact for visitors who aren't approved yet, shown
   * alongside the built-in request flow. Examples:
   *   "mailto:hello@example.com"  ·  "https://t.me/yourhandle"  ·  ""
   */
  contactUrl: "",
  contactLabel: "Contact us",

  /**
   * What you're sharing. Put your files in content/ and pick the type.
   *   "html"   → a static site / exported deck; served from the entry file
   *   "pdf"    → a single PDF, embedded in a viewer
   *   "images" → an ordered image slideshow
   */
  content: {
    type: "html" as "html" | "pdf" | "images",
    /** type "html": entry file under content/ */
    htmlEntry: "index.html",
    /** type "pdf": file under content/ */
    pdfFile: "deck.pdf",
    /** type "images": ordered filenames under content/ (empty = all, sorted) */
    images: [] as string[],
  },
} as const;

export type SiteConfig = typeof siteConfig;
