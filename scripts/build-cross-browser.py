#!/usr/bin/env python3
"""Produce browser-specific unpacked folders and ZIP archives from one source tree."""
from pathlib import Path
import json, shutil, zipfile, sys
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'dist'
SKIP={'dist','packaging','tests','docs','scripts','.git','.github','__pycache__'}
KEEP_DOCS={'README.md','PRIVACY.md','SECURITY.md','CHANGELOG.md','CONTRIBUTING.md','INSTALLAZIONE_IT.md'}
def build():
    OUTPUT.mkdir(exist_ok=True)
    for browser in ('chromium','firefox','safari'):
        target=OUTPUT/browser
        if target.exists(): shutil.rmtree(target)
        target.mkdir()
        for item in ROOT.iterdir():
            if item.name in SKIP or item.name=='manifest.json' or item.name.startswith('.') or item.name.endswith('.cmd'): continue
            if item.is_dir():
                shutil.copytree(item,target/item.name)
            elif item.is_file() and item.name in KEEP_DOCS|{'alert-policy.js','background.mjs','content.css','content.js','engine.mjs','pagination.js','pagination.mjs','popup.css','popup.html','popup.js'}:
                shutil.copy2(item,target/item.name)
        shutil.copy2(ROOT/'packaging'/f'manifest.{browser}.json',target/'manifest.json')
        assert 'manifest.json' in {p.name for p in target.iterdir()}
        out=OUTPUT/f'Context_Guardian_v1.3.0_{browser.upper()}.zip'
        with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for file in sorted(target.rglob('*')):
                if file.is_file(): z.write(file,file.relative_to(target))
        print(f'{browser}: {out} ({out.stat().st_size} bytes)')
if __name__=='__main__': build()
