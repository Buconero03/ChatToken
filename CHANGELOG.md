# Changelog

## 1.3.0 — Cross-browser packaging

- Preserve the same `o200k_base` tokenizer and count engine across browsers.
- Add a shared namespace adapter (`browser` or `chrome`).
- Ship Chromium MV3 service-worker, Firefox MV3 event-page, and Safari conversion-source manifests.
- Add reproducible Python build script and browser-specific installation notes.
- Retain 240k historical token handoff reminder and 250k operational reference.
- No changes to ChatGPT internal API requests or counting rules.

## 1.2.1 — New icon representing conversation token monitoring

- Replaced the shield motif with a conversation bubble, text bars, and a progress ring with a small amber alert segment.
- Updated PNG icons for Chrome toolbar, popup, and floating widget at 16/32/48/128/256/512 pixels.
- Kept the BPE engine, historical counter, alert levels, and GitHub publish workflow unchanged.

# Changelog

## 1.2.0 — Branding and GitHub-ready package

- Added a new custom shield + progress-ring app icon in PNG resolutions 16/32/48/128/256/512.
- Applied the brand mark to Chrome toolbar, popup header, floating chip and expanded card.
- Added a professional English README, privacy/security documentation and publishing scripts for Windows.
- **No changes** to BPE counting, history pagination, the 240,000-token reminder or the 250,000-token operational threshold.

## 1.1.0 — Compact UI

- Discreet floating chip and dismissible handoff reminder.
- Independent background monitoring and show/hide setting.

## 1.0.0 — Handoff alert

- Warning at 240,000 historical tokens, with optional PDF handoff prompt.
