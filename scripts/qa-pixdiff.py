# Pixel comparison of two screenshot folders (from: node scripts/qa.mjs screenshots <dir>).
# usage: python3 scripts/qa-pixdiff.py <beforeDir> <afterDir> [diffDir]   (needs Pillow)
# Prints the share of changed pixels per screenshot; with diffDir, writes
# side-by-side crops of the changed region.
import sys, os
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else None
for f in sorted(os.listdir(a)):
    if not f.endswith('.png') or not os.path.exists(os.path.join(b, f)): continue
    A = Image.open(os.path.join(a, f)).convert('RGB'); B = Image.open(os.path.join(b, f)).convert('RGB')
    note = '' if A.size == B.size else f' size {A.size}->{B.size}'
    w, h = min(A.width, B.width), min(A.height, B.height)
    d = ImageChops.difference(A.crop((0, 0, w, h)), B.crop((0, 0, w, h))).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = sum(d.histogram()[255:]); pct = 100 * n / (w * h); box = d.getbbox()
    print(f'{f:28} {pct:6.2f}% changed{note}' + (f'  region {box}' if box else ''))
    if out and box:
        os.makedirs(out, exist_ok=True)
        x0, y0, x1, y1 = box; y1 = min(y1, y0 + 900)
        both = Image.new('RGB', ((x1 - x0) * 2 + 20, y1 - y0), 'white')
        both.paste(A.crop((x0, y0, x1, y1)), (0, 0)); both.paste(B.crop((x0, y0, x1, y1)), (x1 - x0 + 20, 0))
        both.save(os.path.join(out, 'diff-' + f))
