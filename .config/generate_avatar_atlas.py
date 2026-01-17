import os
import math
import re
import json
try:
    from PIL import Image
except ImportError:
    print("Pillow is not installed. Please install it using 'pip install Pillow'")
    exit(1)

# Configuration
SOURCE_DIR = '../public/resources/avatar'
OUTPUT_IMG_DIR = '../public/resources'
# Output JSON to app/utils so it can be imported by the Vue app
OUTPUT_JSON_DIR = '../app/utils' 

OUTPUT_FILENAME = 'avatar-atlas.webp'
OUTPUT_MAP_FILENAME = 'avatarAtlas.json'

CATEGORIES = ['acc', 'body', 'cloth', 'eyes', 'hair', 'mouth', 'extra']

def get_sort_key(filename):
    # Extract the number from 'acc-1.png'
    match = re.search(r'-(\d+)\.png$', filename)
    if match:
        return int(match.group(1))
    return 0

def main():
    # expand paths
    base_path = os.path.dirname(os.path.abspath(__file__))
    source_path = os.path.join(base_path, SOURCE_DIR)
    output_img_path = os.path.join(base_path, OUTPUT_IMG_DIR)
    output_json_path = os.path.join(base_path, OUTPUT_JSON_DIR)
    
    if not os.path.exists(output_img_path):
        os.makedirs(output_img_path)
    if not os.path.exists(output_json_path):
        os.makedirs(output_json_path)

    images_to_process = []
    
    # Initialize parts structure with arrays
    parts_structure = {cat: [] for cat in CATEGORIES}

    # Collect images in the specified order
    for category in CATEGORIES:
        # List all files in source directory
        if not os.path.exists(source_path):
             print(f"Source directory not found: {source_path}")
             return

        files = [f for f in os.listdir(source_path) 
                 if f.startswith(category + '-') and f.endswith('.png')]
        
        # Sort by the numeric part
        files.sort(key=get_sort_key)
        
        for f in files:
            images_to_process.append({
                'category': category,
                'filename': f,
                'path': os.path.join(source_path, f)
            })

    if not images_to_process:
        print("No images found.")
        return

    print(f"Found {len(images_to_process)} images to process.")

    # Open first image to get dimensions
    first_img = Image.open(images_to_process[0]['path'])
    img_width, img_height = first_img.size
    
    # Calculate grid size (try to make it square)
    count = len(images_to_process)
    grid_side = math.ceil(math.sqrt(count))
    
    atlas_width = grid_side * img_width
    atlas_height = grid_side * img_height
    
    print(f"Atlas Size: {atlas_width}x{atlas_height} (Grid: {grid_side}x{grid_side} items)")
    
    # Create new image (RGBA for transparency)
    atlas = Image.new('RGBA', (atlas_width, atlas_height), (0, 0, 0, 0))
    
    # Metadata to help frontend locate parts
    metadata = {
        'width': atlas_width,
        'height': atlas_height,
        'item_width': img_width,
        'item_height': img_height,
        'grid_size': grid_side,
        'parts': parts_structure
    }

    # Paste images
    for idx, item in enumerate(images_to_process):
        try:
            img_path = item['path']
            img = Image.open(img_path)
            
            # Basic validation
            if img.size != (img_width, img_height):
                print(f"Warning: {item['filename']} has different size {img.size}. Resizing to {img_width}x{img_height}")
                img = img.resize((img_width, img_height))
            
            col = idx % grid_side
            row = idx // grid_side
            
            x = col * img_width
            y = row * img_height
            
            atlas.paste(img, (x, y))
            
            # Store metadata
            cat = item['category']
            part_info = {
                'x': x,
                'y': y,
                'col': col,
                'row': row,
                'index': idx
            }
            # Append to the list for this category
            metadata['parts'][cat].append(part_info)
            
            print(f"Placed {item['filename']} at index {idx} ({col},{row})")
            
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    # Save Atlas
    final_output_image = os.path.join(output_img_path, OUTPUT_FILENAME)
    print(f"Saving atlas to {final_output_image}...")
    atlas.save(final_output_image, optimize=True)
    
    # Save Metadata
    final_output_json = os.path.join(output_json_path, OUTPUT_MAP_FILENAME)
    print(f"Saving metadata to {final_output_json}...")
    with open(final_output_json, 'w') as f:
        json.dump(metadata, f, indent=2)

    print("Done.")

if __name__ == "__main__":
    main()
