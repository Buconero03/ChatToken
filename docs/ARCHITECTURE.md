# Architecture (summary)

- `manifest.json`: Manifest V3 registration, icon assets, permissions, content scripts and browser-specific background worker / event page.
- `content.js`: floating widget, ChatGPT URL recognition, same-origin history page retrieval, warning UI, configuration and refresh lifecycle.
- `pagination.js` and `pagination.mjs`: history page navigation / de-duplication helpers.
- `background.mjs` and `engine.mjs`: locally count accessible text tokens using bundled BPE runtime.
- `alert-policy.js`: operational 250k historical threshold and 240k preliminary alert; PDF handoff prompt.
- `popup.html`, `popup.css`, `popup.js`: cross-browser toolbar popup.
- `vendor/`: tokenizer runtime, packaged locally; see `licenses/` for MIT notices.

The code retrieves text of accessible conversation history. It does not have direct access to ChatGPT's hidden prompt or the currently active model context buffer. It must not present historical counts as exact context saturation.
