# Cross-browser engineering notes

- All three builds use the same BPE token definitions and `engine.mjs`. There is no per-browser token counting divergence.
- `globalThis.browser || globalThis.chrome` uses the browser standard API in Firefox/Safari where present, with Chromium fallback.
- `background.mjs` uses synchronous `sendResponse`, which is valid in the MV3 service worker/event-page messaging style used here.
- ChatGPT's undocumented endpoints could return different response shapes or browser-specific access restrictions, despite extension API compatibility. Verify on a signed-in account.
- Firefox permissions and Mozilla Add-ons signing requirements apply for normal installation.
- Safari build requires Apple packaging (Xcode or App Store Connect) and separate macOS/iOS tests.
- Limit stored content: preferences and acknowledged alerts only, not raw message bodies.
- Packaging must not bundle development secrets or data extracts. Dist bundles are generated from an explicit file allowlist.
