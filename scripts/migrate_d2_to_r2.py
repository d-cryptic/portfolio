#!/usr/bin/env python3
"""
Script to migrate D2 diagrams from blog posts to AVIF images in Cloudflare R2 storage.

This script:
1. Scans all blog posts for D2 code blocks
2. Converts D2 diagrams to AVIF images using d2 CLI
3. Uploads them to Cloudflare R2 with organized folder structure
4. Replaces the original D2 blocks with image links

Requirements:
- boto3 (for R2 interaction)
- python-dotenv (for environment variables)
- Pillow (for image processing)
- d2 (CLI tool for rendering D2 diagrams)

Usage:
    python migrate_d2_to_r2.py

Environment variables required:
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_ENDPOINT_URL
- R2_BUCKET_NAME
- R2_PUBLIC_URL (optional, for custom domain)
"""

import os
import re
import hashlib
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Tuple
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from PIL import Image, ImageDraw

# Load environment variables
load_dotenv()

class D2ToR2Migrator:
    def __init__(self):
        self.blog_content_dir = Path("src/content/blog")
        self.r2_client = self._setup_r2_client()
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.r2_public_url = os.getenv("R2_PUBLIC_URL", f"https://{self.bucket_name}.r2.dev")
        
        if not self.bucket_name:
            raise ValueError("R2_BUCKET_NAME environment variable is required")
        
        # Check if d2 CLI is available
        self._check_d2_cli()
    
    def _setup_r2_client(self):
        """Setup Cloudflare R2 client using boto3"""
        access_key = os.getenv("R2_ACCESS_KEY_ID")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        endpoint_url = os.getenv("R2_ENDPOINT_URL")
        
        if not all([access_key, secret_key, endpoint_url]):
            raise ValueError("R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL) are required")
        
        return boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'
        )
    
    def _check_d2_cli(self):
        """Check if d2 CLI is available"""
        try:
            subprocess.run(['d2', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError(
                "d2 CLI not found. Please install it from: https://d2lang.com/tour/install"
            )
    
    def find_d2_blocks(self, file_path: Path) -> List[Tuple[str, int, int]]:
        """Find all D2 code blocks in a markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all d2 code blocks with their positions
        d2_blocks = []
        lines = content.split('\n')
        
        i = 0
        while i < len(lines):
            if lines[i].strip() == '```d2':
                start_line = i
                i += 1
                d2_code = []
                
                # Find the end of the code block
                while i < len(lines) and lines[i].strip() != '```':
                    d2_code.append(lines[i])
                    i += 1
                
                if i < len(lines):  # Found closing ```
                    end_line = i
                    d2_blocks.append(('\n'.join(d2_code), start_line, end_line))
                
            i += 1
        
        return d2_blocks
    
    def render_d2_to_png(self, d2_code: str) -> str:
        """Render D2 code to PNG using d2 CLI"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.d2', delete=False) as d2_file:
            d2_file.write(d2_code)
            d2_file_path = d2_file.name
        
        png_file_path = d2_file_path.replace('.d2', '.png')
        
        try:
            # Use d2 CLI to render PNG with neutral theme
            subprocess.run([
                'd2',
                '--theme', '0',                # Neutral Default theme
                '--pad', '20',                 # Add padding
                '--scale', '2',                # Higher resolution
                d2_file_path,
                png_file_path
            ], check=True, capture_output=True)
            
            return png_file_path
            
        except subprocess.CalledProcessError as e:
            print(f"Error rendering D2 diagram: {e}")
            if e.stderr:
                print(f"Error details: {e.stderr.decode()}")
            raise
        finally:
            # Clean up d2 file
            if os.path.exists(d2_file_path):
                os.unlink(d2_file_path)
    
    def add_rounded_corners_and_convert_to_avif(self, png_path: str) -> bytes:
        """Add rounded corners to PNG and convert to AVIF format (no borders)"""
        avif_path = png_path.replace('.png', '.avif')

        try:
            with Image.open(png_path) as img:
                # Ensure RGBA mode for transparency handling
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')

                # Add minimal padding
                padding = 10
                new_width = img.width + (padding * 2)
                new_height = img.height + (padding * 2)

                # Create new image with padding
                padded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
                padded_img.paste(img, (padding, padding))

                # Create rounded rectangle mask
                mask = Image.new('L', (new_width, new_height), 0)
                draw = ImageDraw.Draw(mask)

                # Draw rounded rectangle (radius = 8px, smaller radius)
                radius = 8
                draw.rounded_rectangle(
                    [(0, 0), (new_width, new_height)],
                    radius=radius,
                    fill=255
                )

                # Apply mask to create rounded corners
                rounded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
                rounded_img.paste(padded_img, (0, 0))
                rounded_img.putalpha(mask)

                # Convert to RGB with white background for AVIF (no border)
                background = Image.new('RGB', rounded_img.size, (255, 255, 255))
                background.paste(rounded_img, mask=rounded_img.split()[-1])

                background.save(avif_path, 'AVIF', quality=85, speed=6)

            # Read AVIF data
            with open(avif_path, 'rb') as f:
                avif_data = f.read()

            return avif_data

        finally:
            # Clean up temporary files
            for temp_path in [png_path, avif_path]:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
    
    def generate_filename(self, d2_code: str, index: int) -> str:
        """Generate a unique filename for the diagram"""
        # Create a hash of the d2 code for uniqueness
        code_hash = hashlib.md5(d2_code.encode()).hexdigest()[:8]
        
        # Try to extract a meaningful name from the first few lines
        lines = d2_code.strip().split('\n')
        diagram_name = 'diagram'
        
        # Look for shape labels that might give context
        for line in lines[:10]:  # Check first 10 lines
            if 'label:' in line:
                # Extract label content
                match = re.search(r'label:\s*"([^"]+)"', line)
                if match:
                    label = match.group(1)
                    # Take first few words and clean
                    words = label.split()[:3]
                    clean_words = [re.sub(r'[^a-zA-Z0-9]', '', w).lower() for w in words]
                    clean_words = [w for w in clean_words if w]  # Remove empty strings
                    if clean_words:
                        diagram_name = '-'.join(clean_words)
                        break
        
        # Check for common D2 patterns
        if 'isPalindrome' in d2_code:
            diagram_name = 'two-pointers'
        elif 'maxSum' in d2_code and 'window' in d2_code.lower():
            diagram_name = 'sliding-window'
        elif 'buildPrefixSum' in d2_code or 'rangeSum' in d2_code:
            diagram_name = 'prefix-sum'
        
        return f"{diagram_name}-{index + 1}-{code_hash}.avif"
    
    def upload_to_r2(self, avif_data: bytes, blog_folder: str, filename: str) -> str:
        """Upload AVIF to R2 and return the public URL"""
        key = f"blogs/{blog_folder}/{filename}"
        
        try:
            self.r2_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=avif_data,
                ContentType='image/avif',
                CacheControl='public, max-age=31536000'  # Cache for 1 year
            )
            
            # Return the public URL
            return f"{self.r2_public_url}/{key}"
            
        except ClientError as e:
            print(f"Error uploading to R2: {e}")
            raise
    
    def replace_d2_blocks_in_file(self, file_path: Path, replacements: List[Tuple[int, int, str]]):
        """Replace D2 blocks with image links in the markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Sort replacements by start line in reverse order to avoid index shifting
        replacements.sort(key=lambda x: x[0], reverse=True)
        
        for start_line, end_line, image_url in replacements:
            # Replace the entire d2 block with an image
            image_markdown = f"![D2 Diagram]({image_url})\n"
            lines[start_line:end_line + 1] = [image_markdown]
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
    
    def process_blog_post(self, blog_path: Path) -> int:
        """Process a single blog post and migrate its D2 diagrams"""
        print(f"Processing: {blog_path}")
        
        # Find index.mdx file
        mdx_file = blog_path / "index.mdx"
        if not mdx_file.exists():
            print(f"  No index.mdx found in {blog_path}")
            return 0
        
        # Find D2 blocks
        d2_blocks = self.find_d2_blocks(mdx_file)
        if not d2_blocks:
            print(f"  No D2 diagrams found")
            return 0
        
        print(f"  Found {len(d2_blocks)} D2 diagrams")
        
        # Use blog folder name for R2 organization
        blog_folder = blog_path.name
        replacements = []
        
        for index, (d2_code, start_line, end_line) in enumerate(d2_blocks):
            try:
                print(f"    Processing diagram {index + 1}/{len(d2_blocks)}")
                
                # Render D2 to PNG
                png_path = self.render_d2_to_png(d2_code)
                
                # Add rounded corners and convert PNG to AVIF (no borders)
                avif_data = self.add_rounded_corners_and_convert_to_avif(png_path)
                
                # Generate filename
                filename = self.generate_filename(d2_code, index)
                print(f"    Uploading as: {filename}")
                
                # Upload to R2
                r2_url = self.upload_to_r2(avif_data, blog_folder, filename)
                replacements.append((start_line, end_line, r2_url))
                
                print(f"    ✓ Migrated to: {r2_url}")
                
            except Exception as e:
                print(f"    ✗ Failed to migrate diagram {index + 1}: {e}")
                continue
        
        # Replace D2 blocks in the file
        if replacements:
            self.replace_d2_blocks_in_file(mdx_file, replacements)
            print(f"  ✓ Updated {len(replacements)} diagrams in {mdx_file}")
        
        return len(replacements)
    
    def migrate_all_posts(self):
        """Migrate D2 diagrams in all blog posts"""
        if not self.blog_content_dir.exists():
            print(f"Blog content directory not found: {self.blog_content_dir}")
            return
        
        total_migrated = 0
        blog_posts = [d for d in self.blog_content_dir.iterdir() if d.is_dir()]
        
        print(f"Found {len(blog_posts)} blog posts to process")
        print("-" * 50)
        
        for blog_path in blog_posts:
            try:
                migrated_count = self.process_blog_post(blog_path)
                total_migrated += migrated_count
            except Exception as e:
                print(f"Error processing {blog_path}: {e}")
                continue
            
            print()
        
        print("-" * 50)
        print(f"Migration complete! Total diagrams migrated: {total_migrated}")

def main():
    """Main function"""
    try:
        migrator = D2ToR2Migrator()
        migrator.migrate_all_posts()
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())