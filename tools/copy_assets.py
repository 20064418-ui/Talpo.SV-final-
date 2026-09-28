"""Copia assets/img y assets/mp4 a public/assets decodificando nombres #Uxxxx / #Lxxxxxx del ZIP."""
import os, re, shutil, sys
SRC = sys.argv[1]; DST = sys.argv[2]; SKIP_MP4 = '--skip-mp4' in sys.argv
def decode(name):
    name = re.sub(r'#U([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), name)
    name = re.sub(r'#L([0-9a-fA-F]{6})', lambda m: chr(int(m.group(1), 16)), name)
    return name
for sub in ['img', 'mp4']:
    if sub == 'mp4' and SKIP_MP4: continue
    for root, _, files in os.walk(os.path.join(SRC, sub)):
        rel = os.path.relpath(root, SRC)
        out = os.path.join(DST, decode(rel)); os.makedirs(out, exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(root, f), os.path.join(out, decode(f)))
print('ok')
