#!/usr/bin/env python3
"""
Script to migrate Mermaid diagrams from blog posts to AVIF images in Cloudflare R2 storage.

This script:
1. Scans all blog posts for Mermaid code blocks
2. Converts Mermaid diagrams to AVIF images using mermaid-cli
3. Uploads them to Cloudflare R2 with organized folder structure
4. Replaces the original Mermaid blocks with image links

Requirements:
- boto3 (for R2 interaction)
- python-dotenv (for environment variables)
- Pillow (for image processing)
- mermaid-cli (npm package for rendering)

Usage:
    python migrate_mermaid_to_r2.py

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
from PIL import Image

# Load environment variables
load_dotenv()

class MermaidToR2Migrator:
    def __init__(self):
        self.blog_content_dir = Path("src/content/blog")
        self.r2_client = self._setup_r2_client()
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.r2_public_url = os.getenv("R2_PUBLIC_URL", f"https://{self.bucket_name}.r2.dev")
        
        if not self.bucket_name:
            raise ValueError("R2_BUCKET_NAME environment variable is required")
        
        # Check if mermaid-cli is available
        self._check_mermaid_cli()
    
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
    
    def _check_mermaid_cli(self):
        """Check if mermaid-cli (mmdc) is available"""
        try:
            subprocess.run(['mmdc', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError(
                "mermaid-cli not found. Please install it with: npm install -g @mermaid-js/mermaid-cli"
            )
    
    def find_mermaid_blocks(self, file_path: Path) -> List[Tuple[str, int, int]]:
        """Find all Mermaid code blocks in a markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all mermaid code blocks with their positions
        mermaid_blocks = []
        lines = content.split('\n')
        
        i = 0
        while i < len(lines):
            if lines[i].strip() == '```mermaid':
                start_line = i
                i += 1
                mermaid_code = []
                
                # Find the end of the code block
                while i < len(lines) and lines[i].strip() != '```':
                    mermaid_code.append(lines[i])
                    i += 1
                
                if i < len(lines):  # Found closing ```
                    end_line = i
                    mermaid_blocks.append(('\n'.join(mermaid_code), start_line, end_line))
                
            i += 1
        
        return mermaid_blocks
    
    def render_mermaid_to_png(self, mermaid_code: str) -> str:
        """Render Mermaid code directly to PNG using mermaid-cli"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as mmd_file:
            mmd_file.write(mermaid_code)
            mmd_file_path = mmd_file.name
        
        png_file_path = mmd_file_path.replace('.mmd', '.png')
        
        try:
            # Use mermaid-cli to render PNG with neutral theme and transparent background
            subprocess.run([
                'mmdc',
                '-i', mmd_file_path,
                '-o', png_file_path,
                '-t', 'neutral',     # Neutral theme (works well with transparent background)
                '-b', 'transparent', # Transparent background
                '--scale', '2'       # Higher resolution
            ], check=True, capture_output=True)
            
            return png_file_path
            
        except subprocess.CalledProcessError as e:
            print(f"Error rendering Mermaid diagram: {e}")
            raise
        finally:
            # Clean up mermaid file
            if os.path.exists(mmd_file_path):
                os.unlink(mmd_file_path)
    
    def add_rounded_border_and_convert_to_avif(self, png_path: str) -> bytes:
        """Add rounded border to PNG and convert to AVIF format"""
        avif_path = png_path.replace('.png', '.avif')
        
        try:
            with Image.open(png_path) as img:
                # Ensure RGBA mode for transparency handling
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Add padding for the border
                padding = 20
                new_width = img.width + (padding * 2)
                new_height = img.height + (padding * 2)
                
                # Create new image with padding
                padded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
                padded_img.paste(img, (padding, padding))
                
                # Create rounded rectangle mask
                mask = Image.new('L', (new_width, new_height), 0)
                from PIL import ImageDraw
                draw = ImageDraw.Draw(mask)
                
                # Draw rounded rectangle (radius = 12px)
                radius = 12
                draw.rounded_rectangle(
                    [(0, 0), (new_width, new_height)], 
                    radius=radius, 
                    fill=255
                )
                
                # Apply mask to create rounded corners
                rounded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
                rounded_img.paste(padded_img, (0, 0))
                rounded_img.putalpha(mask)
                
                # Add subtle border
                border_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
                border_draw = ImageDraw.Draw(border_img)
                border_draw.rounded_rectangle(
                    [(1, 1), (new_width-1, new_height-1)], 
                    radius=radius, 
                    outline=(200, 200, 200, 100),  # Light gray border with transparency
                    width=2
                )
                
                # Composite border with rounded image
                final_img = Image.alpha_composite(rounded_img, border_img)
                
                # Convert to RGB with white background for AVIF
                background = Image.new('RGB', final_img.size, (255, 255, 255))
                background.paste(final_img, mask=final_img.split()[-1])
                
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
    
    def generate_filename(self, mermaid_code: str, index: int) -> str:
        """Generate a unique filename for the diagram"""
        # Create a hash of the mermaid code for uniqueness
        code_hash = hashlib.md5(mermaid_code.encode()).hexdigest()[:8]
        
        # Extract diagram type from first line
        first_line = mermaid_code.strip().split('\n')[0]
        diagram_type = 'diagram'
        
        if 'graph' in first_line.lower():
            diagram_type = 'flowchart'
        elif 'sequenceDiagram' in first_line:
            diagram_type = 'sequence'
        elif 'classDiagram' in first_line:
            diagram_type = 'class'
        elif 'gitgraph' in first_line.lower():
            diagram_type = 'gitgraph'
        elif 'pie' in first_line.lower():
            diagram_type = 'pie'
        
        return f"{diagram_type}-{index + 1}-{code_hash}.avif"
    
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
    
    def replace_mermaid_blocks_in_file(self, file_path: Path, replacements: List[Tuple[int, int, str]]):
        """Replace Mermaid blocks with image links in the markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Sort replacements by start line in reverse order to avoid index shifting
        replacements.sort(key=lambda x: x[0], reverse=True)
        
        for start_line, end_line, image_url in replacements:
            # Replace the entire mermaid block with an image
            image_markdown = f"![Mermaid Diagram]({image_url})\n"
            lines[start_line:end_line + 1] = [image_markdown]
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
    
    def process_blog_post(self, blog_path: Path) -> int:
        """Process a single blog post and migrate its Mermaid diagrams"""
        print(f"Processing: {blog_path}")
        
        # Find index.mdx file
        mdx_file = blog_path / "index.mdx"
        if not mdx_file.exists():
            print(f"  No index.mdx found in {blog_path}")
            return 0
        
        # Find Mermaid blocks
        mermaid_blocks = self.find_mermaid_blocks(mdx_file)
        if not mermaid_blocks:
            print(f"  No Mermaid diagrams found")
            return 0
        
        print(f"  Found {len(mermaid_blocks)} Mermaid diagrams")
        
        # Use blog folder name for R2 organization
        blog_folder = blog_path.name
        replacements = []
        
        for index, (mermaid_code, start_line, end_line) in enumerate(mermaid_blocks):
            try:
                print(f"    Processing diagram {index + 1}/{len(mermaid_blocks)}")
                
                # Render Mermaid directly to PNG with neutral theme and transparent background
                png_path = self.render_mermaid_to_png(mermaid_code)
                
                # Add rounded border and convert PNG to AVIF
                avif_data = self.add_rounded_border_and_convert_to_avif(png_path)
                
                # Generate filename
                filename = self.generate_filename(mermaid_code, index)
                print(f"    Uploading as: {filename}")
                
                # Upload to R2
                r2_url = self.upload_to_r2(avif_data, blog_folder, filename)
                replacements.append((start_line, end_line, r2_url))
                
                print(f"    ✓ Migrated to: {r2_url}")
                
            except Exception as e:
                print(f"    ✗ Failed to migrate diagram {index + 1}: {e}")
                continue
        
        # Replace Mermaid blocks in the file
        if replacements:
            self.replace_mermaid_blocks_in_file(mdx_file, replacements)
            print(f"  ✓ Updated {len(replacements)} diagrams in {mdx_file}")
        
        return len(replacements)
    
    def migrate_all_posts(self):
        """Migrate Mermaid diagrams in all blog posts"""
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
        migrator = MermaidToR2Migrator()
        migrator.migrate_all_posts()
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())