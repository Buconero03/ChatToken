# Security notes

This Chrome extension can read content from logged-in ChatGPT conversations and makes authenticated same-origin requests to retrieve historical pages.

- Install only code you trust, and review `content.js`, `background.mjs`, and `manifest.json` before use.
- Never post HAR/network logs, cookies, bearer tokens, exported messages, or account-specific identifiers in public GitHub Issues.
- The repository publication script stages only a known list of project files, not arbitrary downloads or local conversation exports.
- Keep third-party dependencies and Chrome updated.
- The use of unofficial ChatGPT endpoints can be fragile; it is not endorsed by OpenAI.

For a security concern, open a minimal issue **without credentials or private conversation content**, or contact the repository owner privately through their preferred GitHub contact method.
