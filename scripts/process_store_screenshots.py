import os
import glob
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'screenshots')
SRC_DIR = os.path.join(SCREENSHOTS_DIR, 'ios_6.5_1284x2778')

DIR_65_ALT = os.path.join(SCREENSHOTS_DIR, 'ios_6.5_1242x2688')
DIR_67 = os.path.join(SCREENSHOTS_DIR, 'ios_6.7_1290x2796')

os.makedirs(DIR_65_ALT, exist_ok=True)
os.makedirs(DIR_67, exist_ok=True)

files = sorted(glob.glob(os.path.join(SRC_DIR, '*.png')))

print("=" * 65)
print("Processing App Store Screenshots...")
print(f"Source: {SRC_DIR}")
print("=" * 65)

for f in files:
    filename = os.path.basename(f)
    im = Image.open(f)
    
    # 1. Ensure 24-bit RGB (no alpha channel for App Store Connect)
    if im.mode != 'RGB':
        im_rgb = im.convert('RGB')
    else:
        im_rgb = im
    
    im_rgb.save(f, 'PNG', optimize=True)
    w_src, h_src = im_rgb.size
    print(f"[Primary 6.5\" 1284x2778] {filename:25} -> {w_src}x{h_src} RGB ({os.path.getsize(f)/1024:.1f} KB)")
    
    # 2. Generate 1242 x 2688 (iPhone 6.5\" Alternative Standard)
    im_65_alt = im_rgb.resize((1242, 2688), Image.Resampling.LANCZOS)
    out_65_alt = os.path.join(DIR_65_ALT, filename)
    im_65_alt.save(out_65_alt, 'PNG', optimize=True)
    print(f"  --> [6.5\" Alt 1242x2688]  -> 1242x2688 RGB ({os.path.getsize(out_65_alt)/1024:.1f} KB)")
    
    # 3. Generate 1290 x 2796 (iPhone 6.7\" Standard)
    im_67 = im_rgb.resize((1290, 2796), Image.Resampling.LANCZOS)
    out_67 = os.path.join(DIR_67, filename)
    im_67.save(out_67, 'PNG', optimize=True)
    print(f"  --> [6.7\" Tier 1290x2796] -> 1290x2796 RGB ({os.path.getsize(out_67)/1024:.1f} KB)")

print("=" * 65)
print("All screenshot tiers generated and validated successfully!")
print("=" * 65)
