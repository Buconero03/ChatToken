# Publish Context Guardian as ONE GitHub repository with browser choices

GitHub's **Releases** feature lets a single repository host multiple downloadable files. The README in the repository links to the assets of the **latest** release.

## Before publishing

1. Review the source, `PRIVACY.md`, `SECURITY.md`, and `licenses/THIRD_PARTY.md`.
2. Decide a project-level license before inviting reuse. Vendored tokenizer dependency licenses do not automatically license the application.
3. On Windows, install **Git**, **GitHub CLI (`gh`)**, and **Python 3**.
4. Run `gh auth login` in PowerShell and authenticate through GitHub's browser flow.
5. Set author identity: `git config --global user.name "Your name"` and `git config --global user.email "your-github-noreply-address"`.

## Publish publicly (one command)

Extract this repository ZIP somewhere permanent, such as `F:\Context-Guardian`, then run:

```powershell
.\scripts\Publish-GitHub.ps1 -RepositoryName context-guardian -Visibility public
```

Or double-click `Publish-GitHub.cmd`, which explicitly selects **public** and asks for confirmation. Running the PowerShell script with no `-Visibility` parameter defaults to **private** for safety.

The script asks you to type **PUBLIC** before creating or updating a public repository. No remote action occurs until you run the script and confirm. It then:

1. Fills `README.md` links with your actual GitHub account/repository name.
2. Builds `CHROMIUM.zip`, `FIREFOX.zip`, and `SAFARI.zip` from one source tree.
3. Checks each ZIP contains `manifest.json`.
4. Stages only approved public-source files, commits and pushes to `main`.
5. Creates a GitHub Release `v1.3.0` and uploads all 3 ZIPs as assets.
6. Prints links to the repository and the Release's individual browser downloads.

The generated `dist/` directory stays local and is gitignored. Users download files from **Releases**, not from three repositories or from the GitHub-generated source-code ZIP.

## Links users will see

```text
https://github.com/OWNER/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_CHROMIUM.zip
https://github.com/OWNER/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_FIREFOX.zip
https://github.com/OWNER/context-guardian/releases/latest/download/Context_Guardian_v1.3.0_SAFARI.zip
```

GitHub automatically generates **Source code (zip)** and **Source code (tar.gz)** too: these are not browser-specific packages. The README lists only our three browser downloads.

## Updating to a later release

Update version in all three files under `packaging/`, update `scripts/build-cross-browser.py` output filename version, update README download filename versions, then publish with the matching `-Tag vX.Y.Z`. The script refuses a tag that doesn't match the manifest version. There is no force push.

If the repository already exists **and is already connected as origin to this extracted directory**, re-running the script with the same tag updates the release assets. If `origin` differs, the script stops for safety.

**Firefox:** unsigned ZIP is for temporary developer loading; permanent distribution requires Mozilla signing. **Safari:** asset contains source, not an installable signed app.

References: https://cli.github.com/manual/gh_repo_create · https://cli.github.com/manual/gh_release_create · https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases
