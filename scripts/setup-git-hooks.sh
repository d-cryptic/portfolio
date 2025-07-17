#!/bin/bash

# Script to set up git hooks for the portfolio project
# This script links the pre-commit hook to the .git/hooks directory

set -e

echo "🔧 Setting up git hooks..."

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Link the pre-commit hook
echo "📎 Linking pre-commit hook..."
if [ -f "$GIT_HOOKS_DIR/pre-commit" ]; then
    echo "⚠️  Existing pre-commit hook found. Backing up to pre-commit.backup"
    mv "$GIT_HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit.backup"
fi

# Create symlink to our pre-commit script
ln -sf "$SCRIPTS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"

# Make sure the hook is executable
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo "✅ Git hooks setup completed!"
echo "   Pre-commit hook will now run Giphy migration on each commit"
echo ""
echo "💡 To disable the hook temporarily, run:"
echo "   git commit --no-verify"