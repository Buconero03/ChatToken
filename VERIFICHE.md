# Context Guardian 1.3.0 — Test Report

Date: 2026-10-29

## Automated checks

- 46 tests / 46 pass (`node --test tests/*.test.mjs`)
- Shared `engine.mjs`, `content.js`, `vendor/js-tiktoken-core.mjs`, `vendor/o200k_base.mjs` have identical SHA-256 hashes across all three distribution directories.
- Chromium Manifest V3 uses `background.service_worker` with ES modules.
- Firefox and Safari source manifests use `background.scripts` with ES modules.
- All three distribution ZIP archives pass `zipfile.testzip()` and have a complete, matching file inventory.
- Firefox-style `globalThis.browser` runtime messaging was exercised in Node using a browser-only mock and the real bundled tokenizer.

## Not verified

- Authenticated history retrieval in Firefox, Edge, Brave, Opera, or Safari. Requires browser-specific interactive tests and a valid user session.
- Apple Safari packaging, code signing, submission, or runtime behavior. Safari package remains a source kit.
- Chromium end-to-end browser smoke test against `chatgpt.com`: the execution environment blocks the target site with `ERR_BLOCKED_BY_ADMINISTRATOR`. This is not evidence that the extension itself is blocked in the user's browser.
- Accurate server-side active context usage: the extension counts recoverable historical text only.

## Regression protection

Browser adapters modify namespace selection and background manifest configuration only. Historical token counting uses the exact same local `o200k_base` tokenizer and counting engine. The existing 240,000-token checkpoint reminder and 250,000-token operational historical reference are unchanged.
