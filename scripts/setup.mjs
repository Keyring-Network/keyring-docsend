#!/usr/bin/env node
// One-shot local setup: generate AUTH_SECRET, write .env.local from the
// template, and make sure the content directory exists.
import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";

const ENV_FILE = ".env.local";
const TEMPLATE = ".env.example";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (await exists(ENV_FILE)) {
    console.log(`${ENV_FILE} already exists — leaving it untouched.`);
  } else {
    const template = await readFile(TEMPLATE, "utf8");
    const secret = randomBytes(32).toString("base64");
    const filled = template.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`);
    await writeFile(ENV_FILE, filled);
    console.log(`Wrote ${ENV_FILE} with a freshly generated AUTH_SECRET.`);
  }

  await mkdir("public/content", { recursive: true });

  console.log("");
  console.log("Next steps:");
  console.log(`  1. Set ADMIN_EMAILS in ${ENV_FILE} (at least your own email).`);
  console.log("  2. Drop your document in public/content/ (or keep the sample).");
  console.log("  3. pnpm dev  →  http://localhost:3000");
  console.log("");
  console.log("No mailer configured? Magic links print to the dev console.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
