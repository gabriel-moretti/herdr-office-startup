#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Check documentation links, names, required files and starter-only constraints."""
from pathlib import Path
import re
import argparse

ROOT=Path(__file__).resolve().parents[1]
REQUIRED=['LICENSE','NOTICE','README.md','CLAUDE.md','CONTRIBUTING.md','.gitignore','.editorconfig',
 'art/LICENSE','assets/LICENSE','docs/reference/product-page-source.txt']
DOCS=['PRODUCT','ARCHITECTURE','HERDR-API-NOTES','WORLD-SPEC','ASSETS','GIT-PANEL-SPEC',
      'PANELS-SPEC','ROADMAP','POC-PLAN','LICENSING','DECISIONS']
REQUIRED += ['docs/'+n+'.md' for n in DOCS]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--starter-only", action="store_true", help="also enforce no app implementation or git history in the delivery")
    args=parser.parse_args()
    errors=[]
    for name in REQUIRED:
        path=ROOT/name
        if not path.is_file() or path.stat().st_size==0:errors.append('missing/empty '+name)
    # Build the obsolete token from pieces so this checker does not itself contain it verbatim.
    obsolete='herdr-'+'habitat'
    docs=list(ROOT.rglob('*.md'))+[ROOT/'docs/reference/product-page-source.txt']
    links=0
    for path in docs:
        text=path.read_text()
        if obsolete in text.lower():errors.append('obsolete project name in '+str(path.relative_to(ROOT)))
        if path.suffix!='.md':continue
        for target in re.findall(r'\]\(([^)]+)\)',text):
            target=target.strip().split(' "')[0]
            if target.startswith(('https://','http://','mailto:','#')):continue
            target=target.split('#')[0]
            if not target:continue
            links+=1
            if not (path.parent/target).exists():errors.append(f'broken link {path.relative_to(ROOT)} -> {target}')
    assert 'Apache License' in (ROOT/'LICENSE').read_text()
    assert 'Attribution 4.0 International' in (ROOT/'art/LICENSE').read_text()
    assert (ROOT/'assets/LICENSE').read_bytes()==(ROOT/'art/LICENSE').read_bytes()
    # This delivery must not contain product implementation or installable manifests/layout JSON.
    if args.starter_only:
        for folder in ('mods','layouts','themes'):
            for f in (ROOT/folder).rglob('*'):
                if f.suffix in ('.js','.ts','.json'):errors.append('unexpected application implementation '+str(f.relative_to(ROOT)))
        if (ROOT/'.git').exists():errors.append('unexpected git history; starter must not initialize/push')
    plans=list((ROOT/'plans').glob('[0-9][0-9]-*.md'))
    # Milestones may be split or added later; require contiguous numbering from 00 and a README entry for each.
    numbers=sorted(int(p.name[:2]) for p in plans)
    if not plans or numbers!=list(range(len(plans))):errors.append('milestone prompts must be numbered contiguously from 00')
    index=(ROOT/'plans/README.md').read_text()
    for p in plans:
        if p.name not in index:errors.append('plans/README.md does not list '+p.name)
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'PASS: required documents; {links} local links; {len(plans)} prompts; consistent name; full licenses' + ('; no product implementation/git init' if args.starter_only else ''))
    return links


if __name__=='__main__':main()
