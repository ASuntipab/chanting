import os
import glob
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'screenshots')
IPAD_129_DIR = os.path.join(SCREENSHOTS_DIR, 'ios_ipad_12.9_2048x2732')
IPAD_11_DIR = os.path.join(SCREENSHOTS_DIR, 'ios_ipad_11_1668x2388')

os.makedirs(IPAD_11_DIR, exist_ok=True)

print("=" * 65)
print("Processing iPad App Store Screenshots...")
print(f"Source 12.9\": {IPAD_129_DIR}")
print("=" * 65)

files = sorted(glob.glob(os.path.join(IPAD_129_DIR, '*.png')))
for f in files:
    filename = os.path.basename(f)
    im = Image.open(f)
    
    # 1. Convert to 24-bit RGB
    if im.mode != 'RGB':
        im = im.convert('RGB')
    
    if im.size != (2048, 2732):
        im = im.resize((2048, 2732), Image.Resampling.LANCZOS)
    im.save(f, 'PNG', optimize=True)
    print(f"[iPad 12.9\" 2048x2732] {filename:25} -> 2048x2732 RGB ({os.path.getsize(f)/1024:.1f} KB)")
    
    # 2. iPad Pro 11\" (1668 x 2388)
    im_11 = im.resize((1668, 2388), Image.Resampling.LANCZOS)
    out_11 = os.path.join(IPAD_11_DIR, filename)
    im_11.save(out_11, 'PNG', optimize=True)
    print(f"  --> [iPad 11\" 1668x2388]   -> 1668x2388 RGB ({os.path.getsize(out_11)/1024:.1f} KB)")

print("=" * 65)
print("All iPad App Store screenshots processed and validated successfully!")
print("=" * 65)
