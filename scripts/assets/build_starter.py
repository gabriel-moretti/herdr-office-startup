#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Rebuild original PoC placeholder art, not Herdr application code.
Sources are local generated artwork; no network, credentials, or host installation.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets'
SRC = ROOT / 'art/source'
SIZE = 48
ANCHOR = [24, 40]


def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)


def keyed(im):
    """Remove saturated pink chroma key, including JPEG boundary fringes."""
    im = im.convert('RGBA')
    pix = []
    for r, g, b, a in im.get_flattened_data():
        pink = r > 100 and g < 85 and b > max(g * 1.2, r * .38) and r > g * 1.5
        pix.append((0, 0, 0, 0) if pink else (r, g, b, 255))
    im.putdata(pix)
    return im.crop(im.getbbox())


def normalize(im, width=24, height=32):
    # Common logical body extent, feet on y=39 with pivot at y=40.
    im = keyed(im).resize((width, height), Image.Resampling.NEAREST)
    cell = Image.new('RGBA', (SIZE, SIZE))
    cell.alpha_composite(im, ((SIZE - width) // 2, 40 - height))
    return cell


def quantize_shared(frames):
    # A shared 24-color opaque palette, with alpha binary and independent.
    samples = []
    for frame in frames:
        samples.extend((r, g, b) for r, g, b, a in frame.get_flattened_data() if a)
    strip = Image.new('RGB', (len(samples), 1)); strip.putdata(samples)
    pal = strip.quantize(colors=24, method=Image.Quantize.MEDIANCUT)
    result = []
    for frame in frames:
        rgb = frame.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA')
        rgb.putalpha(frame.getchannel('A'))
        # Canonical zero RGB under alpha=0 makes atlas/source pixels byte-identical.
        rgb.putdata([(r,g,b,a) if a else (0,0,0,0) for r,g,b,a in rgb.get_flattened_data()])
        result.append(rgb)
    return result


def offset(im, dx=0, dy=0):
    canvas = Image.new('RGBA', im.size); canvas.alpha_composite(im, (dx, dy)); return canvas


def gesture(base, index, both=False):
    im = base.copy(); d = ImageDraw.Draw(im)
    y = 17 - (index % 3)
    for side in ([0, 1] if both else [1]):
        x = 12 if side == 0 else 35
        d.line([(16 if side == 0 else 31, 26), (x, y + 3)], fill='#202936', width=5)
        d.line([(16 if side == 0 else 31, 25), (x, y + 2)], fill='#D9856F', width=3)
        d.rectangle((x - 1, y - 2, x + 1, y + 1), fill='#DAA477', outline='#202936')
    return im


def south_cup(base, index):
    im = base.copy(); d = ImageDraw.Draw(im)
    y = [30, 26, 22, 22, 26, 30][index]
    d.line([(31, 29), (29, y)], fill='#D9856F', width=4)
    d.rectangle((26, y-1, 31, y+4), fill='#E8E4DA', outline='#202936')
    d.rectangle((27, y, 30, y+1), fill='#644A38')
    d.line([(32,y+1),(33,y+1),(33,y+3),(32,y+3)],fill='#E8E4DA',width=1)
    return im


def walk(base, direction, index):
    im = base.copy()
    # Procedural feet-only swing: a starter cycle, not a hand-drawn gait.
    feet = base.crop((0, 33, 48, 41)); im.paste((0,0,0,0),(0,33,48,41))
    if direction in ('north','south'):
        step = [0,1,2,0,-1,-2][index]
        left=feet.crop((0,0,24,8));right=feet.crop((24,0,48,8))
        im.alpha_composite(left,(0,33+step));im.alpha_composite(right,(24,33-step))
    else:
        step=[0,1,2,0,-1,-2][index]
        im.alpha_composite(feet,(step,33))
    return im


def export_clip(name, source, direction, frames, durations, loop):
    folder = OUT / 'characters/nico'
    filebase = f'{direction}-{name}'
    raw = ROOT / 'art/characters/nico' / name / direction
    hashes=[]
    for i,frame in enumerate(frames):
        save(frame, raw/f'frame-{i:02}.png')
        hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
    atlas=Image.new('RGBA',(8*48,math.ceil(len(frames)/8)*48))
    for i,frame in enumerate(frames): atlas.alpha_composite(frame,((i%8)*48,(i//8)*48))
    save(atlas,folder/f'{filebase}-atlas.png');save(frames[0],folder/f'{filebase}-still.png')
    entry={'id':name,'sourceState':source,'direction':direction,'frameCount':len(frames),
           'uniqueFrameCount':len(set(hashes)),'durationsMs':durations,'anchor':ANCHOR,
           'cell':[48,48],'loop':loop,'playback':'loop' if loop else ('still' if len(frames)==1 else 'once'),
           'atlas':f'{filebase}-atlas.png','still':f'{filebase}-still.png',
           'frames':[{'file':str((raw/f'frame-{i:02}.png').relative_to(ROOT)),
                      'rect':[(i%8)*48,(i//8)*48,48,48],'durationMs':durations[i]} for i in range(len(frames))],
           'status':'starter-placeholder','manualCleanupRequired':True}
    if len(frames)>1:
        # Pillow merges identical consecutive frames: manifest slots remain the source truth.
        frames[0].save(folder/f'{filebase}.webp',save_all=True,append_images=frames[1:],
                       duration=durations,loop=0 if loop else 1,lossless=True,quality=100,method=6)
        gifframes=[]
        for frame in frames:
            rgb=frame.convert('RGB').quantize(colors=255,dither=Image.Dither.NONE)
            alpha=frame.getchannel('A');rgb.paste(255,mask=alpha.point(lambda x:255 if x==0 else 0))
            palette=rgb.getpalette();palette += [0]*(768-len(palette));palette[765:768]=[255,0,255];rgb.putpalette(palette)
            rgb.info['transparency']=255;gifframes.append(rgb)
        # GIF loop extension omitted for one-shot clips, so play once.
        kwargs={'loop':0} if loop else {}
        gifframes[0].save(folder/f'{filebase}.gif',save_all=True,append_images=gifframes[1:],
                          duration=durations,transparency=255,disposal=2,optimize=False,**kwargs)
        entry.update(webp=f'{filebase}.webp',gif=f'{filebase}.gif',
                     previewNote='GIF timing rounded to 10ms; validate WebP loop-count interpretation in Herdr')
    return entry


def environment():
    colors={
      'nordic-day':{'floor':'#C9AC85','line':'#AE8A65','wall':'#E8E4DA','wood':'#C99F73','accent':'#87A28B'},
      'botanical':{'floor':'#B87B63','line':'#97634F','wall':'#BED0B3','wood':'#916A50','accent':'#557C58'},
      'blue-hour':{'floor':'#455565','line':'#34404F','wall':'#697C96','wood':'#9A8069','accent':'#9A8BB4'}}
    inventory=[]
    for name,c in colors.items():
        dest=OUT/'environment'/name
        tileatlas=Image.new('RGBA',(8*16,2*16))
        for i in range(16):
            tile=Image.new('RGBA',(16,16),c['floor'] if i<8 else c['wall']);d=ImageDraw.Draw(tile)
            if i<8:
                d.line((0,15,15,15),fill=c['line']);d.line(((i*3)%16,0,(i*3)%16,15),fill=c['line'])
                d.point(((i*5)%15,7),fill=c['line'])
            else:
                d.line((0,14,15,14),fill='#455565');d.line((0,15,15,15),fill='#202936')
                if i%2:d.rectangle((0,0,1,13),fill=c['line'])
            tname=f'{"floor" if i<8 else "wall"}-{i%8:02}.png';save(tile,dest/'tiles'/tname)
            tileatlas.alpha_composite(tile,((i%8)*16,(i//8)*16))
        save(tileatlas,dest/'tiles-atlas.png')
        specs={'desk':(64,48),'chair':(24,24),'monitor':(24,16),'keyboard':(24,8),
               'coffee-counter':(64,32),'coffee-machine':(24,32),'plant':(24,32),
               'sofa':(64,32),'window':(32,32)}
        for prop,size in specs.items():
            im=Image.new('RGBA',size);d=ImageDraw.Draw(im);W,H=size;edge='#202936'
            if prop in ('desk','coffee-counter'):
                d.rectangle((2,2,W-3,H-6),fill=c['wood'],outline=edge,width=2)
                d.rectangle((5,H-6,9,H-1),fill='#455565');d.rectangle((W-10,H-6,W-6,H-1),fill='#455565')
            elif prop=='chair':
                d.rectangle((3,3,20,18),fill=c['accent'],outline=edge,width=2);d.rectangle((5,1,18,6),fill='#455565',outline=edge)
                d.line((12,18,12,22),fill=edge,width=2);d.line((4,22,20,22),fill=edge,width=2)
            elif prop=='monitor':
                d.rectangle((1,0,22,12),fill='#455565',outline=edge);d.rectangle((3,2,20,10),fill='#79B4C6')
                d.line((5,4,16,4),fill='#D7E8E4');d.line((5,7,18,7),fill='#D7E8E4');d.rectangle((10,13,13,15),fill=edge)
            elif prop=='keyboard':
                d.rectangle((0,0,23,7),fill='#455565',outline=edge)
                for x in range(3,22,4):
                    for y in (2,5):d.point((x,y),fill='#E8E4DA')
            elif prop=='coffee-machine':
                d.rectangle((3,1,20,28),fill='#455565',outline=edge,width=2);d.rectangle((6,5,17,11),fill='#E8E4DA',outline=edge)
                d.rectangle((8,16,15,23),fill='#E8E4DA',outline=edge);d.rectangle((6,27,18,30),fill='#9AA8B4',outline=edge)
            elif prop=='plant':
                d.polygon([(5,20),(19,20),(17,30),(7,30)],fill=c['wood'],outline=edge)
                for xy in [(3,9,12,20),(10,5,21,16),(7,1,15,14)]:d.ellipse(xy,fill=c['accent'],outline=edge)
            elif prop=='sofa':
                d.rectangle((1,2,62,29),fill=c['accent'],outline=edge,width=2)
                d.rectangle((5,6,58,13),fill=c['wall'],outline=edge)
                for x in (7,24,41):d.rectangle((x,14,x+15,25),fill=c['accent'],outline=edge)
            else:
                d.rectangle((1,1,30,30),fill=c['wall'],outline=edge,width=2);d.rectangle((5,5,26,26),fill='#79B4C6',outline='#455565')
                d.line((16,5,16,26),fill=c['wall'],width=2);d.line((5,16,26,16),fill=c['wall'],width=2)
            save(im,dest/'props'/f'{prop}.png')
        inventory.append({'id':name,'tiles':16,'props':list(specs),'status':'procedural-starter',
                          'license':'CC-BY-4.0','palette':c})
    return inventory


def previews(entries):
    sheet=Image.new('RGB',(8*48, len(entries)*48),'#E8E4DA')
    for r,e in enumerate(entries):
        for i,f in enumerate(e['frames']):
            sheet.paste(Image.open(ROOT/f['file']),(i*48,r*48),Image.open(ROOT/f['file']))
    save(sheet.resize((768,len(entries)*96),Image.Resampling.NEAREST),OUT/'previews/nico-contact-sheet.png')
    sceneall=Image.new('RGB',(768,288),'#202936')
    for j,preset in enumerate(('nordic-day','botanical','blue-hour')):
        env=OUT/'environment'/preset;scene=Image.new('RGBA',(256,288))
        for x in range(0,256,16):
            for y in range(0,288,16):
                scene.alpha_composite(Image.open(env/'tiles'/('wall-00.png' if y<32 else 'floor-00.png')),(x,y))
        for prop,xy in [('window',(176,0)),('desk',(24,64)),('chair',(44,106)),('monitor',(44,66)),
                         ('keyboard',(44,87)),('coffee-counter',(168,112)),('coffee-machine',(180,112)),
                         ('plant',(208,208)),('sofa',(24,224))]:
            scene.alpha_composite(Image.open(env/'props'/f'{prop}.png'),xy)
        actor=Image.open(OUT/'characters/nico/north-idle-still.png');scene.alpha_composite(actor,(32,76))
        sceneall.paste(scene.convert('RGB'),(j*256,0))
    save(sceneall,OUT/'previews/office-presets.png')
    names=['north-coding','north-coffee-sip-seated','south-coffee-sip-standing',
           'north-walk','east-walk','south-walk','west-walk']
    board=Image.new('RGB',(len(names)*96,192),'#E8E4DA')
    for j,name in enumerate(names):
        im=Image.open(OUT/'characters/nico'/f'{name}-still.png').resize((96,96),Image.Resampling.NEAREST)
        board.paste(im,(j*96,0),im)
        dark=Image.new('RGB',(96,96),'#202936');dark.paste(im,(0,0),im);board.paste(dark,(j*96,96))
    save(board,OUT/'previews/alpha-directions-check.png')


def main():
    master=Image.open(SRC/'nico-turnaround-rejected.jpg')
    W,H=master.size
    # Only the identity-correct north and south cells are used. Other cells were rejected.
    north=normalize(master.crop((0,0,W//4,H)))
    south=normalize(master.crop((W//4,0,W//2,H)))
    east=normalize(Image.open(SRC/'nico-east.jpg'),width=20,height=32)
    west=ImageOps.mirror(east)  # provisional: symmetric headphones; final requires independent review.
    actions=Image.open(SRC/'nico-actions-north.jpg');aW,aH=actions.size
    coding=[];coffee=[]
    for i in range(4):
        coding.append(normalize(actions.crop((i*aW//4,0,(i+1)*aW//4,aH//2)),width=28,height=32))
        coffee.append(normalize(actions.crop((i*aW//4,aH//2,(i+1)*aW//4,aH)),width=28,height=32))
    # Normalize all source stills to a common 24-color palette before deriving action frames.
    allsrc=quantize_shared([north,south,east,west]+coding+coffee)
    north,south,east,west=allsrc[:4];coding=allsrc[4:8];coffee=allsrc[8:12]
    sequence=[0,1,2,3,2,1]
    raw=[('coding','working','north',[coding[i] for i in sequence],[125]*6,True),
         ('blocked','blocked','north',[gesture(north,i) for i in range(4)],[200]*4,True),
         ('waiting','blocked','north',[gesture(north,2) if i%2 else gesture(north,1) for i in range(4)],[250]*4,True),
         ('done','done','north',[gesture(north,i,both=True) for i in range(6)],[150]*6,True),
         ('idle','idle','north',[north,north,offset(north,dy=-1),north],[300]*4,True),
         ('unknown','unknown','north',[north],[0],False),
         ('coffee-sip-seated','idle','north',[coffee[i] for i in [0,1,2,2,1,0]],[250]*6,False),
         ('coffee-sip-standing','idle','south',[south_cup(south,i) for i in range(6)],[250]*6,False)]
    for direction,base in [('north',north),('east',east),('south',south),('west',west)]:
        raw.append(('walk','idle',direction,[walk(base,direction,i) for i in range(6)],[120]*6,True))
        raw.append(('stand-idle','idle',direction,[base],[0],False))
    # Re-quantize the complete final set so scripted hands/cup share the same palette.
    flat=quantize_shared([f for r in raw for f in r[3]]);cursor=0;entries=[]
    for name,source,direction,frames,durations,loop in raw:
        count=len(frames);frames=flat[cursor:cursor+count];cursor+=count
        entries.append(export_clip(name,source,direction,frames,durations,loop))
    manifest={'schemaVersion':1,'generator':'scripts/assets/build_starter.py','characterId':'nico',
              'license':'CC-BY-4.0','status':'starter-placeholder','productionApproved':False,
              'cell':[48,48],'anchor':ANCHOR,'frameSlots':sum(e['frameCount'] for e in entries),
              'directionConvention':{'north':'back','east':'right profile','south':'front','west':'left profile'},
              'limitations':['procedural gait/attention/done; not hand-drawn animation',
                'west is mirrored east; independent directional cleanup needed',
                'source views differ in overhead angle; normalize silhouette manually',
                'coding source contains small keyboard; remove keyboard into prop for final production',
                'one-shot timing/restart must be validated in Herdr; repeated frames may be merged by encoders'],
              'clips':entries}
    dest=OUT/'characters/nico';dest.mkdir(parents=True,exist_ok=True)
    (dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    env=environment();(OUT/'environment/manifest.json').write_text(json.dumps({'schemaVersion':1,'presets':env},indent=2)+'\n')
    previews(entries)
    print(f'Generated {manifest["frameSlots"]} Nico frame slots, {len(entries)} clip/still variants; 3×16 tiles + 3×9 prop exports')


if __name__ == '__main__':
    main()
