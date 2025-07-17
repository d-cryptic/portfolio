# Migration Scripts

This directory contains scripts for migrating content in the blog.

## Image Migration Scripts

### Mermaid to R2 Migration

The `migrate_mermaid_to_r2.py` script converts Mermaid diagrams in blog posts to AVIF images stored in Cloudflare R2.

### General Image Migration

The `migrate_images_to_r2.py` script migrates all images (local and remote) from blog posts to AVIF format in Cloudflare R2.

### Prerequisites

All dependencies are managed by devbox:

1. **Enter devbox environment**: `devbox shell`
2. **Install Python dependencies**: `uv pip install -r requirements.txt`

The devbox environment includes:

- Python 3.11 with uv package manager
- Node.js 20 with mermaid-cli (auto-installed on shell init)
- ImageMagick for SVG to PNG conversion

### Environment Variables

Create a `.env` file in the project root with:

```env
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your_custom_domain.com  # Optional
```

### Usage

```bash
# Enter devbox environment
devbox shell

# Run the Mermaid migration script
devbox run migrate-mermaid

# Run the general image migration script
devbox run migrate-images

# Or run directly
cd scripts && python migrate_mermaid_to_r2.py
cd scripts && python migrate_images_to_r2.py
```

### What the Mermaid script does

1. Scans all blog posts in `src/content/blog/*/index.mdx`
2. Finds Mermaid code blocks (`mermaid ... `)
3. Renders each diagram to PNG using mermaid-cli (neutral theme, transparent background)
4. Adds rounded borders and padding
5. Converts to AVIF format (high quality, small size)
6. Uploads AVIF images to R2 at `blogs/<blog-folder-name>/<diagram-name>.avif`
7. Replaces Mermaid code blocks with image markdown links

### What the image migration script does

1. Scans all blog posts in `src/content/blog/*/index.mdx`
2. Finds all image references (markdown `![](...)` and HTML `<img>` tags)
3. Supports both local file paths and remote URLs
4. Downloads/reads images from various sources
5. Converts images to AVIF format for optimal web performance (preserves GIFs as-is)
6. Uploads to R2 at `blogs/<blog-folder-name>/<image-name>.(avif|gif)`
7. Replaces original image references with R2 URLs

**Supported image formats:** PNG, JPG, JPEG, GIF, WebP, SVG, BMP, TIFF
**Supported sources:** Local files (relative/absolute paths), HTTP/HTTPS URLs

### File naming

Images are named based on diagram type and content hash:

- `flowchart-1-abc12345.avif`
- `sequence-2-def67890.avif`
- `class-1-ghi09876.avif`

### Error handling

- Skips diagrams that fail to render
- Continues processing other diagrams and posts
- Provides detailed progress output
