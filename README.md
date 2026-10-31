# Context Guardian

**A lightweight, cross-browser token counter for ChatGPT conversations.**

Context Guardian locally counts the text tokens in accessible ChatGPT conversation history using the `o200k_base` tokenizer. The compact interface stays out of the way and can remind you to prepare a project handoff when a conversation grows long.

> **What it measures:** recovered historical conversation text tokens—not the model's live context usage, actual remaining capacity, or cumulative billable model tokens. **250,000** is an operational reference for historical tokens, **not a verified ChatGPT model limit**. A small reminder appears at **240,000** historical text tokens.

## Download for your browser

**Choose your browser and download the corresponding file from the latest GitHub Release:**

| Browser | Download | What you get |
| :--- | :--- | :--- |
| **Google Chrome / Microsoft Edge / Brave / Opera / Vivaldi** | **[Download for Chromium](https://github.com/Buconero03/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_CHROMIUM.zip)** | Installable as an unpacked extension in developer mode |
| **Mozilla Firefox** | **[Download for Firefox](https://github.com/Buconero03/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_FIREFOX.zip)** | Temporary developer add-on; signing required for permanent distribution |
| **Apple Safari (macOS)** | **[Download Safari source](https://github.com/Buconero03/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_SAFARI.zip)** | Source package; requires Xcode conversion, signing and testing |

**[View all releases and changelogs](https://github.com/Buconero03/context-guardian/releases/latest)**

The downloads above are **Release assets**. The source code and scripts stay together in this one repository. The publication script fills in the actual GitHub repository name automatically.

### Quick installation

**Chrome / Edge / Brave / Opera / Vivaldi:** Extract the `CHROMIUM.zip` → open the browser's extensions page (for Chrome, `chrome://extensions`) → enable Developer mode → **Load unpacked** → select the extracted folder containing `manifest.json`. Reload ChatGPT once.

**Firefox:** Extract `FIREFOX.zip` → open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `manifest.json`. This is temporary and disappears after browser restart; public distribution needs a Mozilla-signed add-on.

**Safari:** The ZIP contains **source code**, not a directly installable Safari extension. On macOS use Xcode and Apple's Safari Web Extension conversion/signing steps. Safari has **not** been verified end to end.

Detailed instructions: [Installation guide (Italiano)](INSTALLAZIONE_IT.md) · [Cross-browser technical notes](docs/CROSS_BROWSER.md)

## Features

- Local BPE tokenization (`o200k_base`) of recovered user/assistant text.
- Automatic conversation recognition and incremental history pagination where available.
- Compact, hideable counter with user/assistant breakdown.
- A dismissible historical-token reminder at **240,000**, with an optional PDF project-handoff prompt.
- No external analytics uploads; internal ChatGPT requests run in the signed-in browser.
- One shared counting engine across supported browser packages.

## Repository layout

```text
context-guardian/
├── README.md                     # This page, including browser-specific download links
├── engine.mjs                    # Shared counting engine
├── content.js / content.css      # UI and conversation reader
├── vendor/                       # Bundled BPE tokenizer
├── packaging/                    # Browser-specific manifests
├── scripts/
│   ├── build-cross-browser.py    # Builds the 3 download ZIPs
│   └── Publish-GitHub.ps1        # Publishes repository + GitHub Release assets
├── tests/
├── docs/
└── dist/                         # Local build outputs (gitignored, uploaded to Releases)
```

## Developer: build and test

```bash
python scripts/build-cross-browser.py
node --test tests/*.test.mjs
```

The browser packages are assembled from this common source. They are **not** separate repositories.

## Publish one repository and one multi-browser release

Windows: install [Git](https://git-scm.com/) and [GitHub CLI](https://cli.github.com/), run `gh auth login`, then:

```powershell
.\scripts\Publish-GitHub.ps1 -Visibility public -RepositoryName context-guardian
```

The script shows a publication confirmation, builds/validates all three ZIPs, creates or updates the source repository, and attaches browser-specific downloads to **one GitHub Release**. You can also double-click `Publish-GitHub.cmd` after extracting the project; that shortcut explicitly selects public publication and requires confirmation. See [GitHub publishing guide](docs/GITHUB_PUBLISH.md).

## Accuracy, privacy, and distribution notes

This extension counts text **available from the ChatGPT conversation history**. A conversation may be compacted, truncated or processed with tools/files not visible to the counter. Therefore it **cannot** reliably calculate real context saturation or tokens remaining. A page can be incomplete if ChatGPT's internal, undocumented endpoints change or rate-limit requests.

The extension accesses a session token transiently to retrieve your own conversation history from ChatGPT; it does not store the token in extension storage. Review [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) before using it, and never share browser cookies or session details.

**License:** third-party tokenizer licenses are included in [`licenses/`](licenses/); the application code does not currently have a project-wide open-source license. The repository owner should choose a license before inviting external reuse or contributions.
