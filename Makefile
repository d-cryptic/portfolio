# Portfolio Makefile

.PHONY: help install-scripts migrate-giphy dev build preview clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install-scripts  - Install Python dependencies for scripts"
	@echo "  make migrate-giphy    - Migrate Giphy links to Cloudflare R2"
	@echo "  make dev              - Start development server"
	@echo "  make build            - Build the project"
	@echo "  make preview          - Preview production build"
	@echo "  make clean            - Clean build artifacts"

# Install Python dependencies for scripts
install-scripts:
	@echo "Installing Python dependencies for scripts..."
	cd scripts && uv venv 
	cd scripts && /bin/bash -c "source .venv/bin/activate" && uv pip install -r requirements.txt

# Migrate Giphy links to Cloudflare R2
migrate-giphy:
	@echo "Migrating Giphy links to Cloudflare R2..."
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Please copy .env.example to .env and configure your R2 credentials."; \
		exit 1; \
	fi
	cd scripts && uv run migrate_giphy_to_r2.py

# Development server
dev:
	npm run dev

# Build project
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf .astro