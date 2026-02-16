import os
import re

# Paths
input_svg_path = "/home/abdo3342/Development/Shaykh-Abdelrahman-Hamada-Khalil-website/public/vecteezy_islamic-art-border-and-frame-for-inside-cover-prayer-book_13864745.svg"
output_tsx_path = "/home/abdo3342/Development/Shaykh-Abdelrahman-Hamada-Khalil-website/src/components/mushaf/frames/AuthenticFloralFrame.tsx"

def convert_svg_to_react():
    # 1. First pass: Find bounds (streaming)
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')
    found_any = False
    path_count = 0
    
    print(f"Opening {input_svg_path} for streaming bounds detection...")
    
    with open(input_svg_path, 'r') as f:
        for line in f:
            if '<path' in line and 'transform=' not in line:
                d_match = re.search(r'd="([^"]+)"', line)
                if d_match:
                    # Extract numbers from this specific path
                    nums = [float(x) for x in re.findall(r'-?\d*\.?\d+', d_match.group(1).replace(',', ' '))]
                    for i in range(0, len(nums), 2):
                        if i+1 < len(nums):
                            x, y = nums[i], nums[i+1]
                            if -100 <= x <= 2100 and -100 <= y <= 2100:
                                min_x = min(min_x, x)
                                max_x = max(max_x, x)
                                min_y = min(min_y, y)
                                max_y = max(max_y, y)
                                found_any = True
                path_count += 1
                if path_count > 200: # Plenty for a frame
                    break
    
    if not found_any:
        # Fallback to standard if detection fails
        viewbox_attr = 'viewBox="0 0 2000 2000"'
    else:
        padding = 15
        min_x = max(0, min_x - padding)
        min_y = max(0, min_y - padding)
        width = (max_x - min_x) + (padding * 2)
        height = (max_y - min_y) + (padding * 2)
        viewbox_attr = f'viewBox="{min_x:.2f} {min_y:.2f} {width:.2f} {height:.2f}"'
        print(f"Calculated ViewBox: {viewbox_attr}")

    # 2. Second pass: Process and write
    print("Generating React component...")
    target_color_rgb = 'rgb(0%, 60.742188%, 29.80957%)'
    
    with open(output_tsx_path, 'w') as out:
        out.write('import React from "react";\n\n')
        out.write('interface AuthenticFloralFrameProps {\n  color: string;\n}\n\n')
        out.write('export default function AuthenticFloralFrame({ color }: AuthenticFloralFrameProps) {\n')
        out.write('  return (\n')
        out.write('    <div className="absolute inset-0 w-full h-full pointer-events-none select-none">\n')
        
        with open(input_svg_path, 'r') as f:
            for line in f:
                # Basic cleaning
                if '<?xml' in line or '<rect' in line and 'fill="rgb(99.' in line:
                    continue
                
                # Replacements
                line = line.replace(target_color_rgb, '{color}')
                line = line.replace('xmlns:xlink', 'xmlnsXlink')
                line = line.replace('fill-opacity', 'fillOpacity')
                line = line.replace('stroke-width', 'strokeWidth')
                line = line.replace('stroke-linecap', 'strokeLinecap')
                line = line.replace('stroke-linejoin', 'strokeLinejoin')
                line = line.replace('stroke-miterlimit', 'strokeMiterlimit')
                line = line.replace('stroke-opacity', 'strokeOpacity')
                line = line.replace('fill-rule', 'fillRule')
                line = line.replace('class=', 'className=')
                line = line.replace('"{color}"', '{color}')
                
                # Apply viewBox & styles to root svg tag
                if '<svg' in line:
                    line = re.sub(r'viewBox="[^"]+"', viewbox_attr, line)
                    line = line.replace('<svg', '<svg className="w-full h-full" preserveAspectRatio="none"')
                
                out.write(line)
                
        out.write('\n    </div>\n  );\n}\n')

    print(f"Done! Saved to {output_tsx_path}")

if __name__ == "__main__":
    convert_svg_to_react()
