#!/usr/bin/env python3
"""
Setup script for D2 migration environment.
This script helps set up the Python environment and dependencies for D2 migration.
"""

import subprocess
import sys
from pathlib import Path

def check_uv():
    """Check if uv is available"""
    try:
        result = subprocess.run(['uv', '--version'], capture_output=True, check=True, text=True)
        print(f"✓ uv found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ uv not found. Please install uv first:")
        print("  curl -LsSf https://astral.sh/uv/install.sh | sh")
        return False

def setup_venv():
    """Setup virtual environment using uv"""
    venv_path = Path(".venv")
    
    if venv_path.exists():
        print("✓ Virtual environment already exists")
        return True
    
    try:
        print("Creating virtual environment with uv...")
        subprocess.run(['uv', 'venv'], check=True)
        print("✓ Virtual environment created")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to create virtual environment: {e}")
        return False

def install_dependencies():
    """Install Python dependencies using uv"""
    requirements_file = Path("scripts/requirements.txt")
    
    if not requirements_file.exists():
        print("✗ requirements.txt not found in scripts directory")
        return False
    
    try:
        print("Installing dependencies with uv...")
        subprocess.run(['uv', 'pip', 'install', '-r', str(requirements_file)], check=True)
        print("✓ Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists():
        print("⚠ .env file not found")
        if env_example.exists():
            print(f"  Please copy {env_example} to .env and fill in your R2 credentials:")
            print(f"  cp {env_example} .env")
        else:
            print("  Please create a .env file with your R2 credentials")
        return False
    
    # Check if required variables are present
    required_vars = [
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY', 
        'R2_ENDPOINT_URL',
        'R2_BUCKET_NAME'
    ]
    
    with open(env_file, 'r') as f:
        env_content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if f"{var}=" not in env_content or f"{var}=your_" in env_content:
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠ Missing or incomplete environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("  Please update your .env file with actual values")
        return False
    
    print("✓ .env file looks good")
    return True

def main():
    """Run setup"""
    print("Setting up D2 migration environment...")
    print("=" * 40)
    
    steps = [
        ("Checking uv", check_uv),
        ("Setting up virtual environment", setup_venv),
        ("Installing dependencies", install_dependencies),
        ("Checking environment file", check_env_file),
    ]
    
    all_passed = True
    for step_name, step_func in steps:
        print(f"\n{step_name}:")
        if not step_func():
            all_passed = False
    
    print("\n" + "=" * 40)
    if all_passed:
        print("✓ Setup complete!")
        print("\nNext steps:")
        print("1. Test Docker D2 setup:")
        print("   uv run python scripts/test_docker_d2.py")
        print("\n2. Run migration (dry-run first):")
        print("   uv run python scripts/docker_d2_to_r2.py --blog-post just-enough-c++-part-1 --dry-run --verbose")
        print("\n3. Run actual migration:")
        print("   uv run python scripts/docker_d2_to_r2.py --blog-post just-enough-c++-part-1 --verbose")
    else:
        print("✗ Setup incomplete. Please fix the issues above.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
