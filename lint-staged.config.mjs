// Symlinks (CLAUDE.md → AGENTS.md) are filtered out of the Prettier list:
// Prettier errors when an explicitly-named path is a symbolic link, and
// lint-staged passes staged paths explicitly.
const notSymlink = (file) => !file.endsWith("CLAUDE.md");
const quote = (files) => files.map((f) => JSON.stringify(f)).join(" ");

export default {
  "*.{ts,tsx}": ["eslint --max-warnings=0 --no-warn-ignored", "prettier --write"],
  "*.{js,mjs,json,css,md}": (files) => {
    const real = files.filter(notSymlink);
    return real.length ? [`prettier --write ${quote(real)}`] : [];
  },
};
