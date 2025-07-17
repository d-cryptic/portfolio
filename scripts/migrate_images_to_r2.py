#!/usr/bin/env python3
"""
Script to migrate all images from blog posts to AVIF format in Cloudflare R2 storage.

This script:
1. Scans all blog posts for image references (local paths and URLs)
2. Downloads/reads images from various sources
3. Converts images to AVIF format for optimal web performance
4. Uploads them to Cloudflare R2 with organized folder structure
5. Replaces the original image references with R2 URLs

Supported image formats: PNG, JPG, JPEG, GIF, WebP, SVG, BMP, TIFF
Supported image sources: Local files, HTTP/HTTPS URLs

Requirements:
- boto3 (for R2 interaction)
- requests (for downloading remote images)
- python-dotenv (for environment variables)
- Pillow (for image processing)

Usage:
    python migrate_images_to_r2.py

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
import requests
import tempfile
from pathlib import Path
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Tuple, Optional
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from PIL import Image
import mimetypes

# Load environment variables
load_dotenv()

class ImageToR2Migrator:
    def __init__(self):
        self.blog_content_dir = Path("src/content/blog")
        self.project_root = Path.cwd()
        self.r2_client = self._setup_r2_client()
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.r2_public_url = os.getenv("R2_PUBLIC_URL", f"https://{self.bucket_name}.r2.dev")
        
        # Supported image extensions
        self.image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif'}
        
        if not self.bucket_name:
            raise ValueError("R2_BUCKET_NAME environment variable is required")
    
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
    
    def find_image_references(self, file_path: Path) -> List[Tuple[str, str, str]]:
        """Find all image references in a markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        image_references = []
        
        # Pattern 1: Markdown image syntax ![alt](src)
        markdown_pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
        for match in re.finditer(markdown_pattern, content):
            alt_text = match.group(1)
            src = match.group(2)
            full_match = match.group(0)
            
            if self._is_image_url(src):
                image_references.append((full_match, alt_text, src))
        
        # Pattern 2: HTML img tags <img src="..." alt="..." />
        html_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*(?:alt=["\']([^"\']*)["\'][^>]*)?/?>'
        for match in re.finditer(html_pattern, content, re.IGNORECASE):
            src = match.group(1)
            alt_text = match.group(2) if match.group(2) else ""
            full_match = match.group(0)
            
            if self._is_image_url(src):
                image_references.append((full_match, alt_text, src))
        
        return image_references
    
    def _is_image_url(self, url: str) -> bool:
        """Check if URL points to an image"""
        # Skip images already hosted on our R2 endpoint
        if url.startswith('https://assets.barundebnath.com/'):
            return False
            
        # Check file extension
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        # Direct extension check
        if any(path.endswith(ext) for ext in self.image_extensions):
            return True
        
        # Check for query parameters that might hide extension
        if '?' in url:
            base_path = path.split('?')[0]
            if any(base_path.endswith(ext) for ext in self.image_extensions):
                return True
        
        # Check for common image hosting patterns
        image_hosts = ['imgur.com', 'i.imgur.com', 'github.com', 'githubusercontent.com', 
                      'unsplash.com', 'pexels.com', 'pixabay.com', 'giphy.com']
        
        if any(host in url.lower() for host in image_hosts):
            return True
        
        return False
    
    def resolve_image_path(self, image_src: str, blog_path: Path) -> Optional[str]:
        """Resolve image path to absolute path or URL"""
        # If it's already a full URL, return as-is
        if image_src.startswith(('http://', 'https://')):
            return image_src
        
        # Handle relative paths
        if image_src.startswith('./') or not image_src.startswith('/'):
            # Relative to blog post directory
            resolved_path = blog_path / image_src.lstrip('./')
            if resolved_path.exists():
                return str(resolved_path.resolve())
        
        # Handle absolute paths from project root
        if image_src.startswith('/'):
            resolved_path = self.project_root / image_src.lstrip('/')
            if resolved_path.exists():
                return str(resolved_path.resolve())
        
        # Try relative to src directory
        src_path = self.project_root / 'src' / image_src.lstrip('/')
        if src_path.exists():
            return str(src_path.resolve())
        
        # Try relative to public directory
        public_path = self.project_root / 'public' / image_src.lstrip('/')
        if public_path.exists():
            return str(public_path.resolve())
        
        print(f"    ⚠️  Could not resolve image path: {image_src}")
        return None
    
    def download_or_read_image(self, image_source: str) -> bytes:
        """Download image from URL or read from local file"""
        if image_source.startswith(('http://', 'https://')):
            # Download from URL
            try:
                response = requests.get(image_source, timeout=30, headers={
                    'User-Agent': 'Mozilla/5.0 (compatible image downloader)'
                })
                response.raise_for_status()
                return response.content
            except requests.RequestException as e:
                print(f"    ✗ Error downloading {image_source}: {e}")
                raise
        else:
            # Read from local file
            try:
                with open(image_source, 'rb') as f:
                    return f.read()
            except IOError as e:
                print(f"    ✗ Error reading {image_source}: {e}")
                raise
    
    def process_image(self, image_data: bytes, original_source: str) -> Tuple[bytes, str]:
        """Process image - convert to AVIF or keep as GIF"""
        # Check if it's a GIF - preserve GIFs as-is
        if original_source.lower().endswith('.gif'):
            return image_data, 'image/gif'
        
        # Convert other formats to AVIF
        with tempfile.NamedTemporaryFile() as temp_input:
            temp_input.write(image_data)
            temp_input.flush()
            
            try:
                with Image.open(temp_input.name) as img:
                    # Handle different image modes
                    if img.mode in ('RGBA', 'LA'):
                        # Images with transparency - composite on white background
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'RGBA':
                            background.paste(img, mask=img.split()[-1])
                        else:  # LA mode
                            background.paste(img.convert('RGBA'), mask=img.split()[-1])
                        img = background
                    elif img.mode not in ('RGB', 'L'):
                        # Convert other modes to RGB
                        img = img.convert('RGB')
                    
                    # Save as AVIF
                    with tempfile.NamedTemporaryFile(suffix='.avif') as temp_output:
                        # Optimize quality based on image type
                        quality = 85  # High quality for photos
                        if original_source.lower().endswith('.png'):
                            quality = 90  # Higher quality for graphics/screenshots
                        
                        img.save(temp_output.name, 'AVIF', quality=quality, speed=6)
                        
                        with open(temp_output.name, 'rb') as f:
                            return f.read(), 'image/avif'
                            
            except Exception as e:
                print(f"    ✗ Error converting image to AVIF: {e}")
                raise
    
    def generate_filename(self, original_source: str, alt_text: str, is_gif: bool = False) -> str:
        """Generate a unique filename for the image"""
        # Create a hash of the original source for uniqueness
        source_hash = hashlib.md5(original_source.encode()).hexdigest()[:8]
        
        # Extract original filename
        if original_source.startswith(('http://', 'https://')):
            parsed_url = urlparse(original_source)
            original_name = Path(parsed_url.path).stem
        else:
            original_name = Path(original_source).stem
        
        # Clean original name
        clean_name = re.sub(r'[^a-zA-Z0-9\-_]', '', original_name)[:30]
        
        # Clean alt text for filename
        clean_alt = re.sub(r'[^a-zA-Z0-9\s\-_]', '', alt_text)
        clean_alt = re.sub(r'\s+', '-', clean_alt.strip())[:30]
        
        # Choose extension based on whether it's a GIF or not
        extension = '.gif' if is_gif else '.avif'
        
        # Construct filename
        if clean_alt and clean_alt != clean_name:
            filename = f"{clean_alt}-{clean_name}-{source_hash}{extension}"
        elif clean_name:
            filename = f"{clean_name}-{source_hash}{extension}"
        else:
            filename = f"image-{source_hash}{extension}"
        
        # Ensure filename is not too long
        if len(filename) > 100:
            filename = f"image-{source_hash}{extension}"
        
        return filename
    
    def upload_to_r2(self, image_data: bytes, blog_folder: str, filename: str, content_type: str) -> str:
        """Upload image to R2 and return the public URL"""
        key = f"blogs/{blog_folder}/{filename}"
        
        try:
            self.r2_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=image_data,
                ContentType=content_type,
                CacheControl='public, max-age=31536000'  # Cache for 1 year
            )
            
            # Return the public URL
            return f"{self.r2_public_url}/{key}"
            
        except ClientError as e:
            print(f"    ✗ Error uploading to R2: {e}")
            raise
    
    def replace_image_references_in_file(self, file_path: Path, replacements: Dict[str, str]):
        """Replace image references with R2 URLs in the markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace each original reference with the corresponding R2 URL
        for original_ref, r2_url in replacements.items():
            content = content.replace(original_ref, original_ref.replace(
                re.search(r'\(([^)]+)\)', original_ref).group(1), r2_url
            ))
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def process_blog_post(self, blog_path: Path) -> int:
        """Process a single blog post and migrate its images"""
        print(f"Processing: {blog_path}")
        
        # Find index.mdx file
        mdx_file = blog_path / "index.mdx"
        if not mdx_file.exists():
            print(f"  No index.mdx found in {blog_path}")
            return 0
        
        # Find image references
        image_refs = self.find_image_references(mdx_file)
        if not image_refs:
            print(f"  No images found")
            return 0
        
        print(f"  Found {len(image_refs)} images")
        
        # Use blog folder name for R2 organization
        blog_folder = blog_path.name
        replacements = {}
        
        for full_match, alt_text, image_src in image_refs:
            try:
                print(f"    Processing: {image_src}")
                
                # Resolve image path
                resolved_source = self.resolve_image_path(image_src, blog_path)
                if not resolved_source:
                    continue
                
                # Download or read image
                image_data = self.download_or_read_image(resolved_source)
                
                # Process image (convert to AVIF or keep as GIF)
                processed_data, content_type = self.process_image(image_data, resolved_source)
                
                # Check if it's a GIF
                is_gif = resolved_source.lower().endswith('.gif')
                
                # Generate filename
                filename = self.generate_filename(resolved_source, alt_text, is_gif)
                format_info = "GIF (preserved)" if is_gif else "AVIF"
                print(f"    Uploading as: {filename} ({format_info})")
                
                # Upload to R2
                r2_url = self.upload_to_r2(processed_data, blog_folder, filename, content_type)
                replacements[full_match] = r2_url
                
                print(f"    ✓ Migrated to: {r2_url}")
                
            except Exception as e:
                print(f"    ✗ Failed to migrate {image_src}: {e}")
                continue
        
        # Replace image references in the file
        if replacements:
            self.replace_image_references_in_file(mdx_file, replacements)
            print(f"  ✓ Updated {len(replacements)} images in {mdx_file}")
        
        return len(replacements)
    
    def migrate_all_posts(self):
        """Migrate images in all blog posts"""
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
        print(f"Migration complete! Total images migrated: {total_migrated}")

def main():
    """Main function"""
    try:
        migrator = ImageToR2Migrator()
        migrator.migrate_all_posts()
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())