#!/usr/bin/env python3
"""
Docker-based script to migrate D2 diagrams from blog posts to AVIF images in Cloudflare R2 storage.

This script:
1. Uses Docker to render D2 diagrams (more reliable than local CLI)
2. Scans all blog posts for D2 code blocks
3. Converts D2 diagrams to AVIF images using Docker + d2 CLI
4. Uploads them to Cloudflare R2 with organized folder structure
5. Replaces the original D2 blocks with image links

Requirements:
- Docker (for rendering D2 diagrams)
- boto3 (for R2 interaction)
- python-dotenv (for environment variables)
- Pillow (for image processing)

Usage:
    python docker_d2_to_r2.py [--blog-post BLOG_NAME] [--dry-run] [--verbose]

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
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from PIL import Image, ImageDraw

# Load environment variables
load_dotenv()

class DockerD2ToR2Migrator:
    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.blog_content_dir = Path("src/content/blog")
        self.verbose = verbose
        self.dry_run = dry_run
        
        # Setup logging
        log_level = logging.DEBUG if verbose else logging.INFO
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        if not self.dry_run:
            self.r2_client = self._setup_r2_client()
            self.bucket_name = os.getenv("R2_BUCKET_NAME")
            self.r2_public_url = os.getenv("R2_PUBLIC_URL", f"https://{self.bucket_name}.r2.dev")
            
            if not self.bucket_name:
                raise ValueError("R2_BUCKET_NAME environment variable is required")
        
        # Check if Docker is available
        self._check_docker()
        
        # Pull D2 Docker image if needed
        self._ensure_d2_image()
    
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
    
    def _check_docker(self):
        """Check if Docker is available"""
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, check=True, text=True)
            self.logger.info(f"Docker found: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError(
                "Docker not found. Please install Docker from: https://docs.docker.com/get-docker/"
            )
    
    def _ensure_d2_image(self):
        """Ensure D2 Docker image is available"""
        try:
            # Check if image exists locally
            result = subprocess.run([
                'docker', 'images', 'terrastruct/d2', '--format', '{{.Repository}}:{{.Tag}}'
            ], capture_output=True, check=True, text=True)
            
            if 'terrastruct/d2' in result.stdout:
                self.logger.info("D2 Docker image found locally")
            else:
                self.logger.info("Pulling D2 Docker image...")
                subprocess.run(['docker', 'pull', 'terrastruct/d2'], check=True)
                self.logger.info("D2 Docker image pulled successfully")
                
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to ensure D2 Docker image: {e}")
            raise RuntimeError("Failed to setup D2 Docker image")
    
    def find_d2_blocks_with_headings(self, file_path: Path) -> List[Tuple[str, int, int, str]]:
        """Find all D2 code blocks in a markdown file with their preceding headings"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find all d2 code blocks with their positions and headings
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

                    # Find the preceding heading
                    heading = self._find_preceding_heading(lines, start_line)

                    d2_blocks.append(('\n'.join(d2_code), start_line, end_line, heading))

            i += 1

        return d2_blocks

    def _find_preceding_heading(self, lines: List[str], d2_start_line: int) -> str:
        """Find the most recent heading before the D2 block"""
        # Look backwards from the D2 block to find a heading
        for i in range(d2_start_line - 1, -1, -1):
            line = lines[i].strip()

            # Check for markdown headings (### or ##)
            if line.startswith('###') and not line.startswith('####'):
                # Extract heading text (remove ### and clean up)
                heading = line.replace('###', '').strip()
                return heading
            elif line.startswith('##') and not line.startswith('###'):
                # Extract heading text (remove ## and clean up)
                heading = line.replace('##', '').strip()
                return heading

        # Fallback to generic name if no heading found
        return "Algorithm Diagram"
    
    def render_d2_to_png_with_docker(self, d2_code: str) -> str:
        """Render D2 code to PNG using Docker"""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create D2 input file
            d2_file = temp_path / "diagram.d2"
            with open(d2_file, 'w', encoding='utf-8') as f:
                f.write(d2_code)
            
            # Output PNG file
            png_file = temp_path / "diagram.png"
            
            try:
                # Run D2 in Docker container
                docker_cmd = [
                    'docker', 'run', '--rm',
                    '-v', f"{temp_path}:/workspace",
                    'terrastruct/d2',
                    '--theme', '1',                # Vanilla Nitro - light theme
                    '--pad', '0',                  # No padding (we'll add it ourselves)
                    '--scale', '2',                # Higher resolution
                    '/workspace/diagram.d2',
                    '/workspace/diagram.png'
                ]
                
                self.logger.debug(f"Running Docker command: {' '.join(docker_cmd)}")
                result = subprocess.run(docker_cmd, capture_output=True, check=True, text=True)
                
                if result.stderr:
                    self.logger.debug(f"D2 stderr: {result.stderr}")
                
                # Copy PNG to a permanent location
                permanent_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                permanent_png.close()
                
                with open(png_file, 'rb') as src, open(permanent_png.name, 'wb') as dst:
                    dst.write(src.read())
                
                return permanent_png.name
                
            except subprocess.CalledProcessError as e:
                self.logger.error(f"Error rendering D2 diagram with Docker: {e}")
                if e.stderr:
                    self.logger.error(f"Docker stderr: {e.stderr}")
                raise
    
    def add_rounded_corners_and_convert_to_avif(self, png_path: str) -> bytes:
        """Add rounded corners to PNG and convert to AVIF format (no borders)"""
        avif_path = png_path.replace('.png', '.avif')

        try:
            with Image.open(png_path) as img:
                # Ensure RGBA mode for transparency handling
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')

                # Add padding
                padding = 20
                new_width = img.width + (padding * 2)
                new_height = img.height + (padding * 2)

                # Create new image with transparent padding
                padded_img = Image.new('RGBA', (new_width, new_height), (255, 255, 255, 0))
                padded_img.paste(img, (padding, padding), img)

                # Create rounded rectangle mask
                mask = Image.new('L', (new_width, new_height), 0)
                draw = ImageDraw.Draw(mask)

                # Draw rounded rectangle
                radius = 12
                draw.rounded_rectangle(
                    [(0, 0), (new_width - 1, new_height - 1)],
                    radius=radius,
                    fill=255
                )

                # Create final image with white background
                final_img = Image.new('RGB', (new_width, new_height), (255, 255, 255))
                
                # Paste the padded image using the mask
                final_img.paste(padded_img, (0, 0), mask)

                final_img.save(avif_path, 'AVIF', quality=85, speed=6)

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
        elif 'binarySearch' in d2_code:
            diagram_name = 'binary-search'
        elif 'dfs' in d2_code.lower():
            diagram_name = 'dfs'
        elif 'bfs' in d2_code.lower():
            diagram_name = 'bfs'

        return f"{diagram_name}-{index + 1}-{code_hash}.avif"

    def upload_to_r2(self, avif_data: bytes, blog_folder: str, filename: str) -> str:
        """Upload AVIF to R2 and return the public URL"""
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would upload {filename} to R2")
            return f"https://example.com/blogs/{blog_folder}/{filename}"

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
            self.logger.error(f"Error uploading to R2: {e}")
            raise

    def replace_d2_blocks_in_file(self, file_path: Path, replacements: List[Tuple[int, int, str, str]]):
        """Replace D2 blocks with image links in the markdown file"""
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would replace {len(replacements)} D2 blocks in {file_path}")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Sort replacements by start line in reverse order to avoid index shifting
        replacements.sort(key=lambda x: x[0], reverse=True)

        for start_line, end_line, image_url, heading in replacements:
            # Replace the entire d2 block with an image using the heading as alt text
            image_markdown = f"![{heading}]({image_url})\n"
            lines[start_line:end_line + 1] = [image_markdown]

        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

    def process_blog_post(self, blog_path: Path) -> int:
        """Process a single blog post and migrate its D2 diagrams"""
        self.logger.info(f"Processing: {blog_path}")

        # Find index.mdx file
        mdx_file = blog_path / "index.mdx"
        if not mdx_file.exists():
            self.logger.warning(f"  No index.mdx found in {blog_path}")
            return 0

        # Find D2 blocks with headings
        d2_blocks = self.find_d2_blocks_with_headings(mdx_file)
        if not d2_blocks:
            self.logger.info(f"  No D2 diagrams found")
            return 0

        self.logger.info(f"  Found {len(d2_blocks)} D2 diagrams")

        # Use blog folder name for R2 organization
        blog_folder = blog_path.name
        replacements = []

        for index, (d2_code, start_line, end_line, heading) in enumerate(d2_blocks):
            try:
                self.logger.info(f"    Processing diagram {index + 1}/{len(d2_blocks)}")

                # Render D2 to PNG using Docker
                png_path = self.render_d2_to_png_with_docker(d2_code)

                # Add rounded corners and convert PNG to AVIF (no borders)
                avif_data = self.add_rounded_corners_and_convert_to_avif(png_path)

                # Generate filename
                filename = self.generate_filename(d2_code, index)
                self.logger.info(f"    Generated filename: {filename}")

                # Upload to R2
                r2_url = self.upload_to_r2(avif_data, blog_folder, filename)
                replacements.append((start_line, end_line, r2_url, heading))

                self.logger.info(f"    ✓ Migrated to: {r2_url}")

            except Exception as e:
                self.logger.error(f"    ✗ Failed to migrate diagram {index + 1}: {e}")
                if self.verbose:
                    import traceback
                    self.logger.debug(traceback.format_exc())
                continue

        # Replace D2 blocks in the file
        if replacements:
            self.replace_d2_blocks_in_file(mdx_file, replacements)
            self.logger.info(f"  ✓ Updated {len(replacements)} diagrams in {mdx_file}")

        return len(replacements)

    def migrate_all_posts(self, specific_blog: Optional[str] = None):
        """Migrate D2 diagrams in all blog posts or a specific one"""
        if not self.blog_content_dir.exists():
            self.logger.error(f"Blog content directory not found: {self.blog_content_dir}")
            return

        total_migrated = 0

        if specific_blog:
            # Process only the specified blog post
            blog_path = self.blog_content_dir / specific_blog
            if not blog_path.exists() or not blog_path.is_dir():
                self.logger.error(f"Blog post not found: {blog_path}")
                return
            blog_posts = [blog_path]
        else:
            # Process all blog posts
            blog_posts = [d for d in self.blog_content_dir.iterdir() if d.is_dir()]

        self.logger.info(f"Found {len(blog_posts)} blog post(s) to process")
        self.logger.info("-" * 50)

        for blog_path in blog_posts:
            try:
                migrated_count = self.process_blog_post(blog_path)
                total_migrated += migrated_count
            except Exception as e:
                self.logger.error(f"Error processing {blog_path}: {e}")
                if self.verbose:
                    import traceback
                    self.logger.debug(traceback.format_exc())
                continue

            self.logger.info("")

        self.logger.info("-" * 50)
        self.logger.info(f"Migration complete! Total diagrams migrated: {total_migrated}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Migrate D2 diagrams to R2 using Docker")
    parser.add_argument(
        '--blog-post',
        help='Process only a specific blog post (folder name)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without making actual changes (for testing)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    try:
        migrator = DockerD2ToR2Migrator(verbose=args.verbose, dry_run=args.dry_run)
        migrator.migrate_all_posts(specific_blog=args.blog_post)
    except Exception as e:
        print(f"Error: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
