"""
Generate icons for the PWA
Requires PIL (Pillow): pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a new image with green background
    img = Image.new('RGB', (size, size), color='#4CAF50')
    draw = ImageDraw.Draw(img)
    
    # Calculate pill dimensions
    pill_width = int(size * 0.52)
    pill_height = int(size * 0.21)
    pill_x = (size - pill_width) // 2
    pill_y = (size - pill_height) // 2
    pill_radius = pill_height // 2
    
    # Draw pill shape (rounded rectangle)
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_width, pill_y + pill_height],
        radius=pill_radius,
        fill='white'
    )
    
    # Draw plus sign on the pill
    plus_size = int(size * 0.12)
    plus_thickness = int(size * 0.05)
    center_x = size // 2
    center_y = size // 2
    
    # Vertical bar of plus
    draw.rectangle(
        [center_x - plus_thickness//2, center_y - plus_size//2,
         center_x + plus_thickness//2, center_y + plus_size//2],
        fill='#4CAF50'
    )
    
    # Horizontal bar of plus
    draw.rectangle(
        [center_x - plus_size//2, center_y - plus_thickness//2,
         center_x + plus_size//2, center_y + plus_thickness//2],
        fill='#4CAF50'
    )
    
    # Save the image
    img.save(filename, 'PNG')
    print(f'Created {filename}')

if __name__ == '__main__':
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Generate both icon sizes
    create_icon(192, 'icon-192.png')
    create_icon(512, 'icon-512.png')
    
    print('Icons generated successfully!')
