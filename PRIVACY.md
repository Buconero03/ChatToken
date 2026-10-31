# Privacy overview

Context Guardian operates inside your logged-in ChatGPT browser tab. In optional deep-history mode, it requests accessible conversation pages from `chatgpt.com` using the browser's authenticated session and computes BPE counts locally.

## What it reads

- Text parts of accessible messages for the active conversation.
- Message IDs and metadata needed to deduplicate and paginate.
- Authentication/session material needed to issue requests back to the **same ChatGPT origin**; these values are not intentionally persisted by the extension.

## What it stores

- Preferences such as `enabled`, `deep`, and `widgetVisible`.
- Alert acknowledgements (which include conversation identifiers) to prevent repetitive reminders.

The current application code does **not** store conversation text in Chrome's extension storage or send it to independent analytics providers. This description reflects the reviewed v1.2 sources; review any modifications before installing.

## Operational caveat

The extension relies on undocumented ChatGPT APIs. It is not official, may stop working and does not provide authoritative active-context telemetry.
