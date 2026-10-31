#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_.-]+$')][string]$RepositoryName = 'context-guardian',
    [ValidateSet('public','private')][string]$Visibility = 'private',
    [ValidatePattern('^v[0-9]+\.[0-9]+\.[0-9]+$')][string]$Tag = 'v1.3.0'
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

function Need([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "Missing tool: $name. See docs/GITHUB_PUBLISH.md" }
}
function Assert-Exit([string]$action) {
    if ($LASTEXITCODE -ne 0) { throw "$action failed (exit code $LASTEXITCODE)" }
}
Need git
Need gh
& gh auth status 2>$null | Out-Null
Assert-Exit 'GitHub authentication (run gh auth login)'
$owner = ((& gh api user --jq .login) | Out-String).Trim()
Assert-Exit 'Detect GitHub owner'
if (-not $owner) { throw 'GitHub user login not found' }
$repo = "$owner/$RepositoryName"
$manifest = Get-Content (Join-Path $Root 'packaging/manifest.chromium.json') -Raw | ConvertFrom-Json
if ($Tag -ne ('v' + $manifest.version)) { throw "Tag $Tag does not match extension version $($manifest.version). Change extension version and rebuild first." }

Write-Host "`nContext Guardian GitHub Release publisher" -ForegroundColor Cyan
Write-Host "Repository: $repo ; Visibility: $Visibility ; Release: $Tag"
Write-Host 'This operation will create/update a GitHub repository and publish browser-specific release files.' -ForegroundColor Yellow
if ($Visibility -eq 'public') {
    Write-Host 'WARNING: files will be public. Review your code and note that no project-wide open-source license is assigned.' -ForegroundColor Yellow
    $answer = Read-Host "To confirm, type PUBLIC"
    if ($answer -cne 'PUBLIC') { throw 'Publication cancelled' }
} else {
    $answer = Read-Host 'Type PRIVATE to publish to a private repository'
    if ($answer -cne 'PRIVATE') { throw 'Publication cancelled' }
}

# Turn README placeholder links into functional links for the actual repository.
$readmeFile = Join-Path $Root 'README.md'
$readme = [System.IO.File]::ReadAllText($readmeFile, [System.Text.Encoding]::UTF8)
if ($readme.Contains('__REPOSITORY__')) {
    $readme = $readme.Replace('__REPOSITORY__', $repo)
    [System.IO.File]::WriteAllText($readmeFile, $readme, (New-Object System.Text.UTF8Encoding($false)))
} elseif (-not $readme.Contains("github.com/$repo/releases/latest")) {
    throw 'README release links point to a different repository; refusing to publish incorrectly linked downloads.'
}

# Build all packages locally, verifying filenames and ZIP integrity.
$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) { & py -3 (Join-Path $Root 'scripts/build-cross-browser.py') }
else {
    Need python
    & python (Join-Path $Root 'scripts/build-cross-browser.py')
}
Assert-Exit 'Building cross-browser packages'
$names = @('CHROMIUM','FIREFOX','SAFARI')
$assets = @()
Add-Type -AssemblyName System.IO.Compression.FileSystem
foreach ($name in $names) {
    $asset = Join-Path $Root "dist/Context_Guardian_${Tag}_${name}.zip"
    if (-not (Test-Path -LiteralPath $asset)) { throw "Missing release asset: $asset" }
    $z = [System.IO.Compression.ZipFile]::OpenRead($asset)
    try {
        if (-not ($z.Entries | Where-Object { $_.FullName -eq 'manifest.json' })) { throw "Missing manifest.json in $asset" }
    } finally { $z.Dispose() }
    $assets += $asset
}

$gitName = ((& git config user.name) | Out-String).Trim()
$gitMail = ((& git config user.email) | Out-String).Trim()
if (-not $gitName -or -not $gitMail) { throw 'Set git config --global user.name and user.email first.' }
if (-not (Test-Path (Join-Path $Root '.git'))) {
    & git init -b main
    Assert-Exit 'Initialize repository'
}
$branch = ((& git branch --show-current) | Out-String).Trim()
if ($branch -and $branch -ne 'main') { throw "Unexpected branch $branch (expected main)" }
$allowed = @(
    '.gitignore','README.md','CHANGELOG.md','CONTRIBUTING.md','INSTALLAZIONE_IT.md','PRIVACY.md','SECURITY.md','VERIFICHE.md',
    'manifest.json','alert-policy.js','background.mjs','content.css','content.js','engine.mjs',
    'pagination.js','pagination.mjs','popup.css','popup.html','popup.js',
    'icons','licenses','vendor','tests','docs','scripts','packaging','Publish-GitHub.cmd'
)
& git add -- $allowed
Assert-Exit 'Stage approved source files'
$pending = ((& git diff --cached --name-only) | Out-String).Trim()
if ($pending) {
    Write-Host "Source files staged for push:`n$pending"
    & git commit -m "Release Context Guardian ${Tag}: browser-specific downloads"
    Assert-Exit 'Commit source'
}
$origin = ''
$remotes = ((& git remote) | Out-String).Trim() -split '\s+'
if ($remotes -contains 'origin') {
    $origin = ((& git remote get-url origin) | Out-String).Trim()
    Assert-Exit 'Read existing origin'
}
if (-not $origin) {
    & gh repo view $repo --json nameWithOwner --jq .nameWithOwner *> $null
    if ($LASTEXITCODE -eq 0) { throw "Repository $repo exists but no matching origin is configured. Refusing to overwrite it automatically." }
    Write-Host 'Creating repository and pushing source...'
    & gh repo create $repo "--$Visibility" --description 'Cross-browser ChatGPT conversation history token counter' --source . --remote origin --push
    Assert-Exit 'Create/push GitHub repository'
} else {
    $normalized = $origin.TrimEnd('/') -replace '\.git$',''
    if ($normalized -ine "https://github.com/$repo" -and $normalized -ine "git@github.com:$repo") { throw "origin $origin does not match $repo" }
    & git push -u origin main
    Assert-Exit 'Push latest source'
}

# Create the release with 3 assets, or safely update assets of an existing release.
& gh release view $Tag -R $repo --json tagName --jq .tagName *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release $Tag already exists; refreshing the three downloadable assets..."
    & gh release upload $Tag @assets --clobber -R $repo
    Assert-Exit 'Update release assets'
} else {
    Write-Host "Creating release $Tag with three browser downloads..."
    & gh release create $Tag @assets -R $repo --title "Context Guardian $Tag - Cross-browser downloads" --notes-file (Join-Path $Root 'docs/RELEASE_NOTES.md') --latest
    Assert-Exit 'Create GitHub Release'
}

Write-Host "`nSUCCESS: https://github.com/$repo" -ForegroundColor Green
Write-Host "Download choices: https://github.com/$repo/releases/latest" -ForegroundColor Green
foreach ($name in $names) { Write-Host "https://github.com/$repo/releases/latest/download/Context_Guardian_${Tag}_${name}.zip" }
