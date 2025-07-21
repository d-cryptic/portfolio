# D2 Diagram Migration to R2

This directory contains scripts to migrate D2 diagrams from blog posts to AVIF images stored in Cloudflare R2.

## Overview

The migration process:
1. Scans blog posts for D2 code blocks (````d2`)
2. Uses Docker to render D2 diagrams to PNG (more reliable than local CLI)
3. Adds rounded borders and converts to AVIF format
4. Uploads to Cloudflare R2 with organized folder structure
5. Replaces D2 blocks with image links in markdown files

## Prerequisites

1. **Docker**: Required for rendering D2 diagrams
   ```bash
   # Install Docker from https://docs.docker.com/get-docker/
   docker --version
   ```

2. **uv**: Python package manager (already in use)
   ```bash
   uv --version
   ```

3. **Cloudflare R2**: Storage bucket with API credentials

## Setup

### 1. Run the setup script
```bash
python scripts/setup_d2_migration.py
```

This will:
- Check if uv is available
- Set up the virtual environment (.venv)
- Install Python dependencies
- Check for .env file

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your R2 credentials:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
R2_ACCESS_KEY_ID=your_actual_access_key
R2_SECRET_ACCESS_KEY=your_actual_secret_key
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your_custom_domain.com  # Optional
```

### 3. Test Docker D2 setup
```bash
uv run python scripts/test_docker_d2.py
```

This will:
- Check Docker availability
- Pull the D2 Docker image if needed
- Test rendering a simple diagram

## Usage

### Test with dry-run (recommended first)
```bash
# Test on a specific blog post
uv run python scripts/docker_d2_to_r2.py --blog-post just-enough-c++-part-1 --dry-run --verbose

# Test on all blog posts
uv run python scripts/docker_d2_to_r2.py --dry-run --verbose
```

### Run actual migration
```bash
# Migrate a specific blog post
uv run python scripts/docker_d2_to_r2.py --blog-post just-enough-c++-part-1 --verbose

# Migrate all blog posts
uv run python scripts/docker_d2_to_r2.py --verbose
```

## Command Line Options

- `--blog-post BLOG_NAME`: Process only a specific blog post (folder name)
- `--dry-run`: Run without making actual changes (for testing)
- `--verbose` or `-v`: Enable verbose logging

## Current Status

Based on the scan, the following blog posts contain D2 diagrams:

### just-enough-c++-part-1
- **6 D2 diagrams** found:
  1. Two Pointers algorithm flowchart
  2. Sliding Window algorithm flowchart  
  3. Prefix Sum algorithm flowchart
  4. Binary Search algorithm flowchart
  5. DFS (Depth First Search) algorithm flowchart
  6. BFS (Breadth First Search) algorithm flowchart

## Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker ps

# Pull D2 image manually
docker pull terrastruct/d2

# Test D2 rendering manually
echo 'a -> b' > test.d2
docker run --rm -v $(pwd):/workspace terrastruct/d2 /workspace/test.d2 /workspace/test.png
```

### Python Environment Issues
```bash
# Recreate virtual environment
rm -rf .venv
uv venv
uv pip install -r scripts/requirements.txt
```

### R2 Upload Issues
- Verify your R2 credentials in `.env`
- Check bucket permissions
- Test with `--dry-run` first

## File Structure

```
scripts/
├── docker_d2_to_r2.py          # Main migration script (Docker-based)
├── migrate_d2_to_r2.py         # Original script (CLI-based, was failing)
├── test_docker_d2.py           # Test Docker D2 setup
├── setup_d2_migration.py       # Environment setup script
├── requirements.txt            # Python dependencies
└── D2_MIGRATION_README.md      # This file
```

## Advantages of Docker Approach

1. **Reliability**: No need to install D2 CLI locally
2. **Consistency**: Same environment across different machines
3. **Isolation**: No conflicts with local installations
4. **Debugging**: Easier to troubleshoot rendering issues
5. **Portability**: Works anywhere Docker is available

## Next Steps

1. Run the setup script
2. Test with dry-run mode
3. Migrate the `just-enough-c++-part-1` blog post
4. Verify the results in your blog
5. Migrate other blog posts if needed

## Support

If you encounter issues:
1. Check the verbose logs (`--verbose`)
2. Test individual components (Docker, D2 image, R2 credentials)
3. Use dry-run mode to debug without making changes
4. Check the generated filenames and URLs
