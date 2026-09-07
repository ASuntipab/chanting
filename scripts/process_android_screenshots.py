import os
import glob
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'screenshots')
PHONE_DIR = os.path.join(SCREENSHOTS_DIR, 'android_phone_1080x2400')
PROMO_DIR = os.path.join(SCREENSHOTS_DIR, 'android_feature_graphic_1024x500')
TAB7_DIR = os.path.join(SCREENSHOTS_DIR, 'android_tablet_7inch_1200x1920')
TAB10_DIR = os.path.join(SCREENSHOTS_DIR, 'android_tablet_10inch_1600x2560')

os.makedirs(TAB7_DIR, exist_ok=True)
os.makedirs(TAB10_DIR, exist_ok=True)

print("=" * 65)
print("Processing Android Google Play Screenshots...")
print(f"Source Phone: {PHONE_DIR}")
print("=" * 65)

# 1. Feature Graphic validation
fg_path = os.path.join(PROMO_DIR, 'feature_graphic_1024x500.png')
if os.path.exists(fg_path):
    im_fg = Image.open(fg_path)
    if im_fg.mode != 'RGB':
        im_fg = im_fg.convert('RGB')
    im_fg = im_fg.resize((1024, 500), Image.Resampling.LANCZOS)
    im_fg.save(fg_path, 'PNG', optimize=True)
    print(f"[Feature Graphic] {fg_path} -> 1024x500 RGB ({os.path.getsize(fg_path)/1024:.1f} KB)")

# 2. Phone screenshots
files = sorted(glob.glob(os.path.join(PHONE_DIR, '0*.png')))
for f in files:
    filename = os.path.basename(f)
    if 'feature_graphic' in filename:
        continue
    
    im = Image.open(f)
    if im.mode != 'RGB':
        im = im.convert('RGB')
    
    # Ensure exact 1080 x 2400
    if im.size != (1080, 2400):
        im = im.resize((1080, 2400), Image.Resampling.LANCZOS)
    im.save(f, 'PNG', optimize=True)
    print(f"[Phone 1080x2400] {filename:25} -> 1080x2400 RGB ({os.path.getsize(f)/1024:.1f} KB)")
    
    # 3. 7-inch Tablet (1200 x 1920)
    im_tab7 = im.resize((1200, 1920), Image.Resampling.LANCZOS)
    tab7_out = os.path.join(TAB7_DIR, filename)
    im_tab7.save(tab7_out, 'PNG', optimize=True)
    print(f"  --> [7\" Tablet 1200x1920]  -> 1200x1920 RGB ({os.path.getsize(tab7_out)/1024:.1f} KB)")
    
    # 4. 10-inch Tablet (1600 x 2560)
    im_tab10 = im.resize((1600, 2560), Image.Resampling.LANCZOS)
    tab10_out = os.path.join(TAB10_DIR, filename)
    im_tab10.save(tab10_out, 'PNG', optimize=True)
    print(f"  --> [10\" Tablet 1600x2560] -> 1600x2560 RGB ({os.path.getsize(tab10_out)/1024:.1f} KB)")

print("=" * 65)
print("All Android Google Play Store assets processed and validated successfully!")
print("=" * 65)
