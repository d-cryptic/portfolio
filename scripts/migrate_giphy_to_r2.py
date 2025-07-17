#!/usr/bin/env python3
"""
Script to migrate Giphy links from blog posts to Cloudflare R2 storage.

This script:
1. Scans all blog posts for Giphy links
2. Downloads the GIFs from Giphy
3. Uploads them to Cloudflare R2 with organized folder structure
4. Replaces the original links in blog posts

Requirements:
- boto3 (for R2 interaction)
- requests (for downloading GIFs)
- python-dotenv (for environment variables)

Usage:
    python migrate_giphy_to_r2.py

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
from pathlib import Path
from urllib.parse import urlparse
from typing import List, Dict, Tuple
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GiphyToR2Migrator:
    def __init__(self):
        self.blog_content_dir = Path("src/content/blog")
        self.r2_client = self._setup_r2_client()
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.r2_public_url = os.getenv("R2_PUBLIC_URL", f"https://{self.bucket_name}.r2.dev")
        
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
    
    def find_giphy_links(self, file_path: Path) -> List[Tuple[str, str]]:
        """Find all Giphy links in a markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Regex to match Giphy links in markdown format
        giphy_pattern = r'!\[([^\]]*)\]\((https://media[0-9]*\.giphy\.com/[^)]+)\)'
        matches = re.findall(giphy_pattern, content)
        
        return matches
    
    def download_gif(self, url: str) -> bytes:
        """Download GIF from Giphy URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except requests.RequestException as e:
            print(f"Error downloading {url}: {e}")
            raise
    
    def generate_filename(self, original_url: str, alt_text: str) -> str:
        """Generate a unique filename for the GIF"""
        # Extract original filename or create one from URL
        parsed_url = urlparse(original_url)
        original_name = Path(parsed_url.path).name
        
        # Create a hash of the URL for uniqueness
        url_hash = hashlib.md5(original_url.encode()).hexdigest()[:8]
        
        # Clean alt text for filename
        clean_alt = re.sub(r'[^a-zA-Z0-9\s-]', '', alt_text)
        clean_alt = re.sub(r'\s+', '-', clean_alt.strip())[:50]
        
        if clean_alt:
            filename = f"{clean_alt}-{url_hash}.gif"
        else:
            filename = f"giphy-{url_hash}.gif"
        
        return filename
    
    def upload_to_r2(self, gif_data: bytes, blog_folder: str, filename: str) -> str:
        """Upload GIF to R2 and return the public URL"""
        key = f"blogs/{blog_folder}/{filename}"
        
        try:
            self.r2_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=gif_data,
                ContentType='image/gif',
                CacheControl='public, max-age=31536000'  # Cache for 1 year
            )
            
            # Return the public URL
            return f"{self.r2_public_url}/{key}"
            
        except ClientError as e:
            print(f"Error uploading to R2: {e}")
            raise
    
    def replace_links_in_file(self, file_path: Path, replacements: Dict[str, str]):
        """Replace Giphy links with R2 links in the markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace each Giphy URL with the corresponding R2 URL
        for giphy_url, r2_url in replacements.items():
            content = content.replace(giphy_url, r2_url)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def process_blog_post(self, blog_path: Path) -> int:
        """Process a single blog post and migrate its Giphy links"""
        print(f"Processing: {blog_path}")
        
        # Find index.mdx file
        mdx_file = blog_path / "index.mdx"
        if not mdx_file.exists():
            print(f"  No index.mdx found in {blog_path}")
            return 0
        
        # Find Giphy links
        giphy_links = self.find_giphy_links(mdx_file)
        if not giphy_links:
            print(f"  No Giphy links found")
            return 0
        
        print(f"  Found {len(giphy_links)} Giphy links")
        
        # Use blog folder name for R2 organization
        blog_folder = blog_path.name
        replacements = {}
        
        for alt_text, giphy_url in giphy_links:
            try:
                print(f"    Downloading: {giphy_url}")
                gif_data = self.download_gif(giphy_url)
                
                filename = self.generate_filename(giphy_url, alt_text)
                print(f"    Uploading as: {filename}")
                
                r2_url = self.upload_to_r2(gif_data, blog_folder, filename)
                replacements[giphy_url] = r2_url
                
                print(f"    ✓ Migrated to: {r2_url}")
                
            except Exception as e:
                print(f"    ✗ Failed to migrate {giphy_url}: {e}")
                continue
        
        # Replace links in the file
        if replacements:
            self.replace_links_in_file(mdx_file, replacements)
            print(f"  ✓ Updated {len(replacements)} links in {mdx_file}")
        
        return len(replacements)
    
    def migrate_all_posts(self):
        """Migrate Giphy links in all blog posts"""
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
        print(f"Migration complete! Total links migrated: {total_migrated}")

def main():
    """Main function"""
    try:
        migrator = GiphyToR2Migrator()
        migrator.migrate_all_posts()
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())