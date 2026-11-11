#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Validate delivered starter art, not Herdr runtime behavior."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'assets'


def validate_partial(cid):
    """Validate a character that ships only the clips its manifest declares (no atlas, no fixed slot count)."""
    base=ASSETS/'characters'/cid
    manifest=json.loads((base/'manifest.json').read_text())
    assert manifest['characterId']==cid and manifest['license']=='CC-BY-4.0'
    assert manifest['cell']==[48,48] and manifest['anchor']==[24,40]
    assert manifest['productionApproved'] is False
    seen=set();slots=0
    for clip in manifest['clips']:
        key=(clip['id'],clip['direction']);assert key not in seen,key;seen.add(key)
        count=clip['frameCount'];slots+=count
        assert clip['direction'] in ('north','east','south','west')
        assert clip['sourceState'] in ('working','blocked','done','idle','unknown')
        assert len(clip['frames'])==len(clip['durationsMs'])==count
        assert 'atlas' not in clip or (base/clip['atlas']).exists()
        hashes=[]
        for f in clip['frames']:
            im=Image.open(ROOT/f['file']);assert im.mode=='RGBA' and im.size==(48,48)
            alpha=set(im.getchannel('A').get_flattened_data());assert alpha<={0,255} and 255 in alpha
            hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
        assert len(set(hashes))==clip['uniqueFrameCount']
        still=Image.open(base/clip['still']);assert still.size==(48,48)
        if count==1:
            assert 'webp' not in clip and 'gif' not in clip and clip['playback']=='still'
            continue
        assert clip['playback']==('loop' if clip['loop'] else 'once')
        for kind in ('gif','webp'):
            im=Image.open(base/clip[kind]);assert im.n_frames==count,(cid,key,kind)
            duration=0
            for i in range(im.n_frames):
                im.seek(i);im.load();assert im.size==(48,48)
                duration+=im.info.get('duration',0)
            expected=sum(clip['durationsMs'])
            if kind=='gif':expected=sum((ms//10)*10 for ms in clip['durationsMs'])
            assert duration==expected,(cid,key,kind,duration,expected)
    assert slots==manifest['frameSlots']
    for p in manifest.get('portraits',[]):
        im=Image.open(base/p);assert im.mode=='RGBA' and im.size==(32,32),p
    return len(manifest['clips']),slots,len(manifest.get('portraits',[]))


def validate():
    manifest=json.loads((ASSETS/'characters/nico/manifest.json').read_text())
    base=ASSETS/'characters/nico'
    assert manifest['frameSlots']==65
    assert manifest['cell']==[48,48] and manifest['anchor']==[24,40]
    assert manifest['productionApproved'] is False
    assert len(manifest['clips'])==16
    total=0;animated=0;encoded=[]
    for clip in manifest['clips']:
        count=clip['frameCount'];total+=count
        assert len(clip['frames'])==len(clip['durationsMs'])==count
        assert clip['direction'] in ('north','east','south','west')
        assert clip['sourceState'] in ('working','blocked','done','idle','unknown')
        hashes=[];palette=set()
        atlas=Image.open(base/clip['atlas']).convert('RGBA')
        assert atlas.size==(384,48)
        for idx,f in enumerate(clip['frames']):
            im=Image.open(ROOT/f['file']);assert im.mode=='RGBA' and im.size==(48,48)
            alpha=set(im.getchannel('A').get_flattened_data());assert alpha<={0,255} and 0 in alpha and 255 in alpha
            palette.update((r,g,b) for r,g,b,a in im.get_flattened_data() if a)
            assert len(palette)<=24
            assert im.getbbox() is not None
            assert f['rect']==[idx*48,0,48,48]
            assert atlas.crop((idx*48,0,(idx+1)*48,48)).tobytes()==im.tobytes()
            hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
        assert len(set(hashes))==clip['uniqueFrameCount']
        still=Image.open(base/clip['still']);assert still.size==(48,48)
        if count>1:
            animated+=1
            for kind in ('gif','webp'):
                path=base/clip[kind];im=Image.open(path)
                duration=0
                for i in range(im.n_frames):
                    im.seek(i);im.load();assert im.size==(48,48)
                    duration+=im.info.get('duration',0)
                # Native encoders may merge identical slots. Source manifest counts remain fixed.
                expected=sum(clip['durationsMs'])
                if kind=='gif':expected=sum((ms//10)*10 for ms in clip['durationsMs'])
                assert duration==expected,(clip['id'],clip['direction'],kind,duration,expected)
                encoded.append((clip['direction']+'-'+clip['id'],kind,im.n_frames,duration))
    assert total==65 and animated==11
    env=json.loads((ASSETS/'environment/manifest.json').read_text())
    assert len(env['presets'])==3
    for preset in env['presets']:
        d=ASSETS/'environment'/preset['id']
        tiles=list((d/'tiles').glob('*.png'));props=list((d/'props').glob('*.png'))
        assert len(tiles)==16 and len(props)==9
        for tile in tiles:
            im=Image.open(tile);assert im.mode=='RGBA' and im.size==(16,16)
        for prop in props:Image.open(prop).verify()
    report={'result':'PASS','character':'nico','sourceFrameSlots':65,'variants':16,
            'animatedVariants':11,'staticVariants':5,'tiles':48,'propTypes':9,'propExports':27,
            'encodedAnimations':[{'clip':a,'format':b,'encodedFrames':c,'durationMs':d} for a,b,c,d in encoded],
            'runtimeTested':False,'artProductionApproved':False}
    (ASSETS/'validation-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print('PASS: 65 RGBA slots; 16 variants; 22 animations decode with valid durations; 48 tiles; 27 prop exports')
    for d in sorted((ASSETS/'characters').iterdir()):
        if d.name!='nico' and (d/'manifest.json').exists():
            clips,slots,portraits=validate_partial(d.name)
            print(f'PASS: {d.name} (partial): {clips} clips; {slots} RGBA slots; {portraits} portraits')
    print('Not a Herdr runtime test or production art approval.')


if __name__=='__main__':validate()
