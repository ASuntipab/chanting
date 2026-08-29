import os
from PIL import Image, ImageDraw

def generate_icons():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_icon = os.path.join(base_dir, 'assets', 'icons', 'dharma_icon_hands.jpg')
    
    if not os.path.exists(src_icon):
        raise FileNotFoundError(f"Source icon not found at {src_icon}")
        
    img = Image.open(src_icon).convert("RGBA")
    
    # 1. Web / App Assets
    web_assets_dir = os.path.join(base_dir, 'src', 'assets')
    os.makedirs(web_assets_dir, exist_ok=True)
    
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(web_assets_dir, 'icon-512.png'), 'PNG')
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(web_assets_dir, 'icon-192.png'), 'PNG')
    img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(web_assets_dir, 'apple-touch-icon.png'), 'PNG')
    img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(web_assets_dir, 'favicon.png'), 'PNG')
    img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(web_assets_dir, 'favicon-32.png'), 'PNG')
    print("Generated Web & PWA icons in src/assets/")

    # 2. iOS AppIcon
    ios_icon_dir = os.path.join(base_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset')
    if os.path.exists(ios_icon_dir):
        img.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(ios_icon_dir, 'AppIcon-512@2x.png'), 'PNG')
        print(f"Generated iOS AppIcon (1024x1024) in {ios_icon_dir}")

    # 3. Android Mipmaps
    android_res_dir = os.path.join(base_dir, 'android', 'app', 'src', 'main', 'res')
    if os.path.exists(android_res_dir):
        android_specs = {
            'mipmap-mdpi': (48, 108),
            'mipmap-hdpi': (72, 162),
            'mipmap-xhdpi': (96, 216),
            'mipmap-xxhdpi': (144, 324),
            'mipmap-xxxhdpi': (192, 432)
        }
        
        for folder, (launcher_size, foreground_size) in android_specs.items():
            folder_path = os.path.join(android_res_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            
            # Standard square launcher
            img_square = img.resize((launcher_size, launcher_size), Image.Resampling.LANCZOS)
            img_square.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
            
            # Round launcher
            mask = Image.new('L', (launcher_size, launcher_size), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, launcher_size, launcher_size), fill=255)
            img_round = img_square.copy()
            img_round.putalpha(mask)
            img_round.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
            
            # Foreground for adaptive icon
            img_fore = img.resize((foreground_size, foreground_size), Image.Resampling.LANCZOS)
            img_fore.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
            
        print("Generated Android mipmap icons across all densities (mdpi to xxxhdpi)")

if __name__ == '__main__':
    generate_icons()
    print("All icons successfully generated and installed!")
