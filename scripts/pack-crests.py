"""Empaqueta todos los escudos de public/crests en dist-web/crests-pack.json (ruta -> data URI WebP de 128 px).

Se usa para la versión web publicada (npm run build:web), donde no caben cientos de archivos sueltos.
Requiere Python 3 con Pillow.
"""
import base64, io, json, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'public' / 'crests'
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist-web' / 'crests-pack.json'

from PIL import Image

pack = {}
for png in sorted(src.rglob('*.png')):
    img = Image.open(png).convert('RGBA')
    img.thumbnail((128, 128), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=82, method=6)
    pack[png.relative_to(root / 'public').as_posix()] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(pack, separators=(',', ':')))
print(f'{len(pack)} escudos -> {out} ({out.stat().st_size / 1e6:.1f} MB)')
